/**
 * Professional README screenshot capture for iLumos.
 *
 * Captures one complete product section per image with load waits,
 * lazy-scroll warmup, locator screenshots, and automatic stitching.
 *
 * Usage:
 *   npm run screenshots
 *   BASE_URL=http://localhost:3000 npm run screenshots
 */

import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import {
  chromium,
  type Locator,
  type Page,
} from "playwright";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs", "images");
const VIEWPORT = { width: 1600, height: 1200 } as const;
const DEVICE_SCALE = 2;
const MAX_ATTEMPTS = 2;

type ShotSpec = {
  file: string;
  label: string;
  minWidth: number;
  minHeight: number;
  maxWhiteRatio: number;
};

const SHOTS: ShotSpec[] = [
  {
    file: "01-setup.png",
    label: "Setup / Quick Start",
    minWidth: 900,
    minHeight: 700,
    maxWhiteRatio: 0.95,
  },
  {
    file: "02-workspace.png",
    label: "AI Workspace",
    minWidth: 1400,
    minHeight: 700,
    maxWhiteRatio: 0.95,
  },
  {
    file: "03-suggestion.png",
    label: "AI Suggestion",
    minWidth: 420,
    minHeight: 420,
    maxWhiteRatio: 0.95,
  },
  {
    file: "04-accepted.png",
    label: "Accepted Refinement",
    minWidth: 360,
    minHeight: 500,
    maxWhiteRatio: 0.95,
  },
  {
    file: "05-export.png",
    label: "Export DOCX",
    minWidth: 1400,
    minHeight: 700,
    maxWhiteRatio: 0.96,
  },
];

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not allocate a free port"));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) reject(error);
        else resolve(port);
      });
    });
    server.on("error", reject);
  });
}

