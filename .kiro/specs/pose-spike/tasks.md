# Implementation Plan: pose-spike

## Overview

Build the PoseSpike Expo + TypeScript Android development build in `PoseSpike/`, with native Kotlin for the MediaPipe PoseLandmarker Frame Processor Plugin. The order is: scaffold and pin versions, build configuration, model provisioning, the local Expo module (Kotlin then TypeScript bridge), pure TypeScript pose logic with property-based tests, hooks, UI, README, and a final verification pass. Each step builds on the previous one and ends with everything wired into `App.tsx`.

The on-device acceptance checks (Requirement 12.1–12.5) need a physical Android device and must be done by the user, following the README procedure. Automated checks in this plan cover TypeScript typecheck, Jest tests, and an attempted Android prebuild and Gradle build.

## Tasks

- [ ] 1. Scaffold the Expo TypeScript project and pin dependency versions
  - [ ] 1.1 Scaffold the Expo TypeScript project in `PoseSpike/`
    - Run `npx create-expo-app@latest PoseSpike --template blank-typescript` at the workspace root
    - Add `jest.config.js` with preset `jest-expo`, and `package.json` scripts `download-model`, `prebuild` (`expo prebuild -p android`), `android` (`expo run:android`), `test` (`jest`), `typecheck` (`tsc --noEmit`)
    - Add `.gitignore` entries for `node_modules/`, `android/`, `ios/`, `assets/models/*.task`, and create `assets/models/.gitkeep`
    - _Requirements: 1.1, 1.2_

  - [ ] 1.2 Resolve, verify, and install the latest stable dependency versions
    - Run `npx expo install expo-dev-client expo-build-properties react-native-svg`
    - Run `npm view react-native-vision-camera version`, `npm view react-native-worklets-core version`, and `npm view <pkg> peerDependencies` for both; apply the VisionCamera major-version rule from the design (pin the newest major that still supports react-native-worklets-core plugins)
    - Install VisionCamera and worklets-core with `npx expo install` so versions match the Expo SDK
    - Check Maven Central (https://central.sonatype.com/artifact/com.google.mediapipe/tasks-vision) for the newest non-alpha `com.google.mediapipe:tasks-vision` release
    - Install dev dependencies only: `jest`, `jest-expo`, `@types/jest`, `fast-check`
    - Run `npx expo install --check` and `npx expo-doctor`; fix reported mismatches
    - Write every resolved version (Expo SDK, React Native, VisionCamera, worklets-core, react-native-svg, expo-dev-client, expo-build-properties, tasks-vision) into a version list kept for the README task
    - _Requirements: 1.2, 1.4, 11.3_

  - [ ]* 1.3 Write the runtime dependency allow-list test
    - Create `src/pose/__tests__/dependencies.test.ts` that reads `package.json` and asserts `dependencies` contains only Expo packages, `react`, `react-native`, VisionCamera, worklets-core, react-native-svg, expo-dev-client, and `pose-landmarker`
    - _Requirements: 1.4, 10.3_

- [ ] 2. Configure the app build
  - [ ] 2.1 Configure `app.json` and `babel.config.js`
    - In `app.json`: `"orientation": "portrait"`, `android.package` `com.example.posespike`, the `react-native-vision-camera` plugin with `cameraPermissionText` and `enableMicrophonePermission: false`, and `expo-build-properties` with `android.minSdkVersion: 29`
    - In `babel.config.js`: preset `babel-preset-expo` and plugin `react-native-worklets-core/plugin`; confirm no Reanimated plugin conflict
    - _Requirements: 1.2, 1.3, 3.1_

- [ ] 3. Implement model provisioning
  - [ ] 3.1 Implement `scripts/download-model.js`
    - Node built-in modules only; `MODEL_URL` from `POSE_MODEL_URL` env or the official `pose_landmarker_lite/float16/latest` URL; `DEST` is `assets/models/pose_landmarker_lite.task`
    - Skip with `Model already present at <DEST>, skipping download.` when the file exists and is non-empty
    - Follow up to 5 redirects, reject non-2xx with `HTTP <code> <message>`, stream to `DEST.part` and rename on finish
    - On any error delete `.part`, print `Model download failed: <reason>` to stderr, and exit 1
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.2 Implement `plugins/withPoseModel.js` and register it
    - Export `copyModel(projectRoot, platformProjectRoot)` that copies the model into `android/app/src/main/assets/` and throws an error naming `npm run download-model` when the source is missing
    - Wrap `copyModel` in `withDangerousMod` for Android; add `"./plugins/withPoseModel"` to the `app.json` plugins list
    - Bundling the model in app assets is what lets inference run with no runtime network access
    - _Requirements: 2.4, 2.5, 4.5, 4.8_

  - [ ]* 3.3 Write unit tests for `copyModel`
    - Create `plugins/__tests__/withPoseModel.test.js` using a temp directory: the copy lands in `android/app/src/main/assets/`, and a missing source throws a message containing `npm run download-model`
    - _Requirements: 2.4, 2.5_

- [ ] 4. Create the local Expo module skeleton
  - [ ] 4.1 Scaffold `modules/pose-landmarker` as an Android-only local Expo module
    - Run `npx create-expo-module@latest --local pose-landmarker` inside `PoseSpike/`
    - Delete generated iOS, web, and sample view files
    - Set `expo-module.config.json` to `{ "platforms": ["android"], "android": { "modules": ["expo.modules.poselandmarker.PoseLandmarkerModule"] } }`
    - In `android/build.gradle` add `implementation "com.google.mediapipe:tasks-vision:<version from 1.2>"` and `implementation project(':react-native-vision-camera')`; inherit minSdk from the root project
    - Keep `AndroidManifest.xml` minimal
    - _Requirements: 1.5, 1.6_

- [ ] 5. Implement the Kotlin pose path
  - Every Kotlin method gets a one-line KDoc comment saying what it does
  - [ ] 5.1 Implement `PoseResult.kt`
    - Data class with `landmarks`, `latencyMs`, `frameWidth`, `frameHeight`, `mirrored`, `error`, `suspended`; `toMap()` returns a VisionCamera-convertible map with `Double` numbers, omitting `error` and `suspended` unless set
    - Add `suspended()` and `error(message)` factory helpers
    - _Requirements: 4.3, 4.7, 10.1_

  - [ ] 5.2 Implement `FrameConverter.kt`
    - `toMPImage(frame)` copies RGBA plane 0 into a reused ARGB_8888 Bitmap, reallocating only on size change and copying row by row when `rowStride != width * 4`
    - `rotationDegrees(frame)` maps `frame.orientation` to 0/90/180/270 as the single place that interprets orientation
    - _Requirements: 4.1, 4.2, 10.1_

  - [ ] 5.3 Implement `PoseLandmarkerHolder.kt`
    - Singleton `object` with one lock guarding `detect`, `release`, and `resume`; constants `MODEL_ASSET = "pose_landmarker_lite.task"` and `USE_GPU = false`
    - `create()` builds a `RunningMode.VIDEO`, `numPoses = 1` landmarker from the bundled asset with the CPU delegate
    - `detect(frame)` follows the design's 10-step algorithm: suspended check, lazy create with stored `loadError`, rotation via `ImageProcessingOptions`, timestamp guard `max(ts, last + 1)`, flatten first pose to 132 doubles, native latency from `SystemClock.elapsedRealtimeNanos()`, upright frame size, and per-frame exception catch returning empty landmarks
    - `release()` closes the instance, sets `suspended`, resets the timestamp; `resume()` clears `suspended` and `loadError`
    - Log create/release/errors with tag `PoseLandmarker`
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 4.8, 9.1, 9.2, 10.1_

  - [ ] 5.4 Implement `PoseFrameProcessorPlugin.kt` and `PoseLandmarkerPackage.kt`
    - Plugin `callback(frame, arguments)` returns `PoseLandmarkerHolder.detect(frame).toMap()`
    - Package implements `expo.modules.core.interfaces.Package`; its `ApplicationLifecycleListener.onCreate` calls `PoseLandmarkerHolder.init` and registers `detectPose` via `FrameProcessorPluginRegistry.addFrameProcessorPlugin`
    - Comment the fallback registration path from the design in case `Package` discovery does not work on the resolved SDK
    - _Requirements: 4.1, 4.2, 10.1, 10.2_

  - [ ] 5.5 Implement `PoseLandmarkerModule.kt`
    - Expo module named `PoseLandmarker` exposing `release` and `resume`, each with a Bridge_Method comment
    - _Requirements: 9.1, 9.2, 10.1, 10.2_

- [ ] 6. Implement the module TypeScript bridge
  - [ ] 6.1 Implement `modules/pose-landmarker` TypeScript files
    - `src/types.ts` with `RawPoseResult`
    - `src/PoseLandmarkerModule.ts` using `requireNativeModule('PoseLandmarker')` with commented `release` and `resume`
    - `src/detectPose.ts` worklet calling `VisionCameraProxy.initFrameProcessorPlugin('detectPose', {})`, returning an `error` result when the plugin is not registered
    - `index.ts` re-exporting `PoseLandmarker`, `detectPose`, and `RawPoseResult`
    - Add `"pose-landmarker": "file:./modules/pose-landmarker"` to root `package.json` only if name-based resolution needs it
    - _Requirements: 4.3, 4.6, 9.1, 9.2, 10.2_

- [ ] 7. Implement pure pose logic: landmarks and throttle
  - [ ] 7.1 Implement `src/pose/constants.ts` and shared test generators
    - Constants: `LANDMARK_COUNT`, `VALUES_PER_LANDMARK`, `KEY_LANDMARKS`, `SKELETON_JOINTS`, `SKELETON_SEGMENTS`, `VISIBILITY_THRESHOLD`, `MAX_EVENTS_PER_SECOND`, `STATS_WINDOW_MS`, `STATUS_VISIBLE`, `STATUS_NOT_VISIBLE`
    - `src/pose/__tests__/arbitraries.ts` with `landmarkArb` (boundary-weighted visibility 0.6, 0.6 ± ε, 0, 1), `poseArb`, `maybePoseArb`, `mappingArb`, `timestampsArb`
    - _Requirements: 4.4, 5.1, 5.2, 6.1, 7.1, 7.2_

  - [ ] 7.2 Implement `src/pose/landmarks.ts`
    - `decodeLandmarks`, `encodeLandmarks`, `keyLandmarkVisibility`, `isFullBodyVisible`, `statusMessage`, `formatVisibility`, `modelErrorMessage`
    - _Requirements: 4.3, 4.6, 4.7, 6.3, 7.1, 7.2_

  - [ ]* 7.3 Write property test for landmark encoding round trip
    - **Property 1: Landmark encoding round trip**
    - **Validates: Requirements 4.3, 4.7**

  - [ ]* 7.4 Write property test for key landmark visibility average and format
    - **Property 10: Key landmark visibility average and format**
    - **Validates: Requirements 6.3**

  - [ ]* 7.5 Write property test for full-body status
    - **Property 11: Full-body status**
    - **Validates: Requirements 7.1, 7.2**

  - [ ]* 7.6 Write unit tests for landmark helpers
    - `modelErrorMessage` output starts with "Model failed to load"; `formatVisibility(null) === '--'`
    - _Requirements: 4.6, 6.3_

  - [ ] 7.7 Implement `src/pose/throttle.ts`
    - `shouldDeliver(nowMs, lastMs)` worklet using `(now - last) * 30 >= 1000`
    - _Requirements: 4.4_

  - [ ]* 7.8 Write property test for the throttle
    - **Property 2: Throttle caps delivery rate**
    - **Validates: Requirements 4.4**

- [ ] 8. Implement pure pose logic: Preview_Mapping and skeleton
  - [ ] 8.1 Implement `src/pose/previewMapping.ts`
    - `mapPoint(nx, ny, params)` with aspect-fill scale, centered crop, and mirroring as `viewWidth - x`
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ]* 8.2 Write property test for front-camera mirroring
    - **Property 5: Front-camera mirroring is a horizontal reflection**
    - **Validates: Requirements 5.4, 5.5**

  - [ ]* 8.3 Write property test for aspect-fill mapping
    - **Property 6: Aspect-fill mapping**
    - **Validates: Requirements 5.3, 5.5**

  - [ ] 8.4 Implement `src/pose/skeleton.ts`
    - `buildSkeleton(lms, params)` returns SKELETON_SEGMENTS lines and SKELETON_JOINTS dots via `mapPoint`; empty output for empty landmarks or frame size ≤ 0
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

  - [ ]* 8.5 Write property test for skeleton structure
    - **Property 3: Skeleton structure**
    - **Validates: Requirements 5.1, 5.2, 5.6**

  - [ ]* 8.6 Write property test for skeleton positions
    - **Property 4: Skeleton positions come from Preview_Mapping**
    - **Validates: Requirements 5.3**

