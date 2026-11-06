# Requirements Document

## Introduction

PoseSpike is a throwaway technical spike that proves on-device, real-time human pose estimation works on Android inside an Expo + TypeScript development build. The app lives in `PoseSpike/` at the workspace root. A single screen shows the camera preview from react-native-vision-camera, runs MediaPipe PoseLandmarker in Kotlin through a VisionCamera Frame Processor Plugin (with react-native-worklets-core), draws a mirrored skeleton overlay with react-native-svg, and shows a stats panel (pose FPS, native latency, average key landmark visibility) plus a status message. Pose work stays off the JavaScript thread; only summarized landmark results cross the bridge. The native code is packaged as a local Expo module at `PoseSpike/modules/pose-landmarker`. The PoseLandmarker model file is fetched by a Node download script and copied into `android/app/src/main/assets/` on prebuild by an Expo config plugin. The spike has no backend, storage, analytics, or network use at runtime, and ships a README that documents exact setup steps, USB debugging, dependency versions, the full project file tree, a blank results table, and a "Could not verify / may need adjustment" section.

**Additions beyond the user's request:** The following behaviours were not in the user's original request and are included as additions:

- Stats reset on camera switch (Requirement 8, criterion 2).
- Model-load error message on the Pose_Screen (Requirement 4, criterion 6).

## Glossary

- **PoseSpike_App**: The Expo + TypeScript Android development-build application located in `PoseSpike/`.
- **Pose_Screen**: The single screen of the PoseSpike_App that contains the camera preview, the Skeleton_Overlay, the Stats_Panel, the Status_Message, the Camera_Toggle, and the Reset_Stats_Button.
- **Pose_Plugin**: The Kotlin VisionCamera Frame Processor Plugin, packaged in the Pose_Module, that runs MediaPipe PoseLandmarker on camera frames and returns Landmark_Results to JavaScript.
- **Pose_Module**: The local Expo module at `PoseSpike/modules/pose-landmarker` that contains the Pose_Plugin and its native lifecycle code.
- **Bridge_Method**: Any TypeScript or Kotlin function that passes data or calls between JavaScript and native code, including the frame processor call into the Pose_Plugin and any Pose_Module functions exposed to JavaScript.
- **JS_Thread**: The React Native JavaScript thread that runs React rendering and application logic.
- **Model_File**: The MediaPipe PoseLandmarker `.task` model file used by the Pose_Plugin.
- **Model_Download_Script**: The Node script in the PoseSpike_App that downloads the Model_File to a local project path.
- **Model_Config_Plugin**: The Expo config plugin that copies the Model_File into `android/app/src/main/assets/` during `expo prebuild`.
- **Pose_Call**: One invocation of PoseLandmarker on one camera frame inside the Pose_Plugin.
- **Landmark_Result**: The summarized output of one Pose_Call that crosses the bridge: the 33 pose landmarks (normalized x, y, z, and visibility) plus the Native_Latency of that Pose_Call, or an empty landmark list when no person is detected.
- **Landmark_Event**: One delivery of a Landmark_Result from the frame processor to the JS_Thread.
- **Key_Landmarks**: The 10 MediaPipe landmarks for left/right shoulder, elbow, hip, knee, and ankle, with indices 11, 12, 13, 14, 23, 24, 25, 26, 27, and 28. Wrists are excluded from the Key_Landmarks.
- **Key_Landmark_Visibility**: The arithmetic mean of the visibility scores of the Key_Landmarks in the most recent Landmark_Result.
- **Visibility_Threshold**: The fixed value 0.6.
- **Full_Body_Visible**: The condition in which the most recent Landmark_Result contains landmarks and every Key_Landmark in that Landmark_Result has a visibility score strictly greater than the Visibility_Threshold.
- **Status_Message**: The text on the Pose_Screen that reports whether the condition Full_Body_Visible holds.
- **Skeleton_Joints**: The 12 landmarks drawn as dots: left/right shoulder, elbow, wrist, hip, knee, and ankle (indices 11–16 and 23–28).
- **Skeleton_Segments**: The fixed set of lines drawn by the Skeleton_Overlay: left shoulder–right shoulder; left shoulder–left elbow; right shoulder–right elbow; left elbow–left wrist; right elbow–right wrist; left shoulder–left hip; right shoulder–right hip; left hip–right hip; left hip–left knee; right hip–right knee; left knee–left ankle; right knee–right ankle.
- **Skeleton_Overlay**: The react-native-svg layer drawn above the camera preview showing the Skeleton_Joints as dots and the Skeleton_Segments as lines.
- **Preview_Mapping**: The conversion of normalized landmark coordinates to Pose_Screen preview pixel coordinates that accounts for the preview's size, its scaling and aspect-fill cropping of the camera frame, and horizontal mirroring when the front camera is active.
- **Stats_Panel**: The on-screen panel showing Pose_FPS, Native_Latency, and Key_Landmark_Visibility.
- **Pose_FPS**: The average number of Landmark_Results received per second over the last 2 seconds.
- **Native_Latency**: The time in milliseconds the Pose_Plugin spends on one Pose_Call, measured in native code.
- **Camera_Toggle**: The control on the Pose_Screen that switches between the front and back cameras.
- **Reset_Stats_Button**: The control on the Pose_Screen that clears the accumulated statistics averages.
- **README**: The `PoseSpike/README.md` file.