async function waitForHttp(url: string, timeoutMs = 120_000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok || response.status === 404) return;
    } catch {
      // retry
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function startDevServer(): Promise<{
  baseUrl: string;
  child: ChildProcess;
}> {
  const port = await findFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(
    "npx",
    ["next", "dev", "--turbopack", "-H", "127.0.0.1", "-p", String(port)],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        NEXT_PUBLIC_AI_MODE: "mock",
        AI_DEBUG: "false",
        BROWSER: "none",
        NEXT_DISABLE_DEV_INDICATOR: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  let logs = "";
  child.stdout?.on("data", (chunk: Buffer) => {
    logs += chunk.toString();
  });
  child.stderr?.on("data", (chunk: Buffer) => {
    logs += chunk.toString();
  });

  try {
    await waitForHttp(baseUrl);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(
      `Dev server failed to start.\n${String(error)}\n\nLogs:\n${logs.slice(-4000)}`
    );
  }

  return { baseUrl, child };
}

async function stopDevServer(child: ChildProcess): Promise<void> {
  if (child.killed) return;
  child.kill("SIGTERM");
  await delay(800);
  if (!child.killed) child.kill("SIGKILL");
}

async function preparePage(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.addStyleTag({
    content: `
      #__next-build-watcher,
      nextjs-portal,
      [data-nextjs-toast],
      [data-next-mark-loading],
      [data-nextjs-dev-overlay],
      [data-nextjs-dialog-overlay] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `,
  });
  await page.evaluate(`(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  })()`);
  await page.waitForTimeout(1500);
}

/** Slow top→bottom scroll so lazy content mounts, then return to top. */
async function warmLazyContent(page: Page): Promise<void> {
  await page.evaluate(`(async () => {
    const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const scrollingElement = document.scrollingElement || document.documentElement;
    const maxY = Math.max(
      scrollingElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight
    );
    const step = Math.max(180, Math.floor(window.innerHeight * 0.35));
    for (let y = 0; y < maxY; y += step) {
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
      await sleep(140);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    await sleep(400);
  })()`);
}

/** Unpin sticky chrome; optionally expand overflow for tall document sections. */
async function unlockCaptureLayout(
  page: Page,
  mode: "document" | "viewport" = "document"
): Promise<void> {
  await page.evaluate(
    `([mode]) => {
      const styleId = "ilumos-screenshot-unlock";
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
      const style = document.createElement("style");
      style.id = styleId;
      const expandRules = mode === "document" ? \`
        [data-screenshot="app-shell"],
        [data-screenshot="workspace"],
        [data-screenshot="setup"],
        main#main-content,
        [data-screenshot="claim-chart"],
        [data-screenshot="ai-analysis"],
        [aria-label="Supporting Evidence"] {
          height: auto !important;
          max-height: none !important;
          min-height: 0 !important;
          overflow: visible !important;
        }
        [data-screenshot="app-shell"] {
          min-height: auto !important;
        }
        body, html {
          overflow: auto !important;
          height: auto !important;
        }
      \` : \`
        header[data-screenshot="app-header"],
        header.sticky {
          position: static !important;
          backdrop-filter: none !important;
        }
      \`;
      style.textContent = \`
        header[data-screenshot="app-header"],
        header.sticky {
          position: static !important;
          backdrop-filter: none !important;
        }
        \${expandRules}
      \`;
      document.head.appendChild(style);

      if (mode === "document") {
        document
          .querySelectorAll("[data-screenshot], main#main-content, header, section, article")
          .forEach((el) => {
            el.style.setProperty("overflow", "visible", "important");
            const shot = el.getAttribute("data-screenshot");
            if (shot === "app-shell" || shot === "workspace" || shot === "setup") {
              el.style.setProperty("height", "auto", "important");
              el.style.setProperty("max-height", "none", "important");
            }
          });
      }
    }`,
    [mode]
  );
  await page.waitForTimeout(300);
}

async function waitForSettled(page: Page): Promise<void> {
  await page
    .waitForFunction(
      `(() => {
        const busy = document.querySelector('[aria-busy="true"]');
        const spinner = document.querySelector('[class*="animate-spin"]');
        return !busy && !spinner;
      })()`,
      undefined,
      { timeout: 60_000 }
    )
    .catch(() => undefined);
  await page.waitForTimeout(400);
}

async function shrinkWrapLocator(page: Page, selector: string): Promise<void> {
  await page.evaluate(
    `([selector]) => {
      const root = document.querySelector(selector);
      if (!root) return;
      root.style.setProperty("height", "auto", "important");
      root.style.setProperty("max-height", "none", "important");
      root.style.setProperty("min-height", "0", "important");
      root.style.setProperty("overflow", "visible", "important");
      root.querySelectorAll(":scope > *").forEach((child) => {
        child.style.setProperty("flex", "0 0 auto", "important");
        child.style.setProperty("height", "auto", "important");
        child.style.setProperty("max-height", "none", "important");
        child.style.setProperty("overflow", "visible", "important");
      });
      const list =
        root.querySelector('[role="list"]') ||
        root.querySelector("ul") ||
        root.querySelector('[aria-label="Conversation history"]');
      const contentNodes = list
        ? [list, ...Array.from(root.children)]
        : Array.from(root.querySelectorAll("h2, button, article, p, li"));
      const top = root.getBoundingClientRect().top;
      const bottom = Math.max(
        top,
        ...contentNodes.map((node) => node.getBoundingClientRect().bottom)
      );
      const nextHeight = Math.ceil(bottom - top + 16);
      if (nextHeight > 40) {
        root.style.setProperty("height", nextHeight + "px", "important");
      }
    }`,
    [selector]
  );
  await page.waitForTimeout(250);
}

/** Trim large empty white margins after capture (keeps content tight). */
async function trimWhitespace(filePath: string, fileName: string): Promise<void> {
  const before = await sharp(filePath).metadata();
  const trimmedBuf = await sharp(filePath)
    .trim({
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      threshold: 16,
    })
    .png()
    .toBuffer();
  const after = await sharp(trimmedBuf).metadata();
  const beforeArea = (before.width ?? 1) * (before.height ?? 1);
  const afterArea = (after.width ?? 1) * (after.height ?? 1);
  // Only keep trim when it removes meaningful empty space without over-cropping.
  if (afterArea >= beforeArea * 0.45 && afterArea < beforeArea * 0.98) {
    await writeFile(filePath, trimmedBuf);
  }

  // Tall bordered panels can leave empty card body; crop those only.
  if (fileName === "04-accepted.png" || fileName === "03-suggestion.png") {
    await cropInteriorBottomWhitespace(filePath);
  }
}

async function cropInteriorBottomWhitespace(filePath: string): Promise<void> {
  const image = sharp(filePath);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const x0 = Math.floor(info.width * 0.1);
  const x1 = Math.floor(info.width * 0.9);
  const span = Math.max(1, x1 - x0);
  const minHits = Math.max(18, Math.floor(span * 0.08));

  let lastContentRow = 0;
  let emptyRun = 0;
  const emptyStop = Math.max(120, Math.floor(info.height * 0.06));

  for (let y = 0; y < info.height; y += 1) {
    let hits = 0;
    for (let x = x0; x < x1; x += 1) {
      const i = (y * info.width + x) * info.channels;
      const r = data[i] ?? 255;
      const g = data[i + 1] ?? 255;
      const b = data[i + 2] ?? 255;
      if (r < 236 || g < 236 || b < 236) hits += 1;
    }
    if (hits >= minHits) {
      lastContentRow = y;
      emptyRun = 0;
    } else if (lastContentRow > 0) {
      emptyRun += 1;
      // After a tall empty run, ignore trailing border anti-alias at the card bottom.
      if (emptyRun >= emptyStop) break;
    }
  }

  const padded = Math.min(info.height, lastContentRow + 36);
  if (padded >= info.height - 8) return;
  if (padded < info.height * 0.3) return;

  const cropped = await sharp(filePath)
    .extract({
      left: 0,
      top: 0,
      width: info.width,
      height: padded,
    })
    .png()
    .toBuffer();
  await writeFile(filePath, cropped);
}

async function capturePanelContent(
  page: Page,
  selector: string,
  outPath: string
): Promise<void> {
  await shrinkWrapLocator(page, selector);
  await page.waitForTimeout(400);

  const clip = await page.evaluate(
    `([selector]) => {
      const root = document.querySelector(selector);
      if (!root) return null;
      const rootRect = root.getBoundingClientRect();
      const candidates = [];
      const lastItem = root.querySelector("li:last-child, article:last-of-type");
      if (lastItem) candidates.push(lastItem.getBoundingClientRect().bottom);
      root.querySelectorAll("li, article").forEach((node) => {
        candidates.push(node.getBoundingClientRect().bottom);
      });
      const composer = root.querySelector('textarea[aria-label="Message to AI"]');
      if (composer) {
        const row = composer.closest("div.flex") || composer.parentElement;
        if (row) candidates.push(row.getBoundingClientRect().bottom);
      }
      const actions = root.querySelector('[aria-label="Suggested actions"]');
      if (actions && actions.parentElement) {
        candidates.push(actions.parentElement.getBoundingClientRect().bottom);
      }
      const header = root.querySelector("h2");
      if (header) candidates.push(header.getBoundingClientRect().bottom + 40);
      if (!candidates.length) return null;
      const contentBottom = Math.max(...candidates);
      const height = Math.max(120, contentBottom - rootRect.top + 24);
      return {
        x: Math.max(0, rootRect.x),
        y: Math.max(0, rootRect.y),
        width: Math.max(1, rootRect.width),
        height: Math.max(1, Math.min(height, rootRect.height || height)),
      };
    }`,
    [selector]
  );

  if (
    !clip ||
    typeof clip !== "object" ||
    !("width" in (clip as object))
  ) {
    const locator = page.locator(selector);
    await stitchLocatorScreenshot(page, locator, outPath);
    return;
  }

  const box = clip as {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  await page.waitForTimeout(700);
  await page.screenshot({
    path: outPath,
    animations: "disabled",
    clip: {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    },
  });
}

async function stitchLocatorScreenshot(
  page: Page,
  locator: Locator,
  outPath: string
): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);

  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(`No bounding box for locator → ${outPath}`);
  }

  const baseViewport = page.viewportSize() ?? VIEWPORT;
  const targetWidth = Math.min(
    2400,
    Math.max(baseViewport.width, Math.ceil(box.width) + 48)
  );
  const targetHeight = Math.min(
    9000,
    Math.max(baseViewport.height, Math.ceil(box.height) + 64)
  );

  const expanded =
    targetWidth > baseViewport.width || targetHeight > baseViewport.height;

  if (expanded) {
    await page.setViewportSize({ width: targetWidth, height: targetHeight });
    await page.waitForTimeout(400);
    await locator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
  }

  const refreshed = await locator.boundingBox();
  if (!refreshed) {
    if (expanded) await page.setViewportSize(baseViewport);
    throw new Error(`Locator lost bounding box before capture → ${outPath}`);
  }

  const fitsViewport =
    refreshed.height <= targetHeight - 4 && refreshed.width <= targetWidth - 4;

  try {
    if (fitsViewport) {
      await locator.screenshot({
        path: outPath,
        animations: "disabled",
      });
      return;
    }

    // Fallback: stitch viewport-height bands into one image.
    await captureStitchedBands(page, locator, outPath, refreshed);
  } finally {
    if (expanded) {
      await page.setViewportSize(baseViewport);
      await page.waitForTimeout(200);
    }
  }
}

