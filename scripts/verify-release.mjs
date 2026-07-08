import { existsSync, readFileSync } from "node:fs";

const CANONICAL_URL = "https://rm-calculator-3cf1d.web.app";
const REQUIRED_PUBLIC_ROUTES = [
  "/",
  "/dashboard",
  "/calculator",
  "/analytics",
  "/privacy",
  "/readiness",
];
const REQUIRED_ENV_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_SUPPORT_EMAIL",
];

function readText(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function addIssue(issues, id, message) {
  issues.push({ id, message });
}

function getSitemapLocations(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1].trim());
}

function hasFirebaseHostingRewrite(firebaseConfig) {
  return firebaseConfig.hosting?.rewrites?.some(
    (rewrite) => rewrite.source === "**" && rewrite.destination === "/index.html"
  );
}

function hasVercelSpaRewrite(vercelConfig) {
  return vercelConfig.rewrites?.some(
    (rewrite) => rewrite.source === "/(.*)" && rewrite.destination === "/"
  );
}

function verifyRelease() {
  const issues = [];
  const packageJson = readJson("package.json");
  const firebaseJson = readJson("firebase.json");
  const vercelJson = readJson("vercel.json");
  const robots = readText("public/robots.txt");
  const sitemap = readText("public/sitemap.xml");
  const health = readJson("public/health.json");
  const envExample = readText(".env.example");
  const deletionRunbook = readText("docs/account-deletion-runbook.md");
  const ciWorkflow = readText(".github/workflows/ci.yml");
  const sitemapLocations = getSitemapLocations(sitemap);

  if (packageJson.homepage !== CANONICAL_URL) {
    addIssue(issues, "package-homepage", `package.json homepage must be ${CANONICAL_URL}`);
  }

  for (const script of ["test", "build", "check", "verify:env", "verify:performance", "qa:browser"]) {
    if (!packageJson.scripts?.[script]) {
      addIssue(issues, `missing-script-${script}`, `package.json is missing ${script} script`);
    }
  }
  if (!packageJson.scripts?.check?.includes("verify:env")) {
    addIssue(issues, "check-missing-env", "package.json check script must run verify:env");
  }
  if (!packageJson.scripts?.check?.includes("verify:performance")) {
    addIssue(issues, "check-missing-performance", "package.json check script must run verify:performance");
  }

  if (!robots.includes(`Sitemap: ${CANONICAL_URL}/sitemap.xml`)) {
    addIssue(issues, "robots-sitemap", "robots.txt must point to the canonical sitemap URL");
  }

  if (robots.includes("ondura") || sitemap.includes("ondura")) {
    addIssue(issues, "stale-domain", "public metadata still references a stale Ondura domain");
  }

  for (const route of REQUIRED_PUBLIC_ROUTES) {
    const expected = route === "/" ? `${CANONICAL_URL}/` : `${CANONICAL_URL}${route}`;
    if (!sitemapLocations.includes(expected)) {
      addIssue(issues, `missing-sitemap-${route}`, `sitemap.xml is missing ${expected}`);
    }
  }

  if (sitemapLocations.some((loc) => !loc.startsWith(CANONICAL_URL))) {
    addIssue(issues, "sitemap-domain", "all sitemap URLs must use the canonical domain");
  }

  if (firebaseJson.firestore?.rules !== "firestore.rules") {
    addIssue(issues, "firebase-rules", "firebase.json must deploy firestore.rules");
  }

  if (firebaseJson.hosting?.public !== "dist") {
    addIssue(issues, "firebase-hosting-public", "Firebase Hosting public directory must be dist");
  }

  if (!hasFirebaseHostingRewrite(firebaseJson)) {
    addIssue(issues, "firebase-spa-rewrite", "Firebase Hosting must rewrite all routes to /index.html");
  }
  const healthHeader = firebaseJson.hosting?.headers?.find((entry) => entry.source === "/health.json");
  const healthNoStore = healthHeader?.headers?.some(
    (header) => header.key.toLowerCase() === "cache-control" && header.value.includes("no-store")
  );
  if (!healthNoStore) {
    addIssue(issues, "health-cache-control", "Firebase Hosting must serve /health.json with Cache-Control: no-store");
  }

  if (!hasVercelSpaRewrite(vercelJson)) {
    addIssue(issues, "vercel-spa-rewrite", "Vercel must rewrite SPA routes to /");
  }

  if (health.service !== packageJson.name) {
    addIssue(issues, "health-service", "health.json service must match package.json name");
  }
  if (health.status !== "ok") {
    addIssue(issues, "health-status", "health.json status must be ok");
  }
  if (health.version !== packageJson.version) {
    addIssue(issues, "health-version", "health.json version must match package.json version");
  }
  if (health.canonicalUrl !== CANONICAL_URL) {
    addIssue(issues, "health-canonical", "health.json canonicalUrl must match the canonical URL");
  }
  for (const check of ["release-preflight", "browser-qa", "performance-budget"]) {
    if (!health.checks?.includes(check)) {
      addIssue(issues, `health-missing-${check}`, `health.json checks must include ${check}`);
    }
  }

  if (!existsSync(new URL("../firestore.rules", import.meta.url))) {
    addIssue(issues, "missing-firestore-rules", "firestore.rules must exist");
  }

  for (const key of REQUIRED_ENV_KEYS) {
    if (!envExample.includes(`${key}=`)) {
      addIssue(issues, `missing-env-example-${key}`, `.env.example is missing ${key}`);
    }
  }

  for (const collection of ["workoutRecords", "deletedWorkoutRecords", "goals", "deletedGoals"]) {
    if (!deletionRunbook.includes(`users/{uid}/${collection}`)) {
      addIssue(issues, `runbook-missing-${collection}`, `account deletion runbook must mention ${collection}`);
    }
  }

  for (const expected of [
    "actions/checkout@v4",
    "actions/setup-node@v4",
    "npm ci",
    "npm run check",
    "browser-qa:",
    "npm run qa:browser:server",
  ]) {
    if (!ciWorkflow.includes(expected)) {
      addIssue(issues, `ci-missing-${expected.replaceAll(" ", "-")}`, `CI workflow must include ${expected}`);
    }
  }

  return {
    passed: issues.length === 0,
    canonicalUrl: CANONICAL_URL,
    checkedRoutes: REQUIRED_PUBLIC_ROUTES,
    issues,
  };
}

const result = verifyRelease();
console.log(JSON.stringify(result, null, 2));

if (!result.passed) {
  process.exitCode = 1;
}
