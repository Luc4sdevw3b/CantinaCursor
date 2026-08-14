import { writeFileSync } from 'node:fs';
import { chromium } from '../node_modules/playwright/index.mjs';

function isWebAppExecUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'script.google.com' &&
      url.pathname.includes('/macros/s/') &&
      url.pathname.endsWith('/exec')
    );
  } catch {
    return false;
  }
}

const DEV_BASE_URL = process.env.DEV_BASE_URL;
const E2E_BASE_URL = process.env.E2E_BASE_URL;

if (!DEV_BASE_URL || !isWebAppExecUrl(DEV_BASE_URL)) {
  throw new Error(
    'Defina DEV_BASE_URL como a URL /exec do Web App de playground. Não use a planilha E2E de CI.',
  );
}
if (E2E_BASE_URL && DEV_BASE_URL === E2E_BASE_URL) {
  throw new Error(
    'DEV_BASE_URL não pode ser a URL E2E de CI. O seed de volume apaga e reescreve a planilha.',
  );
}

const SEED_TIMEOUT_MS = 360_000;
const CALL_TIMEOUT_MS = 180_000;

const seedPayload = {};
for (const [key, envName] of [
  ['students', 'VOLUME_STUDENTS'],
  ['sales', 'VOLUME_SALES'],
  ['reservations', 'VOLUME_RESERVATIONS'],
  ['payments', 'VOLUME_PAYMENTS'],
]) {
  const parsed = Number(process.env[envName]);
  if (Number.isInteger(parsed) && parsed >= 0) {
    seedPayload[key] = parsed;
  }
}

const AREAS = [
  {
    name: 'Vendas',
    selector: '#area-nav [data-area="sales"]',
    status: '#sales-status',
    locked: 'Entre para vender.',
  },
  {
    name: 'Alunos',
    selector: '#area-nav [data-area="students"]',
    status: '#students-status',
    locked: 'Entre para ver o cadastro.',
  },
  {
    name: 'Responsáveis',
    selector: '#area-nav [data-area="family"]',
    status: '#family-status',
    locked: 'Entre para ver os responsáveis.',
  },
  {
    name: 'Pagamentos',
    selector: '#area-nav [data-area="payments"]',
    status: '#payments-status',
    locked: 'Entre para registrar pagamentos.',
  },
  {
    name: 'Crédito',
    selector: '#area-nav [data-area="credits"]',
    status: '#credits-status',
    locked: 'Entre para registrar crédito.',
  },
  {
    name: 'Estornos',
    selector: '#area-nav [data-area="reversals"]',
    status: '#reversals-status',
    locked: 'Entre para ver os estornos.',
  },
  {
    name: 'Cardápio',
    selector: '#area-nav [data-area="products"]',
    status: '#products-status',
    locked: 'Entre para ver o cardápio.',
  },
  {
    name: 'Reservas',
    selector: '#area-nav [data-area="reservations"]',
    status: '#reservations-status',
    locked: 'Entre para ver as reservas.',
  },
  {
    name: 'Estoque',
    selector: '#area-nav [data-area="inventory"]',
    status: '#inventory-status',
    locked: 'Entre para ver o estoque.',
  },
  {
    name: 'Agenda',
    selector: '#area-nav [data-area="agenda"]',
    status: '#agenda-status',
    locked: 'Entre para ver os vencimentos.',
  },
  {
    name: 'Caixa',
    selector: '#area-nav [data-area="cash"]',
    status: '#cash-status',
    locked: 'Entre para ver o caixa.',
  },
];

async function findApp(page) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const heading = frame.getByRole('heading', {
        level: 1,
        name: 'Cantina V2 AppScript',
      });
      if (await heading.isVisible().catch(() => false)) {
        return frame;
      }
    }
    await page.waitForTimeout(200);
  }
  throw new Error('Tela da Cantina não apareceu no iframe.');
}

async function perfSnapshot(frame) {
  return frame.evaluate(() => {
    const api = globalThis.__cantinaPerf;
    return api && typeof api.snapshot === 'function'
      ? api.snapshot()
      : { calls: 0, methods: [], timings: [], elapsedMs: 0, missing: true };
  });
}

async function perfReset(frame) {
  await frame.evaluate(() => {
    globalThis.__cantinaPerf?.reset?.();
  });
}

async function waitStatusLoaded(frame, selector, locked, timeoutMs) {
  await frame.waitForFunction(
    ({ selector: sel, locked: lockedText }) => {
      const el = globalThis.document.querySelector(sel);
      const text = el && el.textContent ? el.textContent.trim() : '';
      return text !== '' && text !== lockedText;
    },
    { selector, locked },
    { timeout: timeoutMs },
  );
}

function summarize(label, wallMs, snap, statusText) {
  const timings = snap.timings ?? [];
  return {
    area: label,
    wallMs,
    calls: snap.calls ?? 0,
    methods: snap.methods ?? [],
    timings,
    serverMs: timings.reduce((sum, item) => sum + (item.ms || 0), 0),
    statusKind: classifyStatus(statusText),
  };
}

