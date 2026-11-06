// Expo config plugin (Model_Config_Plugin): copies the PoseLandmarker model into the
// Android app assets during `expo prebuild`. Bundling the model in the APK lets the
// native plugin load it from assets, so inference needs no runtime network access.
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MODEL_NAME = 'pose_landmarker_lite.task';

/** Copies the model from assets/models into android/app/src/main/assets; throws if the model is missing. */
function copyModel(projectRoot, platformProjectRoot) {
  const src = path.join(projectRoot, 'assets', 'models', MODEL_NAME);
  if (!fs.existsSync(src)) {
    throw new Error(
      `[withPoseModel] ${MODEL_NAME} not found at ${src}. Run "npm run download-model" first.`
    );
  }
  const destDir = path.join(platformProjectRoot, 'app', 'src', 'main', 'assets');
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, path.join(destDir, MODEL_NAME));
}

/** Expo config plugin: runs copyModel during the Android dangerous-mod phase of prebuild. */
function withPoseModel(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      copyModel(cfg.modRequest.projectRoot, cfg.modRequest.platformProjectRoot);
      return cfg;
    },
  ]);
}

module.exports = withPoseModel;
module.exports.copyModel = copyModel;