- [ ] 9. Implement pure pose logic: statistics
  - [ ] 9.1 Implement `src/pose/stats.ts`
    - `resetStats`, `addSample` (prunes samples older than 2 s), `computeStats` with steady-state `n / 2` and warm-up `(n - 1) / (elapsed / 1000)` FPS
    - _Requirements: 6.1, 6.2, 6.4, 8.2_

  - [ ]* 9.2 Write property test for the latency average
    - **Property 7: Latency average matches the 2-second window**
    - **Validates: Requirements 6.2**

  - [ ]* 9.3 Write property test for FPS
    - **Property 8: FPS measures the delivery rate**
    - **Validates: Requirements 6.1**

  - [ ]* 9.4 Write property test for reset
    - **Property 9: Reset restarts statistics from zero**
    - **Validates: Requirements 6.4, 8.2**

- [ ] 10. Checkpoint - Ensure all tests pass
  - Run `npm test -- --watchAll=false` and `npm run typecheck`. Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement hooks
  - [ ] 11.1 Implement `src/hooks/usePoseFrameProcessor.ts`
    - Worklet throttles with `shouldDeliver` and a worklets-core shared value, calls `detectPose`, drops `suspended` results, and hops to the JS_Thread with `Worklets.createRunOnJS` (memoized); comment the hop as a Bridge_Method
    - _Requirements: 4.1, 4.2, 4.4, 10.2_

  - [ ] 11.2 Implement `src/hooks/useAppForeground.ts`
    - Subscribe to `AppState`; return `true` only when `'active'`; on background set inactive then call `onBackground`, on foreground call `onForeground` then set active
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 11.3 Implement `src/hooks/useCameraPermissionGate.ts`
    - Request permission once on mount via `useCameraPermission`; re-check with `Camera.getCameraPermissionStatus()` on each foreground transition; `openSettings` calls `Linking.openSettings()`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 12. Implement UI and wire the app
  - [ ] 12.1 Implement `src/components/SkeletonOverlay.tsx`
    - Absolutely positioned `<Svg pointerEvents="none">` rendering `<Line>` per line and `<Circle r={5}>` per dot from `buildSkeleton`; empty Svg for empty landmarks
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 12.2 Implement `src/components/StatsPanel.tsx`
    - Show `Pose FPS` (1 decimal), `Latency` in ms (1 decimal, `--` when null), and `Visibility` via `formatVisibility`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 12.3 Implement `src/components/PermissionDenied.tsx`
    - Message "Camera access is required to track your pose." and an "Open Settings" button calling the provided handler
    - _Requirements: 3.3, 3.4_

  - [ ] 12.4 Implement `src/screens/PoseScreen.tsx`
    - State for `cameraPosition` (default front), `viewSize`, `latest`, `stats`, `modelError`, and a 500 ms `now` tick
    - `useCameraDevice`, `useCameraFormat` (30 fps, ~640×480), `<Camera>` with `pixelFormat="rgb"`, `resizeMode="cover"`, `isActive={isForeground && permission === 'granted'}`
    - Stable `onResult`: on `error` set `modelError` and clear landmarks without a stats sample; otherwise decode landmarks and `addSample`
    - Reset stats on camera change and on Reset_Stats_Button; Camera_Toggle switches front/back; mirror when `cameraPosition === 'front'`
    - Render the permission-denied view, the model error banner via `modelErrorMessage`, "No <front/back> camera found", or camera + overlay + stats + Status_Message + controls
    - Pass `PoseLandmarker.release` / `PoseLandmarker.resume` to `useAppForeground`
    - _Requirements: 3.2, 3.3, 3.5, 4.6, 5.4, 5.5, 6.4, 7.1, 7.2, 8.1, 8.2, 9.1, 9.2, 9.3_

  - [ ] 12.5 Wire `App.tsx` and `index.ts`
    - `App.tsx` renders `PoseScreen` with a status bar; `index.ts` calls `registerRootComponent(App)`
    - _Requirements: 1.1, 3.1_

