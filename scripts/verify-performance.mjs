import { readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIST_DIR = fileURLToPath(new URL("../dist", import.meta.url));
const ASSET_DIR = fileURLToPath(new URL("../dist/assets", import.meta.url));

const BUDGETS = {
  maxAssetBytes: 1_600_000,
  maxJsChunkBytes: 500_000,
  maxCssBytes: 80_000,
};

function bytesToKb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

function readAssets() {
  return readdirSync(ASSET_DIR).map((fileName) => {
    const path = join(ASSET_DIR, fileName);
    const size = statSync(path).size;
    return {
      fileName,
      extension: extname(fileName),
      size,
    };
  });
}

function verifyPerformance() {
  statSync(DIST_DIR);
  statSync(ASSET_DIR);

  const assets = readAssets();
  const totalAssetBytes = assets.reduce((sum, asset) => sum + asset.size, 0);
  const largestJs = assets
    .filter((asset) => asset.extension === ".js")
    .sort((a, b) => b.size - a.size)[0] || null;
  const cssBytes = assets
    .filter((asset) => asset.extension === ".css")
    .reduce((sum, asset) => sum + asset.size, 0);

  const issues = [];
  if (totalAssetBytes > BUDGETS.maxAssetBytes) {
    issues.push(`Total assets ${bytesToKb(totalAssetBytes)}KB exceed ${bytesToKb(BUDGETS.maxAssetBytes)}KB.`);
  }
  if (largestJs && largestJs.size > BUDGETS.maxJsChunkBytes) {
    issues.push(`${largestJs.fileName} is ${bytesToKb(largestJs.size)}KB and exceeds ${bytesToKb(BUDGETS.maxJsChunkBytes)}KB.`);
  }
  if (cssBytes > BUDGETS.maxCssBytes) {
    issues.push(`CSS assets ${bytesToKb(cssBytes)}KB exceed ${bytesToKb(BUDGETS.maxCssBytes)}KB.`);
  }

  return {
    passed: issues.length === 0,
    budgets: {
      maxAssetKb: bytesToKb(BUDGETS.maxAssetBytes),
      maxJsChunkKb: bytesToKb(BUDGETS.maxJsChunkBytes),
      maxCssKb: bytesToKb(BUDGETS.maxCssBytes),
    },
    measured: {
      totalAssetKb: bytesToKb(totalAssetBytes),
      largestJsChunk: largestJs ? {
        fileName: largestJs.fileName,
        kb: bytesToKb(largestJs.size),
      } : null,
      cssKb: bytesToKb(cssBytes),
    },
    issues,
  };
}

const result = verifyPerformance();
console.log(JSON.stringify(result, null, 2));

if (!result.passed) {
  process.exitCode = 1;
}
