import { existsSync, readFileSync } from "node:fs";
import { auditFirebaseEnvConsistency } from "../src/lib/syncConfig.js";
import { getSupportConfig } from "../src/lib/supportConfig.js";

const ENV_FILES = [".env", ".env.local", ".env.production", ".env.production.local"];
const requireConfigured = process.env.REQUIRE_FIREBASE_ENV === "1";

function parseDotEnv(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((env, line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) return env;
      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, "");
      return { ...env, [key]: value };
    }, {});
}

function readEnvFiles() {
  return ENV_FILES.reduce((result, path) => {
    const url = new URL(`../${path}`, import.meta.url);
    if (!existsSync(url)) return result;
    return {
      ...result,
      files: [...result.files, path],
      values: { ...result.values, ...parseDotEnv(readFileSync(url, "utf8")) },
    };
  }, { files: [], values: {} });
}

function pickProcessEnv() {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.startsWith("VITE_FIREBASE_") || key === "VITE_SUPPORT_EMAIL")
  );
}

const fileEnv = readEnvFiles();
const runtimeEnv = { ...fileEnv.values, ...pickProcessEnv() };
const firebase = auditFirebaseEnvConsistency(runtimeEnv, { requireConfigured });
const support = getSupportConfig(runtimeEnv);
const issues = [...firebase.issues];

if (requireConfigured && !support.configured) {
  issues.push({
    key: "VITE_SUPPORT_EMAIL",
    type: support.invalid ? "invalid" : "missing",
    message: "VITE_SUPPORT_EMAIL is required for a release environment.",
  });
}

const result = {
  passed: issues.length === 0,
  requireConfigured,
  loadedEnvFiles: fileEnv.files,
  firebase: {
    configured: firebase.configured,
    missing: firebase.missing,
  },
  support: {
    configured: support.configured,
    invalid: support.invalid,
  },
  issues,
};

console.log(JSON.stringify(result, null, 2));

if (!result.passed) {
  process.exitCode = 1;
}
