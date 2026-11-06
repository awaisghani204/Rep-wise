# PoseSpike

## What this is

PoseSpike is a throwaway technical spike. It checks whether real-time, on-device human pose estimation works on Android inside an Expo + TypeScript development build. The app has one screen. It shows the camera preview from react-native-vision-camera and runs MediaPipe PoseLandmarker in Kotlin through a VisionCamera Frame Processor Plugin. It draws a skeleton over the preview with react-native-svg and shows a stats panel (pose FPS, native latency, average key-landmark visibility) and a status message. There is no backend, storage, analytics, or network use at runtime. The model ships inside the APK.

Two behaviours were added beyond the original request:

- Stats (Pose FPS and latency averages) reset when you switch cameras.
- If the model fails to load, a red banner shows "Model failed to load: …".

The on-device acceptance checks below have to be done by you, on a physical Android phone. They have not been run (see [Could not verify / may need adjustment](#could-not-verify--may-need-adjustment)).

## Prerequisites

- **Node.js**: a version allowed by React Native 0.88's `engines` field, `^22.13.0 || ^24.3.0 || >= 26.0.0`. Current Node LTS works.
- **JDK 17**, or the version required by the installed React Native and Android Gradle Plugin. JDK 17 is the React Native recommendation this was written against. It was not checked for React Native 0.88 (no JDK was installed on the authoring machine).
- **Android Studio** with the Android SDK, SDK Platform-Tools (`adb`), and a recent SDK platform. Set `ANDROID_HOME` to the SDK folder (for example `C:\Users\<you>\AppData\Local\Android\Sdk` on Windows, `~/Android/Sdk` on Linux, `~/Library/Android/sdk` on macOS) and put `platform-tools` on `PATH`.
- **A physical Android phone running Android 10 (API 29) or newer**, plus a USB data cable. The app sets `minSdkVersion` 29. An emulator camera is not a useful test of pose tracking.

## Enable USB debugging

1. On the phone, open **Settings → About phone** and tap **Build number** 7 times. Some phones put it under **Settings → About phone → Software information**. Android confirms that developer options are on.
2. Open **Settings → System → Developer options** (location varies by manufacturer) and turn on **USB debugging**.
3. Connect the phone by USB. If the phone asks for a USB mode, pick **File transfer**.
4. Accept the **Allow USB debugging?** prompt on the phone (the RSA key fingerprint dialog). Tick "Always allow from this computer" to skip it next time.
5. On the computer, run:

   ```
   adb devices
   ```

   The phone must be listed with the state `device`, for example `R58M12ABCDE	device`. If it shows `unauthorized`, unlock the phone and accept the prompt. If it shows nothing, try another cable or port, or install the manufacturer's USB driver (Windows).

## Setup

These commands work the same in Windows PowerShell and in bash.

```
cd PoseSpike
npm install
npm run download-model
npx expo prebuild -p android
npx expo run:android --device
```

- `npm run download-model` downloads `pose_landmarker_lite.task` to `assets/models/`.
- `npx expo prebuild -p android` generates `android/`. It copies the model into `android/app/src/main/assets/`, sets minSdk 29, and adds the CAMERA permission. Add `--clean` to regenerate `android/` from scratch after changing `app.json` or a config plugin.
- `npx expo run:android --device` builds the development build and installs it on the USB device. Pick your phone if asked.

For later runs, when only JavaScript or TypeScript changed, start the dev server and open the installed PoseSpike app:

```
npx expo start --dev-client
```

Native changes (Kotlin, Gradle, `app.json`, config plugins) need `npx expo run:android --device` again.

### Manual checks for the download script

These need the network, so they are not automated.

1. Run `npm run download-model` twice. The second run prints `Model already present at <path>, skipping download.` and exits 0.
2. Run with a bad URL. It prints `Model download failed: HTTP 404 …` (or a network error) to stderr and exits non-zero. The script skips the download when the model is already present, so move the model away first and put it back afterwards:

   PowerShell:
   ```
   Move-Item assets/models/pose_landmarker_lite.task $env:TEMP
   $env:POSE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/does-not-exist"; npm run download-model; echo "exit code: $LASTEXITCODE"
   Remove-Item Env:POSE_MODEL_URL
   Move-Item "$env:TEMP/pose_landmarker_lite.task" assets/models/
   ```

   bash:
   ```
   mv assets/models/pose_landmarker_lite.task /tmp/
   POSE_MODEL_URL=https://storage.googleapis.com/mediapipe-models/does-not-exist npm run download-model; echo "exit code: $?"
   mv /tmp/pose_landmarker_lite.task assets/models/
   ```

   No `.part` file is left in `assets/models/` afterwards.

3. With the model missing, `npx expo prebuild -p android` fails with an error that names `npm run download-model`.

## Dependency versions

### Runtime

| Package | Version | How it was resolved |
|---|---|---|
| Expo SDK (`expo`) | 58.0.23 (SDK 58) | `npx create-expo-app@latest`, blank-typescript template |
| React Native | 0.88.1 | Expo SDK 58 template |
| React | 19.3.0 | Expo SDK 58 template |
| expo-dev-client | 58.0.18 | `npx expo install` |
| expo-build-properties | 58.0.12 | `npx expo install` |
| expo-status-bar | 58.0.4 | Expo SDK 58 template |
| react-native-svg | 15.16.0 | `npx expo install` (SDK-matched) |
| react-native-vision-camera | 4.7.3 (pinned exactly) | Newest 4.x, see [Why VisionCamera 4.x](#why-visioncamera-4x) |
| react-native-worklets-core | 1.6.3 (pinned exactly) | Latest stable on npm (2.0.0 is beta only) |
| pose-landmarker (local module) | 0.1.0 | `file:./modules/pose-landmarker` |

### Native (Android)

| Item | Value |
|---|---|
| MediaPipe Tasks Vision | `com.google.mediapipe:tasks-vision:1.2.2`, from Google Maven ([maven-metadata.xml](https://dl.google.com/android/maven2/com/google/mediapipe/tasks-vision/maven-metadata.xml) lists `<release>1.2.2</release>`, last updated 2026-11-03) |
| Model_File name | `pose_landmarker_lite.task` |
| Model variant | PoseLandmarker **lite**, float16 |
| Model URL | https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task |
| Model download date | 2026-11-06 (5,777,746 bytes) |
| Android minSdkVersion | 29 (set by expo-build-properties in `app.json`) |
| Inference settings | `RunningMode.VIDEO`, `numPoses = 1`, CPU delegate (`USE_GPU = false` in `PoseLandmarkerHolder.kt`) |

### Dev only (build and test tooling, not in the app bundle)

| Package | Version |
|---|---|
| typescript | 6.0.3 |
| @types/react | 19.3.0 |
| jest | 30.5.2 |
| jest-expo | 58.0.14 |
| @types/jest | 30.0.0 |
| fast-check | 4.10.2 |
| babel-preset-expo | 58.0.24 (`~58.0.0`, via `npx expo install`) |
| @babel/plugin-transform-arrow-functions | 7.29.7 |
| @babel/plugin-transform-shorthand-properties | 7.29.7 |
| @babel/plugin-transform-template-literals | 7.29.7 |
| @babel/plugin-proposal-optional-chaining | 7.21.0 |
| @babel/plugin-proposal-nullish-coalescing-operator | 7.18.6 |

`@babel/core` is 7.29.13, installed transitively by Expo SDK 58.

#### Why the Babel dev packages are installed

- The react-native-worklets-core 1.6.3 Babel plugin uses the five `@babel/plugin-*` packages above to turn `'worklet'` functions into ES5-style code strings, but it does not declare them as dependencies. They must be installed directly.
- The two `proposal` packages are deprecated in favour of `transform-optional-chaining` and `transform-nullish-coalescing-operator`, but worklets-core asks for the `proposal` names.
- They are pinned to the Babel 7 line (`^7`). Their npm `latest` tags are Babel 8 (for example arrow-functions 8.0.1), which needs `@babel/core ^8` and fails to install next to `@babel/core` 7.29.13.
- `babel-preset-expo` is a direct devDependency so `babel.config.js` can name it as `'babel-preset-expo'`. Before this, npm had nested it under `node_modules/expo/node_modules`. `npx expo install` put it in `dependencies`, so it was moved to `devDependencies` by hand.
- Checked: `@babel/core` `transformFileSync` with `babel.config.js` on a `'worklet'` function produced `__workletHash`, `__initData`, and `__closure`, with all five syntax features lowered in the worklet string. `npx expo config --type prebuild --json` still resolves (portrait, `com.example.posespike`, all plugins, CAMERA permission only).

#### Why VisionCamera 4.x

- `npm view react-native-vision-camera version` returns 5.2.4 (released 2026-10-29). Its peer dependencies are `react`, `react-native`, `react-native-nitro-image`, and `react-native-nitro-modules`, with no react-native-worklets-core. VisionCamera 5 uses Nitro Modules instead of worklets-core Frame Processor Plugins.
- The spike requires react-native-worklets-core, so 5.x is excluded.
- 4.7.3 (released 2025-11-12) is the newest 4.x. Its peer dependencies include `react-native-worklets-core: "*"` (optional), plus optional `react-native-reanimated` and `@shopify/react-native-skia`.
- react-native-worklets-core 1.6.3 (released 2026-02-12) is the latest stable. Its peers are `react: *` and `react-native: *`.

#### Dependency checks that were run

- `npx expo install --check`: "Dependencies are up to date".
- `npx expo-doctor` (expo-doctor 1.21.6): "20/20 checks passed. No issues detected!"
- `npm audit` reports 24 vulnerabilities (1 low, 23 moderate), all in transitive packages. They were left alone because `npm audit fix --force` would make breaking version changes.
- Under PowerShell, `npx expo install jest-expo jest @types/jest -- --save-dev` dropped `--save-dev`. Those packages were moved to `devDependencies` by hand and `npm install` was re-run.

## Project file tree

Excludes `node_modules/`, `android/`, `ios/`, and `.expo/` (generated or dependency folders).

```
PoseSpike/
├── .gitignore
├── AGENTS.md                       # Expo template notes for coding agents
├── App.tsx                         # renders PoseScreen with a status bar
├── LICENSE
├── README.md
├── app.json                        # portrait, package id, VisionCamera + build-properties + model plugins
├── babel.config.js                 # babel-preset-expo + react-native-worklets-core/plugin
├── index.ts                        # registerRootComponent(App)
├── jest.config.js                  # preset: jest-expo
├── package-lock.json
├── package.json
├── tsconfig.json
├── assets/
│   ├── android-icon-background.png
│   ├── android-icon-foreground.png
│   ├── android-icon-monochrome.png
│   ├── favicon.png
│   ├── icon.png
│   ├── splash-icon.png
│   └── models/
│       └── .gitkeep                # pose_landmarker_lite.task is saved here by npm run download-model (git-ignored)
├── modules/
│   └── pose-landmarker/            # local Expo module (Android only)
│       ├── expo-module.config.json
│       ├── index.ts
│       ├── package.json
│       ├── android/
│       │   ├── build.gradle
│       │   └── src/main/
│       │       ├── AndroidManifest.xml
│       │       └── java/expo/modules/poselandmarker/
│       │           ├── FrameConverter.kt
│       │           ├── PoseFrameProcessorPlugin.kt
│       │           ├── PoseLandmarkerHolder.kt
│       │           ├── PoseLandmarkerModule.kt
│       │           ├── PoseLandmarkerPackage.kt
│       │           └── PoseResult.kt
│       └── src/
│           ├── PoseLandmarkerModule.ts
│           ├── detectPose.ts
│           └── types.ts
├── plugins/
│   ├── withPoseModel.js            # copies the model into android/app/src/main/assets on prebuild
│   └── __tests__/
│       └── withPoseModel.test.js
├── scripts/
│   └── download-model.js
└── src/
    ├── components/
    │   ├── PermissionDenied.tsx
    │   ├── SkeletonOverlay.tsx
    │   └── StatsPanel.tsx
    ├── hooks/
    │   ├── useAppForeground.ts
    │   ├── useCameraPermissionGate.ts
    │   └── usePoseFrameProcessor.ts
    ├── pose/
    │   ├── constants.ts
    │   ├── landmarks.ts
    │   ├── previewMapping.ts
    │   ├── skeleton.ts
    │   ├── stats.ts
    │   ├── throttle.ts
    │   └── __tests__/
    │       ├── arbitraries.ts
    │       ├── dependencies.test.ts
    │       ├── landmarks.test.ts
    │       ├── previewMapping.test.ts
    │       ├── skeleton.test.ts
    │       ├── stats.test.ts
    │       └── throttle.test.ts
    └── screens/
        └── PoseScreen.tsx
```

## How it works

### Frame path

1. VisionCamera delivers RGBA frames (`pixelFormat="rgb"`, about 640×480, 30 fps) to a frame processor worklet (`src/hooks/usePoseFrameProcessor.ts`). The worklet runs on the frame processor thread, not the JS thread.
2. The worklet throttles with `shouldDeliver` (`src/pose/throttle.ts`). It calls the plugin only if at least 1000/30 ms have passed since the last call, so at most 30 results per second reach JS.
3. The worklet calls the Kotlin `detectPose` Frame Processor Plugin. `PoseLandmarkerHolder` copies the frame into a reused Bitmap and runs MediaPipe PoseLandmarker in `VIDEO` mode (`detectForVideo`, synchronous), passing the frame rotation to MediaPipe.
4. The plugin returns a small result: 33 landmarks as a flat array of 132 numbers (x, y, z, visibility), the native latency of that call in ms (frame conversion plus inference), and the upright frame size. Camera frames never cross to JS.
5. `Worklets.createRunOnJS` hands the result to the JS thread. `PoseScreen` decodes the landmarks and adds a stats sample. `SkeletonOverlay` maps landmarks onto the preview (aspect-fill crop, mirrored for the front camera) and draws 12 lines and 12 dots. `StatsPanel` shows Pose FPS and average latency over the last 2 seconds and the mean visibility of the 10 key landmarks (shoulders, elbows, hips, knees, ankles). The status reads "Body fully visible" only when all 10 key landmarks have visibility above 0.6.

Observed Pose FPS can be in the mid-20s even when the camera runs at 30 fps. Camera frame timing jitters, and a frame that arrives slightly less than 33.3 ms after the last accepted one is dropped by the throttle. Inference that takes longer than one frame also lowers FPS, because VisionCamera drops frames that arrive while the frame processor is busy. That is the number the spike measures.

### Lifecycle

`useAppForeground` listens to `AppState`.

- **Background:** the camera's `isActive` goes false, then `PoseLandmarker.release()` closes the native PoseLandmarker. Frames already in flight return a "suspended" result that the worklet drops.
- **Foreground:** `PoseLandmarker.resume()` runs, then the camera becomes active again. The next frame re-creates the PoseLandmarker before inference. Camera permission is re-checked, so granting it in Settings and returning shows the preview.

`adb logcat -s PoseLandmarker` shows the "created", "released", and "resume requested" log lines.

## Acceptance check procedure

You run these checks on a physical Android phone after [Setup](#setup). Write the values in the [Results](#results) table, one row per device.

1. **Camera opens.** Launch PoseSpike. Allow camera access when asked. The live preview fills the screen with the stats panel at the top left and the **Switch camera** and **Reset stats** buttons at the bottom. Record: pass or fail in Notes.
   - Also check the denied path: uninstall and reinstall (or clear the app's permissions), launch, and deny. The screen shows "Camera access is required to track your pose." and an **Open Settings** button. The button opens PoseSpike's app settings. Grant Camera there and return to the app. The preview appears.
2. **Skeleton tracks.** Prop the phone up and stand about 2 m in front of the front camera with your whole body in frame. The skeleton (shoulders, arms, torso, legs) follows your body and lines up with it as you move. Record: pass or fail, and any offset, rotation, or left/right flip in Notes.
3. **Stats update live.** Watch **Pose FPS** and **Latency** change as you move. Press **Reset stats**, wait about 10 s, then record Pose FPS as "Front camera FPS" and Latency as "Latency ms". Press **Switch camera** (stats reset automatically), stand in front of the rear camera, wait about 10 s, and record Pose FPS as "Rear camera FPS". If rear latency differs noticeably, add it to Notes.
4. **Status changes.** With your full body in frame, the status reads "Body fully visible". Step out of frame. Within about a second it changes to "Move back or improve lighting". Record: pass or fail in Notes.
5. **Background and resume.** Press Home, wait 5 s, and open PoseSpike again from recent apps. The app has not crashed, the preview returns, and the skeleton tracks again. Record: pass or fail in Notes. Optional: watch `adb logcat -s PoseLandmarker` for the release and re-create lines.

Also record the device model and Android version (Settings → About phone).

## Results

| Device model | Android version | Front camera FPS | Rear camera FPS | Latency ms | Notes |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## Running tests

```
npm test -- --watchAll=false
npm run typecheck
```

Jest (preset `jest-expo`) runs unit tests and fast-check property tests for the pure TypeScript logic in `src/pose/` (landmark decoding, throttle, preview mapping, skeleton geometry, stats, visibility and status) and for the model-copy config plugin. A dependency test checks that `package.json` runtime dependencies stay within the allowed set. The native Kotlin code, permission flow, lifecycle, overlay alignment, and performance are not covered by automated tests. They are covered by the acceptance procedure above.

## Could not verify / may need adjustment

Nothing in this project has been run on a physical Android device. No device was connected while it was written, and the authoring machine had no JDK and no `ANDROID_HOME` set. All device behaviour below is unverified. The code was written against documented APIs and, where noted, against the installed library sources.

### Build verification

**Not run: the Gradle build.** `gradlew.bat assembleDebug` was not run, so the Kotlin module, the Gradle dependencies (including `tasks-vision:1.2.2`), and the APK were never compiled or resolved. The authoring machine had no JDK and no Android SDK:

- `ANDROID_HOME`, `ANDROID_SDK_ROOT`, and `JAVA_HOME` were not set.
- `adb` and `java` were not on `PATH`.
- None of these folders existed: `%LOCALAPPDATA%\Android\Sdk`, `C:\Program Files\Android\Android Studio\jbr`, `C:\Program Files\Java`, `C:\Program Files\Eclipse Adoptium`, `C:\Program Files\Microsoft\jdk*`.

No JDK or SDK was installed for this check. Any Kotlin compile error or Gradle resolution error will first appear when you run `npx expo run:android --device`.

**Run and passed: prebuild only.** These commands were run in `PoseSpike/`:

```
npm run download-model
npx expo prebuild -p android --no-install
```

- `npm run download-model` found the model already present (5,777,746 bytes) and skipped the download.
- `npx expo prebuild -p android --no-install` needs only Node. It exited 0. It printed one info line about `userInterfaceStyle` and `expo-system-ui`, which does not matter for this spike.

The following checks were made on the generated `android/` folder:

| Check | Result |
|---|---|
| Model copied by `withPoseModel` | `android/app/src/main/assets/pose_landmarker_lite.task` is 5,777,746 bytes. Its SHA-256 matches the source in `assets/models/`. |
| minSdkVersion 29 | `android/gradle.properties` contains `android.minSdkVersion=29`, and `android/build.gradle` reads it with `minSdkVersion rootProject.ext.minSdkVersion`. |
| Package id and orientation | `namespace` and `applicationId` are `com.example.posespike`. MainActivity has `android:screenOrientation="portrait"`. |
| CAMERA permission | Present in `AndroidManifest.xml`. `RECORD_AUDIO` does not appear in any generated manifest. |
| Vision-camera Gradle project name | `settings.gradle` has no hard-coded `include` lines. It autolinks from the command `expo-modules-autolinking react-native-config`, which lists `react-native-vision-camera` with `sourceDir` `node_modules/react-native-vision-camera/android`. React Native's settings plugin names each project `":" + nameCleansed` (`ModelAutolinkingDependenciesJson.kt`), which gives `:react-native-vision-camera`. That matches `implementation project(':react-native-vision-camera')` in `modules/pose-landmarker/android/build.gradle`. |
| Local module autolinked | `npx expo-modules-autolinking resolve -p android` lists `pose-landmarker` 0.1.0 with `sourceDir` `modules/pose-landmarker/android`, module `expo.modules.poselandmarker.PoseLandmarkerModule`, and package `expo.modules.poselandmarker.PoseLandmarkerPackage`. This means the `Package` (and the `detectPose` plugin registration in it) is discovered. |
| `ExpoModulesPackageList` | Not generated at prebuild. No `ExpoModulesPackageList*` or `PackageList*` file exists in `android/`. Expo autolinking generates them during the Gradle build, so they were not checked. |
| Gradle and architecture | The Gradle wrapper is 9.4.1. `newArchEnabled=true` and `hermesEnabled=true`. |

**Notes from prebuild:**

- **`noCompress 'task'` was not added.** The generated `android/app/build.gradle` has an `androidResources` block with only `ignoreAssetsPattern`, so there is no `noCompress` entry for `.task`. Whether MediaPipe can load a compressed `.task` asset is unverified (see [Model URL and storage](#model-url-and-storage)).
- **The merged template manifest has more permissions than CAMERA.** It also lists `INTERNET`, `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` (both `maxSdkVersion 32`), `SYSTEM_ALERT_WINDOW`, and `VIBRATE`. These come from Expo's default Android template, not from this project. The development build needs `INTERNET` to reach the Metro dev server. The app code makes no network requests at runtime. The others could be removed with `android.blockedPermissions` in `app.json`. This was left alone because it was out of scope for the spike.
- **Prebuild changed `package.json`.** It reported "Updated package.json", which Expo does to set the `android` and `ios` scripts to `expo run:android` and `expo run:ios`. The `android` script was already `expo run:android`. PoseSpike is not tracked in git yet, so no diff could be shown. Dependencies are unchanged.
- **The generated `android/` folder was deleted** (`Remove-Item -Recurse -Force android` in `PoseSpike/`), leaving the project as it was. Setup's `npx expo prebuild -p android` regenerates it.

### Model URL and storage

- The model URL uses the `latest` path on `storage.googleapis.com/mediapipe-models`. Google can move it or change the file behind it. If the download fails, find the current URL on the MediaPipe Pose Landmarker page and set `POSE_MODEL_URL`.
- The model is stored at `assets/models/pose_landmarker_lite.task` and copied to `android/app/src/main/assets/` on prebuild. Loading from APK assets is unverified on device. If PoseLandmarker reports a compressed-asset or file-descriptor error, the APK is compressing the `.task` file. Add `androidResources { noCompress 'task' }` to the app's `build.gradle` through a small `withAppBuildGradle` config plugin (do not edit `android/` by hand, since prebuild regenerates it).

### Version compatibility

- **VisionCamera 4.7.3 on React Native 0.88 and the New Architecture.** 4.7.3 was built and tested against React Native 0.75 (its devDependency is `react-native ^0.75.4`). React Native 0.82 and later run only on the New Architecture, so 4.7.3 would run through the interop layer. Its peer range `react-native: *` says nothing about compatibility. A native build failure or runtime issue is possible.
- **react-native-worklets-core 1.6.3 on React Native 0.88.** It was released before React Native 0.88, and its peer range `*` says nothing about compatibility. The 2.0.0 beta may be the line that targets newer React Native.
- **VisionCamera 4.x is the legacy line.** VisionCamera 5 moved to Nitro Modules and dropped worklets-core plugins, so 4.x was pinned. It may not get fixes for future React Native or Expo releases.
- **MediaPipe tasks-vision 1.2.2.** Maven Central (`repo1.maven.org`) returned 404 for this artifact. It was found on Google Maven, which Android projects reach through `google()`. The design assumed the 0.10.x line, which has since moved to 1.x, so `PoseLandmarker`, `MPImage`, `BitmapImageBuilder`, or `ImageProcessingOptions` may have changed. The Kotlin code has not been checked against the 1.2.2 sources.
- **Compatibility of the whole set** (Expo SDK 58, React Native 0.88.1, VisionCamera 4.7.3, worklets-core 1.6.3, react-native-svg 15.16.0, tasks-vision 1.2.2) has not been proven by a build or a device run.
- **JDK version.** JDK 17 is assumed. React Native 0.88's Android Gradle Plugin may require a newer JDK. If Gradle reports an unsupported Java version, install the version it names.

### API changes that may need code adjustment

| API | Assumption | File to change |
|---|---|---|
| VisionCamera plugin registration | `FrameProcessorPluginRegistry.addFrameProcessorPlugin("detectPose") { proxy, options -> }` (4.x package `com.mrousavy.camera.frameprocessors`) | `PoseLandmarkerPackage.kt` |
| VisionCamera plugin base class | `FrameProcessorPlugin.callback(frame, arguments): Any?` | `PoseFrameProcessorPlugin.kt` |
| VisionCamera Frame accessors | `frame.image`, `width`, `height`, `orientation`, `isMirrored`, `timestamp`, `pixelFormat` | `FrameConverter.kt`, `PoseLandmarkerHolder.kt` |
| VisionCamera JS plugin init | `VisionCameraProxy.initFrameProcessorPlugin('detectPose', {})` | `modules/pose-landmarker/src/detectPose.ts` |
| worklets-core JS hop and shared value | `Worklets.createRunOnJS`, `useSharedValue` | `src/hooks/usePoseFrameProcessor.ts` |
| VisionCamera permission | `useCameraPermission()`, synchronous `Camera.getCameraPermissionStatus()` | `src/hooks/useCameraPermissionGate.ts` |
| MediaPipe Tasks Vision | `PoseLandmarkerOptions`, `RunningMode.VIDEO`, `detectForVideo(image, ImageProcessingOptions, tsMs)`, `NormalizedLandmark.visibility(): Optional<Float>` | `PoseLandmarkerHolder.kt`, `FrameConverter.kt` |
| Expo config plugins | `withDangerousMod` from `expo/config-plugins`, `modRequest.projectRoot` / `platformProjectRoot` | `plugins/withPoseModel.js` |
| Expo autolinking of `Package` | Autolinking finds `PoseLandmarkerPackage` because the file name ends in `Package.kt` and it contains the line `import expo.modules.core.interfaces.Package` (checked in Expo SDK 58's expo-modules-autolinking sources, not at runtime). If the banner shows `Pose plugin "detectPose" is not registered`, use the fallback documented in `PoseLandmarkerPackage.kt`: register from a static block in `PoseLandmarkerModule` and call an `ensureRegistered()` function from JS first. | `PoseLandmarkerPackage.kt`, `PoseLandmarkerModule.kt`, `detectPose.ts` |
| Gradle project name | `implementation project(':react-native-vision-camera')` | `modules/pose-landmarker/android/build.gradle` (check `android/settings.gradle` after prebuild) |

### Frame conversion

- `pixelFormat="rgb"` is assumed to give RGBA_8888 frames (CameraX `OUTPUT_IMAGE_FORMAT_RGBA_8888`) with pixel stride 4 on every test device. `FrameConverter` throws for any other format, which shows up as empty landmarks and an error in logcat. Fallback: switch to `pixelFormat="yuv"` and write a manual YUV_420_888 to ARGB conversion in `FrameConverter.toMPImage` (RenderScript is deprecated, so it is not an option).
- The `MPImage` is deliberately not closed after each call. It wraps the reused Bitmap, and closing a Bitmap-backed `MPImage` would recycle that Bitmap and break the next frame. This assumes the wrapper holds no native resources of its own. If memory grows during a long run, revisit this.
- `frame.timestamp` is assumed to be in nanoseconds (CameraX `ImageInfo.getTimestamp()` in VisionCamera 4.7.3). It is divided by 1,000,000 for MediaPipe's millisecond timestamp, with a guard that keeps timestamps strictly increasing. If MediaPipe throws a timestamp error, check the unit.

### Rotation and mirroring

- `FrameConverter.rotationDegrees` maps VisionCamera's `frame.orientation` back to the CameraX clockwise rotation and passes it to MediaPipe. This is unverified on device. If the skeleton appears rotated by 90° or 180°, fix only that function (for example, swap the 90 and 270 cases).
- The front-camera skeleton is mirrored in JS (`cameraPosition === 'front'`), assuming VisionCamera mirrors the front preview but not the frame buffer. If the front skeleton is flipped left/right relative to your body, change the `mirrored` prop in `PoseScreen.tsx`.
- The aspect-fill mapping assumes the preview uses `resizeMode="cover"` with a centered crop. A consistent offset on one axis would point to a different crop rule.

### Throttle effect

The 30 per second throttle can drop frames that arrive slightly early because of camera timing jitter, so observed Pose FPS may sit in the mid-20s with a 30 fps camera. Whether this happens, and by how much, has not been measured.

### Tooling

- TypeScript 6.0.3 and Jest 30.5.2 with jest-expo 58.0.14 are new major versions, chosen as SDK-matched by `npx expo install`.
- `@types/node` is not a direct dependency. Version 26.6.6 is present only transitively (through the Jest packages), and type-checking of Node APIs in tests relies on that.
- The Babel `proposal` plugins are deprecated and pinned to Babel 7 to match the worklets-core 1.6.3 Babel plugin (see [Why the Babel dev packages are installed](#why-the-babel-dev-packages-are-installed)).