async function captureStitchedBands(
  page: Page,
  locator: Locator,
  outPath: string,
  box: { x: number; y: number; width: number; height: number }
): Promise<void> {
  const viewport = page.viewportSize() ?? VIEWPORT;
  const dpr = DEVICE_SCALE;
  const bandHeight = Math.floor(viewport.height * 0.8);
  const bands: Buffer[] = [];
  const startScrollY = Number(await page.evaluate(`window.scrollY`));
  const absoluteTop = box.y + startScrollY;
  const absoluteLeft = Math.max(0, Math.min(box.x, viewport.width - 1));
  const width = Math.max(1, Math.min(box.width, viewport.width - absoluteLeft));
  const totalHeight = box.height;

  let offset = 0;
  while (offset < totalHeight - 1) {
    const sliceHeight = Math.min(bandHeight, totalHeight - offset);
    const scrollTop = Math.max(0, absoluteTop + offset - 8);
    await page.evaluate(
      `([y]) => { window.scrollTo({ top: y, left: 0, behavior: "auto" }); }`,
      [scrollTop]
    );
    await page.waitForTimeout(280);

    const clipY = Number(
      await page.evaluate(
        `([targetAbsoluteTop]) => targetAbsoluteTop - window.scrollY`,
        [absoluteTop + offset]
      )
    );

    const safeY = Math.max(0, Math.min(clipY, viewport.height - 2));
    const safeHeight = Math.max(
      1,
      Math.min(sliceHeight, viewport.height - safeY)
    );

    const buffer = await page.screenshot({
      type: "png",
      animations: "disabled",
      clip: {
        x: absoluteLeft,
        y: safeY,
        width,
        height: safeHeight,
      },
    });
    bands.push(buffer);
    offset += safeHeight;
  }

  await page.evaluate(
    `([y]) => { window.scrollTo({ top: y, left: 0, behavior: "auto" }); }`,
    [startScrollY]
  );
  await page.waitForTimeout(200);

  if (bands.length === 0) {
    await locator.screenshot({ path: outPath, animations: "disabled" });
    return;
  }

  const metas = await Promise.all(
    bands.map(async (buf) => {
      const image = sharp(buf);
      const meta = await image.metadata();
      return {
        buf,
        width: meta.width ?? Math.round(width * dpr),
        height: meta.height ?? 0,
      };
    })
  );

  const canvasWidth = Math.max(...metas.map((m) => m.width));
  const canvasHeight = metas.reduce((sum, m) => sum + m.height, 0);
  let top = 0;
  const composites = metas.map((m) => {
    const input = { input: m.buf, top, left: 0 };
    top += m.height;
    return input;
  });

  await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outPath);
}