- [ ] 13. Write the README
  - [ ] 13.1 Write `PoseSpike/README.md`
    - Sections in the design's order: what this is, prerequisites, USB debugging with `adb devices`, exact setup commands, dependency version table using the versions resolved in 1.2 (plus Model_File name, variant, URL, download date, and minSdkVersion 29), full file tree excluding `node_modules/` and `android/`, how it works, step-by-step acceptance procedure for the five checks, results table, running tests, and "Could not verify / may need adjustment"
    - Results table has exactly the columns `| Device model | Android version | Front camera FPS | Rear camera FPS | Latency ms | Notes |` with one blank data row
    - Could-not-verify section states that nothing was run on a physical device and why, and covers model URL and storage location, version compatibility, API changes (VisionCamera plugins, worklets-core, MediaPipe Tasks Vision, Expo config plugins), frame conversion, rotation and mirroring, and throttle effect
    - State that the on-device acceptance checks are done by the user
    - Include the manual download-script checks (run twice for the skip message; bad `POSE_MODEL_URL` for a non-zero exit)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 12.6_

- [ ] 14. Final verification
  - [ ] 14.1 Run typecheck and tests and fix failures
    - Run `npx tsc --noEmit` and `npx jest --watchAll=false` (Jest's single-run mode) in `PoseSpike/`; fix any errors in the code
    - Review that every Kotlin method in `modules/pose-landmarker/android` and every Bridge_Method (TS and Kotlin) has a short comment; add any that are missing
    - Search `src/`, `modules/`, and `App.tsx` for `fetch`, `XMLHttpRequest`, `WebSocket`, `AsyncStorage`, `SecureStore`, `FileSystem`, and analytics SDKs; confirm none are used at runtime
    - _Requirements: 1.1, 10.1, 10.2, 10.3_

  - [ ] 14.2 Attempt the Android prebuild and Gradle build, and record the outcome
    - If an Android SDK is available (`ANDROID_HOME` or `ANDROID_SDK_ROOT` set, or `adb` on PATH): run `npm run download-model`, `npx expo prebuild -p android`, then `gradlew.bat assembleDebug` in `PoseSpike/android`; fix Kotlin or Gradle errors (for example the `:react-native-vision-camera` project name in `android/settings.gradle`, or `noCompress 'task'`)
    - Confirm the model file is in `android/app/src/main/assets/` after prebuild
    - If the SDK or network is unavailable, or the build cannot be made to pass, record what was not verified and why in the README "Could not verify / may need adjustment" section
    - Update the README file tree and version table if anything changed
    - _Requirements: 1.2, 1.3, 1.5, 1.6, 2.4, 11.5, 11.6_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - The on-device acceptance checks (Requirement 12.1–12.5) must be done by the user on a physical Android device using the README procedure, with results recorded in the README results table.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- Property tests use Jest + fast-check with at least 100 runs each and the tag comment `// Feature: pose-spike, Property <n>: <title>`.
- Use `--watchAll=false` (or CI mode) for Jest so it runs once and exits.
- Native behaviour (permission flow, inference, lifecycle, overlay alignment, performance) cannot be tested automatically here. The user checks it on a device.
- If an installed library API differs from the design's assumptions, adjust only the file listed in the design's "VisionCamera API adjustment notes" table and record it in the README.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "2.1", "4.1", "7.1"] },
    { "id": 3, "tasks": ["3.1", "3.2", "5.1", "5.2", "6.1", "7.2", "7.7", "8.1", "9.1"] },
    { "id": 4, "tasks": ["3.3", "5.3", "7.3", "7.8", "8.2", "8.4", "9.2", "11.2", "11.3"] },
    { "id": 5, "tasks": ["5.4", "5.5", "7.4", "8.3", "8.5", "9.3", "11.1", "12.1", "12.2", "12.3"] },
    { "id": 6, "tasks": ["7.5", "8.6", "9.4", "12.4"] },
    { "id": 7, "tasks": ["7.6", "12.5"] },
    { "id": 8, "tasks": ["13.1"] },
    { "id": 9, "tasks": ["14.1"] },
    { "id": 10, "tasks": ["14.2"] }
  ]
}
```
