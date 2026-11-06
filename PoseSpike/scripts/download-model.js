#!/usr/bin/env node
/**
 * Model_Download_Script for PoseSpike.
 *
 * Downloads the MediaPipe PoseLandmarker model (lite, float16) to
 * assets/models/pose_landmarker_lite.task. The Expo config plugin
 * (plugins/withPoseModel.js) copies it into the Android app assets on prebuild.
 *
 * - Uses Node built-in modules only.
 * - Override the source with the POSE_MODEL_URL environment variable.
 * - Skips the download when the model file already exists and is non-empty.
 * - Streams to "<DEST>.part" and renames on success, so a failed download never
 *   leaves a partial file that a later run would treat as present.
 * - On failure, deletes the .part file, prints "Model download failed: <reason>"
 *   to stderr, and exits with code 1.
 *
 * Usage: npm run download-model
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const DEFAULT_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
const MODEL_URL = process.env.POSE_MODEL_URL || DEFAULT_MODEL_URL;
const DEST = path.resolve(__dirname, '..', 'assets', 'models', 'pose_landmarker_lite.task');
const PART = `${DEST}.part`;
const MAX_REDIRECTS = 5;

/** Returns true when the model file exists and is non-empty. */
function modelPresent(file) {
  try {
    return fs.statSync(file).size > 0;
  } catch {
    return false;
  }
}

/** Removes the partial download file if it exists. */
function removePart() {
  try {
    fs.rmSync(PART, { force: true });
  } catch {
    // Ignore cleanup errors; the original failure is what gets reported.
  }
}

/**
 * Requests `url`, following up to MAX_REDIRECTS redirects.
 * Resolves with the final 2xx response; rejects with "HTTP <code> <message>" otherwise.
 */
function getFollowingRedirects(url, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('http:') ? http : https;
    const req = client.get(url, (res) => {
      const code = res.statusCode || 0;
      if (code >= 300 && code < 400 && res.headers.location) {
        res.resume();
        if (redirectsLeft <= 0) {
          reject(new Error(`Too many redirects (more than ${MAX_REDIRECTS})`));
          return;
        }
        const next = new URL(res.headers.location, url).toString();
        resolve(getFollowingRedirects(next, redirectsLeft - 1));
        return;
      }
      if (code < 200 || code >= 300) {
        res.resume();
        reject(new Error(`HTTP ${code} ${res.statusMessage || ''}`.trim()));
        return;
      }
      resolve(res);
    });
    req.on('error', reject);
  });
}

/** Streams a response body to `file`; resolves once the file is fully written and closed. */
function writeResponse(res, file) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(file);
    res.on('error', reject);
    out.on('error', reject);
    out.on('finish', resolve);
    res.pipe(out);
  });
}

/** Downloads the model to DEST unless it is already present. */
async function main() {
  if (modelPresent(DEST)) {
    console.log(`Model already present at ${DEST}, skipping download.`);
    return;
  }
  fs.mkdirSync(path.dirname(DEST), { recursive: true });
  console.log(`Downloading ${MODEL_URL}`);
  const res = await getFollowingRedirects(MODEL_URL);
  await writeResponse(res, PART);
  if (!modelPresent(PART)) {
    throw new Error('Downloaded file is empty');
  }
  fs.renameSync(PART, DEST);
  console.log(`Model saved to ${DEST} (${fs.statSync(DEST).size} bytes).`);
}

main().catch((err) => {
  removePart();
  console.error(`Model download failed: ${err && err.message ? err.message : String(err)}`);
  process.exit(1);
});