async function verifyScreenshot(
  filePath: string,
  spec: ShotSpec
): Promise<{ ok: boolean; reasons: string[] }> {
  const reasons: string[] = [];
  const image = sharp(filePath);
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  if (width < spec.minWidth * DEVICE_SCALE * 0.85) {
    reasons.push(
      `width too small (${width}px < ~${Math.round(spec.minWidth * DEVICE_SCALE * 0.85)})`
    );
  }
  if (height < spec.minHeight * DEVICE_SCALE * 0.85) {
    reasons.push(
      `height too small (${height}px < ~${Math.round(spec.minHeight * DEVICE_SCALE * 0.85)})`
    );
  }

  // Downsample for white-space / crop heuristics.
  const { data, info } = await image
    .clone()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const total = info.width * info.height;
  let white = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * info.channels;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const a = info.channels > 3 ? (data[i + 3] ?? 255) : 255;
      const isWhite = a > 200 && r > 248 && g > 248 && b > 248;
      if (isWhite) white += 1;
    }
  }

  const whiteRatio = white / total;
  if (whiteRatio > spec.maxWhiteRatio) {
    reasons.push(
      `too much empty white (${(whiteRatio * 100).toFixed(1)}% > ${(spec.maxWhiteRatio * 100).toFixed(0)}%)`
    );
  }

  // Extremely empty frames only (light product UIs are legitimately white-heavy).
  if (whiteRatio > 0.97) {
    reasons.push("image appears mostly empty");
  }

  return { ok: reasons.length === 0, reasons };
}

