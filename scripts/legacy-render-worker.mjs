import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LEGACY_RENDER_BASE_URL = process.env.LEGACY_RENDER_BASE_URL;
const LEGACY_RENDER_BUCKET = process.env.LEGACY_RENDER_BUCKET || 'legacy-renders';
const LEGACY_RENDER_POLL_MS = Number(process.env.LEGACY_RENDER_POLL_MS || 10000);
const LEGACY_RENDER_FPS = Number(process.env.LEGACY_RENDER_FPS || 12);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LEGACY_RENDER_BASE_URL) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e LEGACY_RENDER_BASE_URL devem estar definidos.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const encodePayload = (payload) => Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

const buildRenderUrl = (payload) => {
  const url = new URL(LEGACY_RENDER_BASE_URL);
  url.searchParams.set('render', 'legacy');
  url.searchParams.set('payload', encodePayload(payload));
  url.searchParams.set('capture', '1');
  return url.toString();
};

const totalCyclesFromPayload = (payload) => (payload?.eras || []).reduce((sum, era) => sum + ((era.cycles || []).length), 0);

const computeLegacyDurationMs = (payload) => {
  const timing = payload?.timing || {};
  const normalMs = timing.normalMs || 1500;
  const importantMs = timing.importantMs || 1700;
  const identityMs = timing.identityMs || 1900;
  const eraMs = timing.eraMs || 2400;
  const finalHoldMs = timing.finalHoldMs || 2200;
  const eras = payload?.eras || [];
  let total = 900 + finalHoldMs;

  eras.forEach((era, eraIndex) => {
    const cycles = era.cycles || [];
    cycles.forEach((cycle, cycleIndex) => {
      const nextCycle = cycles[cycleIndex + 1];
      const nextEra = eras[eraIndex + 1];
      const score = Number(cycle?.score || 0);
      const currentIdentity = JSON.stringify(cycle?.identitySnapshot || {});
      const nextIdentity = JSON.stringify(nextCycle?.identitySnapshot || nextEra?.cycles?.[0]?.identitySnapshot || {});
      if (nextCycle) {
        const identityChanged = currentIdentity !== nextIdentity;
        total += identityChanged ? identityMs : score >= 90 ? importantMs : normalMs;
      } else if (nextEra) {
        total += eraMs;
      } else {
        total += score >= 90 ? importantMs : normalMs;
      }
    });
  });

  if (totalCyclesFromPayload(payload) === 0) {
    total += 1200;
  }

  return total;
};

const loadPlaywright = async () => {
  try {
    return await import('playwright');
  } catch {
    throw new Error('Playwright nao esta instalado no worker. Instale com `npm i -D playwright` no ambiente de render.');
  }
};

const runFfmpeg = (args) => new Promise((resolve, reject) => {
  const child = spawn('ffmpeg', args, { stdio: 'inherit' });
  child.on('error', (error) => reject(new Error(`Falha ao iniciar ffmpeg: ${error.message}`)));
  child.on('exit', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`ffmpeg saiu com codigo ${code}.`));
  });
});

const claimNextJob = async () => {
  const { data: jobs, error } = await supabase
    .from('legacy_render_jobs')
    .select('id,user_id,payload,created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) throw error;
  const nextJob = jobs?.[0];
  if (!nextJob) return null;

  const { data: claimed, error: claimError } = await supabase
    .from('legacy_render_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString(), error_message: null })
    .eq('id', nextJob.id)
    .eq('status', 'pending')
    .select('id,user_id,payload')
    .maybeSingle();

  if (claimError) throw claimError;
  return claimed || null;
};

const updateJobFailure = async (jobId, message) => {
  await supabase
    .from('legacy_render_jobs')
    .update({ status: 'failed', error_message: message.slice(0, 1000), finished_at: new Date().toISOString() })
    .eq('id', jobId);
};

const updateJobSuccess = async (jobId, videoPath, posterPath) => {
  await supabase
    .from('legacy_render_jobs')
    .update({ status: 'completed', video_path: videoPath, poster_path: posterPath, finished_at: new Date().toISOString(), error_message: null })
    .eq('id', jobId);
};

const uploadToStorage = async (storagePath, localFile, contentType) => {
  const buffer = await fs.readFile(localFile);
  const { error } = await supabase.storage.from(LEGACY_RENDER_BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
};

const renderJob = async (job) => {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `glyph-legacy-${job.id}-`));
  const frameDir = path.join(tempDir, 'frames');
  await fs.mkdir(frameDir, { recursive: true });
  const posterFile = path.join(tempDir, 'poster.png');
  const videoFile = path.join(tempDir, 'legacy.mp4');

  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const renderUrl = buildRenderUrl(job.payload);
    await page.goto(renderUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: posterFile, fullPage: false });

    const durationMs = computeLegacyDurationMs(job.payload);
    const totalFrames = Math.max(24, Math.ceil((durationMs / 1000) * LEGACY_RENDER_FPS));

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex += 1) {
      const framePath = path.join(frameDir, `frame-${String(frameIndex).padStart(5, '0')}.png`);
      await page.screenshot({ path: framePath, fullPage: false });
      if (frameIndex < totalFrames - 1) {
        await page.waitForTimeout(Math.round(1000 / LEGACY_RENDER_FPS));
      }
    }

    await runFfmpeg([
      '-y',
      '-framerate',
      String(LEGACY_RENDER_FPS),
      '-i',
      path.join(frameDir, 'frame-%05d.png'),
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      videoFile,
    ]);

    const basePath = `${job.user_id}/${job.id}`;
    const posterStoragePath = `${basePath}/poster.png`;
    const videoStoragePath = `${basePath}/legacy.mp4`;

    await uploadToStorage(posterStoragePath, posterFile, 'image/png');
    await uploadToStorage(videoStoragePath, videoFile, 'video/mp4');
    await updateJobSuccess(job.id, videoStoragePath, posterStoragePath);
  } finally {
    await browser.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};

const runLoop = async () => {
  console.log('[legacy-render-worker] iniciado');
  while (true) {
    let job = null;
    try {
      job = await claimNextJob();
      if (!job) {
        await sleep(LEGACY_RENDER_POLL_MS);
        continue;
      }

      console.log(`[legacy-render-worker] processando ${job.id}`);
      await renderJob(job);
      console.log(`[legacy-render-worker] concluido ${job.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[legacy-render-worker] erro', message);
      if (job?.id) {
        await updateJobFailure(job.id, message);
      }
      await sleep(LEGACY_RENDER_POLL_MS);
    }
  }
};

runLoop().catch((error) => {
  console.error('[legacy-render-worker] fatal', error);
  process.exit(1);
});
