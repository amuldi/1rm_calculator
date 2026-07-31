import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const APP_URL = process.env.QA_APP_URL || "http://127.0.0.1:5173";
const CHROME_PORT = Number(process.env.QA_CHROME_PORT ? process.env.QA_CHROME_PORT : 9400 + (process.pid % 500));
const SHOULD_START_SERVER = process.env.QA_START_SERVER === "1";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fixture dates are relative to "now" so the flow stays valid (workout dates inside the
// analytics 30-day window, goal target dates in the future) no matter when this runs.
function shiftDays(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}
function toISODateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function toDotDateLabel(date) {
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
}

const WORKOUT_DATE_INPUT = toISODateInput(shiftDays(-10));
const EDIT_DATE = shiftDays(-11);
const EDIT_DATE_INPUT = toISODateInput(EDIT_DATE);
const EDIT_DATE_LABEL = toDotDateLabel(EDIT_DATE);
const GOAL_TARGET_DATE_INPUT = toISODateInput(shiftDays(28));

function spawnProcess(command, args, options = {}) {
  return spawn(command, args, {
    stdio: options.stdio || "ignore",
    shell: options.shell ?? false,
    ...options,
  });
}

function resolveChromeBin() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;

  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];

  return candidates.find((candidate) => candidate.startsWith("/") && existsSync(candidate))
    || "google-chrome";
}

async function waitForHttp(url, processRef, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  let exited = false;
  let exitCode = null;
  processRef?.once?.("exit", (code) => {
    exited = true;
    exitCode = code;
  });

  while (Date.now() < deadline) {
    if (exited) {
      throw new Error(`Server process exited before ${url} was ready. Exit code: ${exitCode}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function waitForTarget() {
  for (let index = 0; index < 80; index += 1) {
    try {
      const targets = await fetchJson(`http://127.0.0.1:${CHROME_PORT}/json`);
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(125);
  }
  throw new Error("Chrome DevTools target was not available");
}

function createClient(wsUrl, diagnostics) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const callbacks = new Map();

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
      diagnostics.push(`${msg.params.type}: ${msg.params.args.map((arg) => arg.value || arg.description || "").join(" ")}`);
    }
    if (msg.method === "Runtime.exceptionThrown") {
      diagnostics.push(`exception: ${msg.params.exceptionDetails.text}`);
    }
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
  });

  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const msgId = ++id;
          ws.send(JSON.stringify({ id: msgId, method, params }));
          return new Promise((done) => callbacks.set(msgId, done));
        },
        close() {
          ws.close();
        },
      });
    });
    ws.addEventListener("error", reject);
  });
}

async function evalJs(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.result.exceptionDetails) {
    throw new Error(JSON.stringify(result.result.exceptionDetails));
  }
  return result.result.result.value;
}

async function waitForText(client, text, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const body = await evalJs(client, "document.body?.innerText || ''");
    if (body.includes(text)) return body;
    await sleep(150);
  }
  return evalJs(client, "document.body?.innerText || ''");
}

async function waitForCondition(client, expression, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evalJs(client, expression)) return true;
    await sleep(150);
  }
  return false;
}

function assertCheck(checks, name, value) {
  checks[name] = Boolean(value);
}

async function clickButton(client, text) {
  // Matches both <button> and <a> (react-router's Link renders a real anchor for crawlable nav).
  return evalJs(client, `
    (() => {
      const button = [...document.querySelectorAll("button, a")].find((item) => item.innerText.includes(${JSON.stringify(text)}));
      button?.click();
      return Boolean(button);
    })()
  `);
}