async function gotoReady(
  page: Page,
  url: string,
  mode: "document" | "viewport" = "document"
): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForLoadState("networkidle");
  await preparePage(page);
  await warmLazyContent(page);
  await unlockCaptureLayout(page, mode);
  await page.waitForTimeout(500);
}

async function captureSetup(page: Page, outPath: string): Promise<void> {
  await gotoReady(page, "/", "document");

  await page.getByRole("button", { name: /Load Sample Claim Chart/i }).click();
  await page
    .getByRole("button", { name: /Load Sample Supporting Documents/i })
    .click();
  await page.getByRole("button", { name: /Sample Claim Chart Loaded/i }).waitFor();
  await page
    .getByRole("button", { name: /Sample Documents Loaded/i })
    .waitFor();
  await waitForSettled(page);
  await warmLazyContent(page);
  await unlockCaptureLayout(page, "document");

  const locator = page.locator('[data-screenshot="setup"]');
  await stitchLocatorScreenshot(page, locator, outPath);
}

async function captureWorkspace(page: Page, outPath: string): Promise<void> {
  await gotoReady(page, "/workspace", "viewport");
  await page.locator('[data-screenshot="workspace"]').waitFor();
  await page.getByRole("button", { name: /CE-3/i }).first().click().catch(() => undefined);
  await waitForSettled(page);
  await unlockCaptureLayout(page, "viewport");
  await page.setViewportSize(VIEWPORT);
  await page.waitForTimeout(500);

  const locator = page.locator('[data-screenshot="app-shell"]');
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await locator.screenshot({
    path: outPath,
    animations: "disabled",
  });
}

async function captureSuggestion(page: Page, outPath: string): Promise<void> {
  await gotoReady(page, "/workspace", "viewport");
  await page.getByRole("button", { name: /CE-3/i }).first().click().catch(() => undefined);
  await waitForSettled(page);

  await page.getByRole("button", { name: /Strengthen Evidence/i }).click();
  await page
    .locator('[data-screenshot="suggestion"]')
    .first()
    .waitFor({ state: "visible", timeout: 60_000 });
  await waitForSettled(page);

  const details = page.getByRole("button", { name: /View Details/i }).first();
  if (await details.isVisible().catch(() => false)) {
    await details.click();
    await page.getByRole("button", { name: /Hide Details/i }).first().waitFor({
      timeout: 5_000,
    }).catch(() => undefined);
    await page.waitForTimeout(700);
  }

  await unlockCaptureLayout(page, "document");
  await capturePanelContent(page, '[data-screenshot="ai-analysis"]', outPath);
}

async function captureAccepted(page: Page, outPath: string): Promise<void> {
  await gotoReady(page, "/workspace", "viewport");
  await page.getByRole("button", { name: /CE-3/i }).first().click().catch(() => undefined);
  await waitForSettled(page);

  await page.getByRole("button", { name: /Improve Reasoning/i }).click();
  await page
    .locator('[data-screenshot="suggestion"]')
    .first()
    .waitFor({ state: "visible", timeout: 60_000 });
  await waitForSettled(page);

  await page.getByRole("button", { name: /Accept suggestion/i }).click();
  await page
    .getByLabel(/Suggestion status: Accepted/i)
    .first()
    .waitFor({ timeout: 20_000 });
  await waitForSettled(page);
  // Allow highlight flash to settle so we don't capture mid-animation.
  await page.waitForTimeout(1800);

  await unlockCaptureLayout(page, "document");
  await capturePanelContent(page, '[data-screenshot="claim-chart"]', outPath);
}