## Requirements

### Requirement 1: Project setup and build configuration

**User Story:** As a developer, I want a minimal Expo + TypeScript dev-build project with only the required native libraries, so that the spike isolates the pose-estimation question.

#### Acceptance Criteria

1. THE PoseSpike_App SHALL be an Expo project written in TypeScript and located in the `PoseSpike/` directory of the workspace root.
2. THE PoseSpike_App SHALL run as an Expo development build (expo-dev-client) on Android.
3. THE PoseSpike_App SHALL set the Android minSdkVersion to 29.
4. THE PoseSpike_App SHALL declare as runtime dependencies only Expo core packages, react-native-vision-camera, react-native-worklets-core, react-native-svg, expo-dev-client, the Pose_Module, and the packages those libraries require as peer dependencies.
5. THE Pose_Module SHALL implement the Pose_Plugin in Kotlin using the MediaPipe Tasks Vision PoseLandmarker library.
6. THE Pose_Module SHALL reside at `PoseSpike/modules/pose-landmarker` and be autolinked as a local Expo module.

### Requirement 2: Model file provisioning

**User Story:** As a developer, I want the model fetched and bundled automatically, so that I can build the app without manually placing binary files.

#### Acceptance Criteria

1. WHEN the developer runs the Model_Download_Script, THE Model_Download_Script SHALL download the Model_File from the official MediaPipe model URL to a fixed local project path.
2. IF the Model_File already exists at the fixed local project path, THEN THE Model_Download_Script SHALL skip the download and report that the Model_File is present.
3. IF the download fails, THEN THE Model_Download_Script SHALL print an error message containing the failure reason and exit with a non-zero exit code.
4. WHEN `expo prebuild` runs, THE Model_Config_Plugin SHALL copy the Model_File into `android/app/src/main/assets/`.
5. IF the Model_File is missing when `expo prebuild` runs, THEN THE Model_Config_Plugin SHALL fail the prebuild with an error message that names the Model_Download_Script command.

### Requirement 3: Camera permission handling

**User Story:** As a user, I want clear guidance when camera access is denied, so that I can grant it and use the app.

#### Acceptance Criteria

1. WHEN the Pose_Screen opens and camera permission has not been requested, THE PoseSpike_App SHALL request camera permission from the user.
2. WHILE camera permission is granted, THE Pose_Screen SHALL display the live camera preview.
3. IF the user denies camera permission, THEN THE Pose_Screen SHALL display a message stating that camera access is required and an "Open Settings" button.
4. WHEN the user presses the "Open Settings" button, THE PoseSpike_App SHALL open the Android app settings page for the PoseSpike_App.
5. WHEN the PoseSpike_App returns to the foreground after camera permission was granted in settings, THE Pose_Screen SHALL display the live camera preview.