async function runFlow(client) {
  const checks = {};

  const health = await fetchJson(`${APP_URL}/health.json`);
  assertCheck(checks, "health endpoint", health.service === "1rm-calculator" && health.status === "ok");

  await waitForText(client, "첫 기록을 시작하세요");
  assertCheck(checks, "dashboard onboarding", await evalJs(client, `
    document.body.innerText.includes("1RM 계산") &&
    document.body.innerText.includes("세션 기록") &&
    document.body.innerText.includes("목표 설정")
  `));

  await clickButton(client, "분석");
  await waitForText(client, "분석할 기록이 없습니다");
  assertCheck(checks, "empty analytics cta", await evalJs(client, `
    document.body.innerText.includes("분석할 기록이 없습니다") &&
    document.body.innerText.includes("기록하러 가기")
  `));

  await clickButton(client, "계산기");
  await waitForText(client, "1RM 계산기");
  await clickButton(client, "운동을 선택하세요");
  await sleep(200);
  await clickButton(client, "벤치프레스");
  await sleep(200);
  assertCheck(checks, "exercise selected", await evalJs(client, `document.body.innerText.includes("Bench Press")`));

  await evalJs(client, `
    (() => {
      const inputs = [...document.querySelectorAll("input")];
      const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      const textareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      const setValue = (input, value) => {
        inputSetter.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      };
      setValue(inputs.find((input) => input.placeholder === "100"), "100");
      setValue(inputs.find((input) => input.placeholder === "5"), "5");
      setValue(inputs.find((input) => input.placeholder === "1"), "3");
      setValue(inputs.find((input) => input.placeholder === "8"), "8");
      setValue(inputs.find((input) => input.type === "date"), ${JSON.stringify(WORKOUT_DATE_INPUT)});
      const note = document.querySelector("textarea");
      textareaSetter.call(note, "검증 기록");
      note.dispatchEvent(new Event("input", { bubbles: true }));
      note.dispatchEvent(new Event("change", { bubbles: true }));
      [...document.querySelectorAll("button")].find((button) => button.innerText.includes("1RM 계산하기"))?.click();
    })()
  `);
  await waitForText(client, "예상 1RM");
  assertCheck(checks, "calculation result", await evalJs(client, `
    document.body.innerText.includes("예상 1RM") &&
    document.body.innerText.includes("추정 신뢰도") &&
    document.body.innerText.includes("벤치프레스")
  `));

  await clickButton(client, "분석");
  await waitForText(client, "최근 해석");
  assertCheck(checks, "analytics with record", await evalJs(client, `
    document.body.innerText.includes("최근 해석") &&
    (document.body.innerText.includes("평균 RPE") || document.body.innerText.includes("최근 PR 후보"))
  `));

  await clickButton(client, "계산기");
  await waitForText(client, "기록 목록");
  await clickButton(client, "벤치프레스");
  await sleep(200);
  await evalJs(client, `document.querySelector('button[aria-label="기록 수정"]')?.click()`);
  const editReady = await waitForCondition(client, `
    Boolean(
      [...document.querySelectorAll("input")].find((input) => input.getAttribute("aria-label") === "수정할 세트 수") &&
      [...document.querySelectorAll("input")].find((input) => input.getAttribute("aria-label") === "수정할 날짜")
    )
  `);
  if (!editReady) {
    throw new Error("Record edit form did not open.");
  }
  await evalJs(client, `
    (() => {
      const inputs = [...document.querySelectorAll("input")];
      const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      const setValue = (input, value) => {
        if (!input) throw new Error("Expected edit input was not found");
        inputSetter.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      };
      setValue(inputs.find((input) => input.getAttribute("aria-label") === "수정할 세트 수"), "4");
      setValue(inputs.find((input) => input.getAttribute("aria-label") === "수정할 날짜"), ${JSON.stringify(EDIT_DATE_INPUT)});
      [...document.querySelectorAll("button")].find((button) => button.innerText.includes("저장"))?.click();
    })()
  `);
  await waitForText(client, "4세트");
  assertCheck(checks, "edit record", await evalJs(client, `
    document.body.innerText.includes("4세트") &&
    document.body.innerText.includes(${JSON.stringify(EDIT_DATE_LABEL)})
  `));

  await clickButton(client, "운동을 선택하세요");
  await sleep(200);
  await clickButton(client, "벤치프레스");
  await sleep(200);
  await evalJs(client, `
    (() => {
      const inputs = [...document.querySelectorAll("input")];
      const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      const setValue = (input, value) => {
        inputSetter.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      };
      setValue(inputs.find((input) => input.placeholder && input.placeholder.includes("목표 1RM")), "140");
      setValue(inputs.find((input) => input.getAttribute("aria-label") === "목표 날짜"), ${JSON.stringify(GOAL_TARGET_DATE_INPUT)});
      [...document.querySelectorAll("button")].find((button) => button.innerText.includes("저장"))?.click();
    })()
  `);
  await waitForText(client, "목표 140");
  assertCheck(checks, "goal planning", await evalJs(client, `
    document.body.innerText.includes("목표 140") &&
    (document.body.innerText.includes("주당 약") || document.body.innerText.includes("주당 필요 증가량"))
  `));

  await clickButton(client, "영양");
  await waitForText(client, "영양 기록");
  await evalJs(client, `
    (() => {
      const inputs = [...document.querySelectorAll("input")];
      const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      const setValue = (input, value) => {
        if (!input) throw new Error("Expected meal input was not found");
        inputSetter.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      };
      setValue(inputs.find((input) => input.placeholder === "예: 닭가슴살 샐러드"), "검증 식사");
      setValue(inputs.find((input) => input.placeholder === "350"), "350");
      setValue(inputs.find((input) => input.placeholder === "30"), "30");
      [...document.querySelectorAll("button")].find((button) => button.innerText.includes("식사 추가하기"))?.click();
    })()
  `);
  await waitForText(client, "검증 식사");
  assertCheck(checks, "nutrition meal logged", await evalJs(client, `
    document.body.innerText.includes("검증 식사") &&
    document.body.innerText.includes("식사 목록") &&
    document.body.innerText.includes("350kcal")
  `));

  await evalJs(client, `
    (() => {
      const inputs = [...document.querySelectorAll("input")];
      const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      const setValue = (input, value) => {
        if (!input) throw new Error("Expected goal input was not found");
        inputSetter.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      };
      setValue(inputs.find((input) => input.placeholder === "70"), "80");
      [...document.querySelectorAll("button")].find((button) => button.innerText.includes("목표로 저장"))?.click();
    })()
  `);
  await waitForText(client, "현재 목표");
  assertCheck(checks, "nutrition goal auto-calc", await evalJs(client, `
    document.body.innerText.includes("자동 계산 결과") &&
    document.body.innerText.includes("현재 목표")
  `));

  await clickButton(client, "홈");
  await waitForText(client, "최근 4주");
  assertCheck(checks, "dashboard summary", await evalJs(client, `
    document.body.innerText.includes("최근 4주") &&
    document.body.innerText.includes("목표 달성률") &&
    document.body.innerText.includes("오늘의 컨디션") &&
    document.body.innerText.includes("오늘 칼로리")
  `));

  await clickButton(client, "프로필");
  await waitForText(client, "서비스 상태");
  assertCheck(checks, "profile operations", await evalJs(client, `
    document.body.innerText.includes("데이터 백업") &&
    document.body.innerText.includes("데이터 처리 안내") &&
    document.body.innerText.includes("출시 준비도") &&
    document.body.innerText.includes("진단 정보") &&
    document.body.innerText.includes("식사")
  `));

  await client.send("Page.navigate", { url: `${APP_URL}/privacy?skipSplash` });
  await waitForText(client, "데이터 처리 안내");
  assertCheck(checks, "privacy route", await evalJs(client, `
    document.body.innerText.includes("저장하는 데이터") &&
    document.body.innerText.includes("사용자 제어")
  `));

  await client.send("Page.navigate", { url: `${APP_URL}/readiness?skipSplash` });
  await waitForText(client, "출시 준비도");
  assertCheck(checks, "readiness route", await evalJs(client, `
    document.body.innerText.includes("Firebase 설정값") &&
    document.body.innerText.includes("VITE_FIREBASE_API_KEY") &&
    document.body.innerText.includes("성능 예산") &&
    document.body.innerText.includes("CI 품질 게이트") &&
    document.body.innerText.includes("다음 실행 순서")
  `));

  await client.send("Page.navigate", { url: `${APP_URL}/diagnostics?skipSplash` });
  await waitForText(client, "진단 정보");
  assertCheck(checks, "diagnostics route", await evalJs(client, `
    document.body.innerText.includes("진단 정보") &&
    document.body.innerText.includes("최근 오류 없음") &&
    document.body.innerText.includes("지원 패키지") &&
    document.body.innerText.includes("JSON 다운로드") &&
    document.body.innerText.includes("복사")
  `));

  await client.send("Page.navigate", { url: `${APP_URL}/calculator?skipSplash` });
  await waitForText(client, "기록 목록");
  await evalJs(client, `window.confirm = () => true`);
  await evalJs(client, `document.querySelector('button[aria-label="기록 삭제"]')?.click()`);
  await sleep(300);
  assertCheck(checks, "delete record", await evalJs(client, `!document.body.innerText.includes("검증 기록")`));

  return checks;
}