function classifyStatus(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    return 'empty';
  }
  if (/^\d+/.test(trimmed)) {
    return trimmed.replace(/\d+/g, 'N');
  }
  return trimmed.slice(0, 80);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(CALL_TIMEOUT_MS);
const results = [];
const shell = { iframeReadyMs: 0 };
let seed = null;

try {
  const navStarted = Date.now();
  await page.goto(DEV_BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });
  let app = await findApp(page);
  shell.iframeReadyMs = Date.now() - navStarted;

  await app.getByRole('button', { name: 'Entrar como dona' }).waitFor({
    timeout: 20_000,
  });
  await app.getByRole('button', { name: 'Entrar como dona' }).click();
  await waitStatusLoaded(app, '#sales-status', 'Entre para vender.', 60_000);

  page.setDefaultTimeout(SEED_TIMEOUT_MS);
  const seedStarted = Date.now();
  seed = await app.evaluate(async (payload) => {
    const token = sessionStorage.getItem('cantina.sessionToken');
    const run = globalThis.google?.script?.run;
    if (!token || !run) {
      throw new Error('google.script.run ou sessão ausente');
    }
    const clean = {};
    for (const [key, value] of Object.entries(payload)) {
      if (Number.isInteger(value) && value > 0) {
        clean[key] = value;
      }
    }
    return new Promise((resolve, reject) => {
      run
        .withSuccessHandler(resolve)
        .withFailureHandler((error) => {
          reject(
            new Error(
              error && error.message ? error.message : String(error),
            ),
          );
        })
        .seedE2EVolume(token, clean);
    });
  }, seedPayload);
  seed.elapsedMs = Date.now() - seedStarted;
  delete seed.marker;
  page.setDefaultTimeout(CALL_TIMEOUT_MS);
  console.error(
    JSON.stringify({
      phase: 'seed-done',
      elapsedMs: seed.elapsedMs,
      students: seed.students,
      sales: seed.sales,
      reservations: seed.reservations,
      payments: seed.payments,
    }),
  );

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });
  app = await findApp(page);
  await app.getByRole('button', { name: 'Entrar como dona' }).waitFor({
    timeout: 20_000,
  });

  await perfReset(app);
  const loginStarted = Date.now();
  await app.getByRole('button', { name: 'Entrar como dona' }).click();
  await app.waitForFunction(
    () =>
      globalThis.__cantinaPerf &&
      globalThis.__cantinaPerf.snapshot().calls >= 1,
    null,
    { timeout: CALL_TIMEOUT_MS },
  );
  await waitStatusLoaded(
    app,
    '#sales-status',
    'Entre para vender.',
    CALL_TIMEOUT_MS,
  );
  results.push(
    summarize(
      'Login + Vendas',
      Date.now() - loginStarted,
      await perfSnapshot(app),
      await app.locator('#sales-status').innerText(),
    ),
  );

  for (const area of AREAS) {
    await app.locator(area.selector).click();
    await waitStatusLoaded(app, area.status, area.locked, CALL_TIMEOUT_MS);
    await perfReset(app);
    const started = Date.now();
    await app.getByRole('button', { name: 'Atualizar' }).click();
    await app.waitForFunction(
      () =>
        globalThis.__cantinaPerf &&
        globalThis.__cantinaPerf.snapshot().calls >= 1,
      null,
      { timeout: CALL_TIMEOUT_MS },
    );
    await waitStatusLoaded(app, area.status, area.locked, CALL_TIMEOUT_MS);
    results.push(
      summarize(
        `Atualizar ${area.name}`,
        Date.now() - started,
        await perfSnapshot(app),
        await app.locator(area.status).innerText(),
      ),
    );
  }

  const payload = {
    measuredAt: new Date().toISOString(),
    source: 'playwright-chromium DEV playground iframe',
    note: 'Seed de volume fictício + Atualizar em cada aba. Sem PII, sem URL.',
    seed: {
      elapsedMs: seed.elapsedMs,
      students: seed.students,
      guardians: seed.guardians,
      products: seed.products,
      sales: seed.sales,
      receivables: seed.receivables,
      payments: seed.payments,
      reservations: seed.reservations,
      volume: seed.volume === true,
    },
    shell,
    results,
    ranked: [...results].sort(
      (left, right) =>
        right.serverMs - left.serverMs || right.wallMs - left.wallMs,
    ),
  };
  writeFileSync(
    '/tmp/cantina-volume-perf.json',
    JSON.stringify(payload, null, 2),
  );
  console.log(JSON.stringify(payload, null, 2));
} catch (error) {
  const message =
    error instanceof Error ? error.stack || error.message : String(error);
  writeFileSync(
    '/tmp/cantina-volume-perf.json',
    JSON.stringify(
      {
        ok: false,
        error: message,
        seed: seed
          ? {
              elapsedMs: seed.elapsedMs,
              students: seed.students,
              sales: seed.sales,
              reservations: seed.reservations,
              payments: seed.payments,
            }
          : null,
        results,
        shell,
      },
      null,
      2,
    ),
  );
  console.error(message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
