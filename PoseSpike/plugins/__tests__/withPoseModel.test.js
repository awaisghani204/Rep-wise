/**
 * @jest-environment node
 */
// Unit tests for the Model_Config_Plugin's copyModel helper (Requirements 2.4, 2.5).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { copyModel } = require('../withPoseModel');

const MODEL_NAME = 'pose_landmarker_lite.task';

describe('copyModel', () => {
  let tmp;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'posespike-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('copies the model into android/app/src/main/assets, creating the dir when missing', () => {
    const modelsDir = path.join(tmp, 'assets', 'models');
    fs.mkdirSync(modelsDir, { recursive: true });
    const stub = Buffer.from([0x00, 0x01, 0x02, 0xfe, 0xff, 0x50, 0x4b]);
    fs.writeFileSync(path.join(modelsDir, MODEL_NAME), stub);

    const platformProjectRoot = path.join(tmp, 'android');
    const assetsDir = path.join(platformProjectRoot, 'app', 'src', 'main', 'assets');
    expect(fs.existsSync(assetsDir)).toBe(false);

    copyModel(tmp, platformProjectRoot);

    const dest = path.join(assetsDir, MODEL_NAME);
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest).equals(stub)).toBe(true);
  });

  it('throws an error naming "npm run download-model" when the model is missing', () => {
    const platformProjectRoot = path.join(tmp, 'android');
    expect(() => copyModel(tmp, platformProjectRoot)).toThrow(/npm run download-model/);
    expect(fs.existsSync(path.join(platformProjectRoot, 'app', 'src', 'main', 'assets', MODEL_NAME))).toBe(false);
  });
});