### Requirement 4: Pose inference and bridge transfer

**User Story:** As a developer, I want pose landmarks computed on-device off the JavaScript thread, so that I can measure real-time feasibility without blocking the UI.

#### Acceptance Criteria

1. WHILE the camera preview is active, THE Pose_Plugin SHALL perform a Pose_Call on camera frames and return a Landmark_Result for each Pose_Call.
2. THE Pose_Plugin SHALL perform every Pose_Call on a native or frame processor thread separate from the JS_Thread.
3. THE PoseSpike_App SHALL transfer only Landmark_Results across the bridge, each containing the 33 landmarks (normalized x, y, z, and visibility) and the Native_Latency of the Pose_Call.
4. THE PoseSpike_App SHALL deliver at most 30 Landmark_Events per second to the JS_Thread.
5. THE Pose_Plugin SHALL load the Model_File from the Android app assets.
6. IF the Pose_Plugin fails to load the Model_File, THEN THE Pose_Screen SHALL display an error message stating that the model failed to load. (Addition beyond the user's request.)
7. WHEN PoseLandmarker detects no person in a frame, THE Pose_Plugin SHALL return a Landmark_Result with an empty landmark list.
8. THE PoseSpike_App SHALL perform all pose inference on-device without network access.

### Requirement 5: Skeleton overlay

**User Story:** As a user, I want to see a skeleton drawn over my body, so that I can visually judge tracking accuracy.

#### Acceptance Criteria

1. WHEN a Landmark_Event containing landmarks is received, THE Skeleton_Overlay SHALL draw exactly the Skeleton_Segments as lines.
2. WHEN a Landmark_Event containing landmarks is received, THE Skeleton_Overlay SHALL draw a dot at each of the Skeleton_Joints.
3. THE Skeleton_Overlay SHALL position every dot and line endpoint using the Preview_Mapping.
4. WHILE the front camera is active, THE Skeleton_Overlay SHALL mirror landmark x-coordinates horizontally so that the skeleton aligns with the mirrored preview.
5. WHILE the back camera is active, THE Skeleton_Overlay SHALL draw landmark x-coordinates without mirroring.
6. WHEN a Landmark_Event with an empty landmark list is received, THE Skeleton_Overlay SHALL clear the drawn skeleton.

### Requirement 6: Statistics panel

**User Story:** As a developer, I want live performance and quality stats, so that I can record spike results.

#### Acceptance Criteria

1. THE Stats_Panel SHALL display Pose_FPS as the average number of Landmark_Results received per second over the last 2 seconds.
2. THE Stats_Panel SHALL display the average Native_Latency in milliseconds per Pose_Call over the last 2 seconds.
3. THE Stats_Panel SHALL display Key_Landmark_Visibility of the most recent Landmark_Result as a value between 0 and 1 with two decimal places.
4. WHEN the user presses the Reset_Stats_Button, THE Stats_Panel SHALL clear the Pose_FPS and Native_Latency averages and restart both computations from zero.

### Requirement 7: Status message

**User Story:** As a user, I want a simple message about tracking quality, so that I know when to adjust my position or lighting.

#### Acceptance Criteria

1. WHILE Full_Body_Visible holds, THE Pose_Screen SHALL display the Status_Message "Body fully visible".
2. WHILE Full_Body_Visible does not hold, THE Pose_Screen SHALL display the Status_Message "Move back or improve lighting", including when the most recent Landmark_Result has an empty landmark list.

### Requirement 8: Camera toggle

**User Story:** As a user, I want to switch between front and back cameras, so that I can test both setups.

#### Acceptance Criteria

1. WHEN the user presses the Camera_Toggle, THE Pose_Screen SHALL switch the active camera between front and back.
2. WHEN the active camera changes, THE Stats_Panel SHALL clear the Pose_FPS and Native_Latency averages. (Addition beyond the user's request.)

### Requirement 9: Background and foreground lifecycle

**User Story:** As a user, I want the app to release the camera and model in the background and recover on return, so that device resources are freed and the app keeps working.

#### Acceptance Criteria

1. WHEN the PoseSpike_App moves to the background, THE PoseSpike_App SHALL deactivate the camera and THE Pose_Plugin SHALL release the PoseLandmarker instance.
2. WHEN the PoseSpike_App returns to the foreground, THE PoseSpike_App SHALL reactivate the camera and THE Pose_Plugin SHALL reload the PoseLandmarker instance before performing the next Pose_Call.
3. WHEN the PoseSpike_App completes a background-and-resume cycle, THE PoseSpike_App SHALL continue running without crashing and resume displaying Landmark_Results.

### Requirement 10: Code documentation and scope limits

**User Story:** As a developer reviewing the spike, I want every native and bridge method commented and no extra infrastructure, so that the code is easy to evaluate and discard.

#### Acceptance Criteria

1. THE Pose_Module SHALL include a short code comment on every Kotlin method explaining what the method does.
2. THE PoseSpike_App SHALL include a short code comment on every Bridge_Method explaining what the Bridge_Method does.
3. THE PoseSpike_App SHALL operate without a backend, persistent storage, analytics, or runtime network requests.

### Requirement 11: README and delivery

**User Story:** As a developer, I want a README that explains setup, shows the project layout, and captures results, so that anyone can reproduce and record the spike.

#### Acceptance Criteria

1. THE README SHALL document the exact setup steps as runnable commands: install dependencies, run the Model_Download_Script, run `expo prebuild`, and build and install the development build on an Android device.
2. THE README SHALL document how to enable USB debugging on an Android device and verify the device connection with `adb devices`.
3. THE README SHALL list the exact dependency versions used for Expo, React Native, react-native-vision-camera, react-native-worklets-core, react-native-svg, expo-dev-client, MediaPipe Tasks Vision, the Model_File, and the Android minSdkVersion.
4. THE README SHALL contain a results table with exactly the columns "Device model", "Android version", "Front camera FPS", "Rear camera FPS", "Latency ms", and "Notes", in that order, with all data cells left blank.
5. THE README SHALL include the full project file tree of `PoseSpike/`, excluding generated and dependency directories such as `node_modules/` and `android/`.
6. THE README SHALL contain a "Could not verify / may need adjustment" section that states explicitly which items were not verified on a physical device and why.
7. THE "Could not verify / may need adjustment" section SHALL state the uncertainty about the Model_File download URL and local storage location.
8. THE "Could not verify / may need adjustment" section SHALL state the uncertainty about compatibility between the chosen versions of Expo, React Native, react-native-vision-camera, react-native-worklets-core, react-native-svg, and MediaPipe Tasks Vision.
9. THE "Could not verify / may need adjustment" section SHALL state the uncertainty about API changes in react-native-vision-camera Frame Processor Plugins, react-native-worklets-core, MediaPipe Tasks Vision, and Expo config plugins that could require code adjustment.

### Requirement 12: Acceptance check

**User Story:** As a developer, I want a clear pass condition for the spike, so that I can decide whether the approach is viable.

#### Acceptance Criteria

1. WHEN the development build is launched on a physical Android device with camera permission granted, THE Pose_Screen SHALL open the camera and display the live camera preview.
2. WHILE a person stands 2 meters from the active camera, THE Skeleton_Overlay SHALL track the person by drawing the Skeleton_Segments aligned with the person's body.
3. WHILE the camera preview is active, THE Stats_Panel SHALL update the Pose_FPS and Native_Latency values live as Landmark_Events are received.
4. WHEN the person's body leaves the camera frame, THE Pose_Screen SHALL change the Status_Message from "Body fully visible" to "Move back or improve lighting".
5. WHEN the PoseSpike_App is moved to the background and then resumed, THE PoseSpike_App SHALL survive without crashing and display the live camera preview with the Skeleton_Overlay.
6. THE README SHALL describe these five acceptance checks as a step-by-step procedure that the developer follows to record results in the results table.
