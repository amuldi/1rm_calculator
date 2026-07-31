import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const APP_URL = process.env.QA_APP_URL || "http://127.0.0.1:5173";
const CHROME_PORT = Number(process.env.QA_CHROME_PORT ? process.env.QA_CHROME_PORT : 9500 + (process.pid % 500));
const SHOULD_START_SERVER = process.env.QA_START_SERVER === "1";
const OUT_DIR = fileURLToPath(new URL("../docs/images", import.meta.url));

const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };
const DESKTOP_VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const BENCH_DATE_INPUT = toISODateInput(shiftDays(-2));
const SQUAT_DATE_INPUT = toISODateInput(shiftDays(-6));
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
  return candidates.find((candidate) => candidate.startsWith("/") && existsSync(candidate)) || "google-chrome";
}

async function waitForHttp(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
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

function createClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const callbacks = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
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

async function clickButton(client, text) {
  return evalJs(client, `
    (() => {
      const button = [...document.querySelectorAll("button")].find((item) => item.innerText.includes(${JSON.stringify(text)}));
      button?.click();
      return Boolean(button);
    })()
  `);
}

function setValueSnippet(placeholderOrLabel, matchBy, value) {
  const matcher = matchBy === "aria-label"
    ? `input.getAttribute("aria-label") === ${JSON.stringify(placeholderOrLabel)}`
    : `input.placeholder === ${JSON.stringify(placeholderOrLabel)}`;
  return `
    (() => {
      const input = [...document.querySelectorAll("input")].find((input) => ${matcher});
      if (!input) throw new Error("input not found: ${placeholderOrLabel}");
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    })()
  `;
}

async function selectExercise(client, optionText) {
  // Structural lookup (label -> next sibling's trigger button) instead of matching the
  // trigger's own text, because after the first pick it no longer reads "운동을 선택하세요".
  // Polls instead of a fixed sleep since the dropdown's open animation timing can vary
  // (e.g. slower first paint right after a cold dev-server start).
  await evalJs(client, `
    (async () => {
      const deadline = Date.now() + 5000;
      let trigger = null;
      while (Date.now() < deadline) {
        const label = [...document.querySelectorAll("label")].find((el) => el.textContent === "운동 종목");
        trigger = label?.nextElementSibling?.querySelector("button");
        if (trigger) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (!trigger) throw new Error("exercise dropdown trigger not found");
      trigger.click();

      let option = null;
      while (Date.now() < deadline) {
        option = [...document.querySelectorAll("button")].find((el) => el.innerText.includes(${JSON.stringify(optionText)}));
        if (option) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (!option) throw new Error("exercise option not found: ${optionText}");
      option.click();
    })()
  `);
  await sleep(200);
}

async function screenshot(client, fileName) {
  const { data } = (await client.send("Page.captureScreenshot", { format: "png" })).result;
  const path = join(OUT_DIR, fileName);
  await writeFile(path, Buffer.from(data, "base64"));
  console.log(`saved ${fileName}`);
}

async function buildFixtureData(client) {
  // Force light mode to match the existing screenshot set's tone.
  await client.send("Page.navigate", { url: `${APP_URL}/?skipSplash` });
  await sleep(600);
  await evalJs(client, `
    localStorage.setItem("1rm-ui", JSON.stringify({ state: { isDark: false, unit: "kg", selectedFormula: "epley", activeTab: "dashboard" }, version: 1 }));
  `);
  await client.send("Page.navigate", { url: `${APP_URL}/calculator?skipSplash` });
  await waitForText(client, "1RM 계산기");

  // First workout record: squat, a few days ago.
  await selectExercise(client, "스쿼트");
  await evalJs(client, setValueSnippet("100", "placeholder", "140"));
  await evalJs(client, setValueSnippet("5", "placeholder", "5"));
  await evalJs(client, setValueSnippet("1", "placeholder", "1"));
  await evalJs(client, setValueSnippet("8", "placeholder", "8"));
  await evalJs(client, `
    (() => {
      const input = document.querySelector('input[type="date"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, ${JSON.stringify(SQUAT_DATE_INPUT)});
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    })()
  `);
  await clickButton(client, "1RM 계산하기");
  await waitForText(client, "예상 1RM");

  // Second workout record: bench press, more recent, becomes the "last 1RM".
  await selectExercise(client, "벤치프레스");
  await evalJs(client, setValueSnippet("100", "placeholder", "100"));
  await evalJs(client, setValueSnippet("5", "placeholder", "5"));
  await evalJs(client, setValueSnippet("1", "placeholder", "3"));
  await evalJs(client, setValueSnippet("8", "placeholder", "8"));
  await evalJs(client, `
    (() => {
      const input = document.querySelector('input[type="date"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, ${JSON.stringify(BENCH_DATE_INPUT)});
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    })()
  `);
  await clickButton(client, "1RM 계산하기");
  await waitForText(client, "예상 1RM");

  // Goal for the currently selected exercise (bench press).
  await evalJs(client, setValueSnippet("목표 1RM (kg)", "placeholder", "140"));
  await evalJs(client, setValueSnippet("목표 날짜", "aria-label", GOAL_TARGET_DATE_INPUT));
  await clickButton(client, "저장");
  await waitForText(client, "목표 140");

  // Capture here: use1RM's result/goal state is component-local and resets on navigation,
  // so the calculator screenshot must happen in the same visit that built the fixture data.
  // Scroll so the result card (with the goal progress bar) is in frame, not just the form.
  await evalJs(client, `
    (() => {
      const heading = [...document.querySelectorAll("p")].find((el) => el.textContent === "예상 1RM");
      const card = heading?.closest(".card-accent, .card");
      if (card) {
        const top = card.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.max(0, top - 24), behavior: "instant" });
      }
    })()
  `);
  await sleep(400);
  await screenshot(client, "screenshot-calculator.png");

  // Nutrition: one meal plus an auto-calculated goal.
  await client.send("Page.navigate", { url: `${APP_URL}/nutrition?skipSplash` });
  await waitForText(client, "영양 기록");
  await evalJs(client, setValueSnippet("예: 닭가슴살 샐러드", "placeholder", "닭가슴살 샐러드"));
  await evalJs(client, setValueSnippet("350", "placeholder", "420"));
  await evalJs(client, setValueSnippet("30", "placeholder", "38"));
  await evalJs(client, setValueSnippet("20", "placeholder", "35"));
  await evalJs(client, setValueSnippet("10", "placeholder", "12"));
  await clickButton(client, "식사 추가하기");
  await waitForText(client, "닭가슴살 샐러드");

  await evalJs(client, setValueSnippet("70", "placeholder", "76"));
  await clickButton(client, "목표로 저장");
  await waitForText(client, "현재 목표");
}

async function scrollToMealList(client) {
  await evalJs(client, `
    (() => {
      const heading = [...document.querySelectorAll("span")].find((el) => el.textContent === "식사 목록");
      const card = heading?.closest(".card");
      if (card) {
        const top = card.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.max(0, top - 24), behavior: "instant" });
      }
    })()
  `);
  await sleep(300);
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
    await waitForHttp(`${APP_URL}/health.json`);
  }

  profile = await mkdtemp(join(tmpdir(), "1rm-capture-"));
  const chromeBin = resolveChromeBin();
  chrome = spawnProcess(chromeBin, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${CHROME_PORT}`,
    "about:blank",
  ], { detached: true });

  client = await createClient(await waitForTarget());
  await client.send("Runtime.enable");
  await client.send("Page.enable");
  await client.send("Emulation.setDeviceMetricsOverride", VIEWPORT);

  // buildFixtureData captures screenshot-calculator.png itself: the result card and goal
  // progress it fills in are component-local React state that resets on navigation, so it
  // has to happen in the same page visit that builds the data.
  await buildFixtureData(client);

  // Nutrition: meal list + today's summary + goal auto-calc. Meals/goal are persisted via
  // zustand, so a fresh navigation here still shows them.
  await client.send("Page.navigate", { url: `${APP_URL}/nutrition?skipSplash` });
  await waitForText(client, "닭가슴살 샐러드");
  await scrollToMealList(client);
  await screenshot(client, "screenshot-nutrition.png");

  // Dashboard: workout stats, nutrition gauges, condition summary, PR board, goal progress.
  await client.send("Page.navigate", { url: `${APP_URL}/dashboard?skipSplash` });
  await waitForText(client, "최근 4주");
  await sleep(400);
  await screenshot(client, "screenshot-dashboard.png");

  // Analytics: period stats, insight text, charts.
  await client.send("Page.navigate", { url: `${APP_URL}/analytics?skipSplash` });
  await waitForText(client, "최근 해석");
  await sleep(400);
  await screenshot(client, "screenshot-analytics.png");

  // Desktop web layout (same fixture data, wider viewport): shows the horizontal nav and
  // multi-column grid that the mobile captures above don't demonstrate.
  await client.send("Emulation.setDeviceMetricsOverride", DESKTOP_VIEWPORT);
  await client.send("Page.navigate", { url: `${APP_URL}/dashboard?skipSplash` });
  await waitForText(client, "최근 4주");
  await sleep(400);
  await screenshot(client, "screenshot-dashboard-web.png");

  console.log("done");
} finally {
  client?.close();
  chrome?.kill("SIGTERM");
  server?.kill("SIGTERM");
  await sleep(500);
  if (profile) await rm(profile, { recursive: true, force: true });
}