function summarize(checks, diagnostics) {
  const failed = Object.entries(checks)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  return {
    passed: failed.length === 0 && diagnostics.length === 0,
    checks,
    failed,
    diagnostics,
  };
}

let server = null;
let chrome = null;
let client = null;
let profile = null;

try {
  if (SHOULD_START_SERVER) {
    const npmCli = process.env.npm_execpath;
    server = npmCli
      ? spawnProcess(process.execPath, [npmCli, "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"])
      : spawnProcess("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"], { shell: true });
    await sleep(1200);
  }

  profile = await mkdtemp(join(tmpdir(), "1rm-chrome-"));
  const diagnostics = [];
  const chromeBin = resolveChromeBin();
  chrome = spawnProcess(chromeBin, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${CHROME_PORT}`,
    `${APP_URL}/?skipSplash`,
  ], { detached: true });
  chrome.once("error", (error) => {
    diagnostics.push(`chrome: failed to launch ${chromeBin}: ${error.message}`);
  });

  client = await createClient(await waitForTarget(), diagnostics);
  await client.send("Runtime.enable");
  await client.send("Page.enable");

  const checks = await runFlow(client);
  const result = summarize(checks, diagnostics);
  console.log(JSON.stringify(result, null, 2));

  if (!result.passed) {
    process.exitCode = 1;
  }
} finally {
  client?.close();
  chrome?.kill("SIGTERM");
  server?.kill("SIGTERM");
  await sleep(500);
  if (profile) await rm(profile, { recursive: true, force: true });
}