async function captureExport(page: Page, outPath: string): Promise<void> {
  await gotoReady(page, "/workspace", "viewport");
  await page.getByRole("button", { name: /CE-3/i }).first().click().catch(() => undefined);
  await waitForSettled(page);

  // Land in an export-ready state: accept a refinement first.
  await page.getByRole("button", { name: /Strengthen Evidence/i }).click();
  await page
    .locator('[data-screenshot="suggestion"]')
    .first()
    .waitFor({ state: "visible", timeout: 60_000 });
  await waitForSettled(page);
  await page.getByRole("button", { name: /Accept suggestion/i }).click();
  await page
    .getByLabel(/Suggestion status: Accepted/i)
    .first()
    .waitFor({ timeout: 20_000 });
  await waitForSettled(page);
  await page.waitForTimeout(1200);

  await page
    .getByRole("button", { name: /Export(?:ing)?(?: claim chart)?(?: as)? DOCX/i })
    .waitFor({ state: "visible", timeout: 15_000 });
  await unlockCaptureLayout(page, "viewport");
  await page.setViewportSize(VIEWPORT);
  await page.waitForTimeout(400);

  // Full workspace in export-ready state (Export DOCX visible in header).
  const locator = page.locator('[data-screenshot="app-shell"]');
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await locator.screenshot({
    path: outPath,
    animations: "disabled",
  });
}

const CAPTURE_FNS: Record<
  string,
  (page: Page, outPath: string) => Promise<void>
> = {
  "01-setup.png": captureSetup,
  "02-workspace.png": captureWorkspace,
  "03-suggestion.png": captureSuggestion,
  "04-accepted.png": captureAccepted,
  "05-export.png": captureExport,
};

async function run(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  const externalBase = process.env.BASE_URL?.replace(/\/$/, "");
  let child: ChildProcess | null = null;
  let baseUrl = externalBase ?? "";

  if (!externalBase) {
    console.log("Starting Next.js (mock AI) for screenshots…");
    const started = await startDevServer();
    child = started.child;
    baseUrl = started.baseUrl;
  }

  console.log(`Capturing against ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    baseURL: baseUrl,
  });
  const page = await context.newPage();

  const report: string[] = [];

  try {
    for (const spec of SHOTS) {
      const outPath = path.join(OUT_DIR, spec.file);
      const capture = CAPTURE_FNS[spec.file];
      if (!capture) throw new Error(`No capture fn for ${spec.file}`);

      let passed = false;
      let lastReasons: string[] = [];

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        console.log(`\n→ ${spec.label} (${spec.file}) attempt ${attempt}/${MAX_ATTEMPTS}`);
        try {
          await unlink(outPath).catch(() => undefined);
          await capture(page, outPath);
          await trimWhitespace(outPath, spec.file);
          const verification = await verifyScreenshot(outPath, spec);
          if (verification.ok) {
            passed = true;
            console.log(`  ✓ verified ${spec.file}`);
            report.push(`- ${spec.file}: ok`);
            break;
          }
          lastReasons = verification.reasons;
          console.warn(`  ✗ verification failed: ${lastReasons.join("; ")}`);
          if (attempt < MAX_ATTEMPTS) {
            console.log("  regenerating…");
          }
        } catch (error) {
          lastReasons = [error instanceof Error ? error.message : String(error)];
          console.warn(`  ✗ capture error: ${lastReasons.join("; ")}`);
        }
      }

      if (!passed) {
        report.push(`- ${spec.file}: FAILED — ${lastReasons.join("; ")}`);
        throw new Error(
          `Screenshot ${spec.file} failed quality checks: ${lastReasons.join("; ")}`
        );
      }
    }

    const reportPath = path.join(OUT_DIR, "CAPTURE_REPORT.md");
    await writeFile(
      reportPath,
      `# Screenshot capture report\n\nGenerated: ${new Date().toISOString()}\n\n${report.join("\n")}\n`,
      "utf8"
    );
    console.log(`\nAll screenshots written to ${OUT_DIR}`);
  } finally {
    await browser.close();
    if (child) await stopDevServer(child);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
