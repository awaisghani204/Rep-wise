# Software Requirements Specification (SRS)
## AI Gym Trainer Application

**Version:** 0.1 (Draft for review)
**Status:** Pending client review
**Platform:** Mobile-first (iOS and Android), with a companion web dashboard

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for an AI-assisted gym training application. The app acts as a virtual trainer when a human trainer is unavailable. It identifies the user, guides a workout by weekday split, counts repetitions and sets using the phone camera, gives form feedback, and records each session with charts.

### 1.2 Scope
In scope:
- User registration, login, and a biometric profile captured by a guided body scan
- Weekly workout split (for example, Monday chest and triceps, Tuesday back and biceps)
- Exercise library with instructions per exercise
- Live camera-based exercise tracking: rep counting, set tracking, and form feedback
- Session summaries, history, and progress charts
- A web dashboard for the gym owner and trainers to monitor usage

Out of scope for v1:
- Medical diagnosis or injury prediction
- Nutrition planning and payments (can be added later)
- Multi-person tracking in one camera frame
- Live video calls with a human trainer

### 1.3 Definitions
| Term | Meaning |
|---|---|
| Rep | One complete movement of an exercise (for example, one push-up down and up) |
| Set | A group of consecutive reps, followed by rest |
| Split | The weekly plan that assigns muscle groups to days |
| Pose | The set of body keypoints (shoulders, elbows, hips, knees) detected in a frame |
| Form feedback | Real-time guidance about posture or movement quality |
| Body scan | The guided capture of the user's pose and body measurements during onboarding |

### 1.4 References
- MediaPipe Pose documentation
- Apple Vision framework (body pose)
- Google ML Kit Pose Detection
- WCAG 2.1 AA (accessibility)
- Applicable biometric data and privacy laws in the client's region (for example, GDPR, Illinois BIPA, or equivalent). Legal review is required.

---

## 2. Overall Description

### 2.1 Product Perspective
A standalone mobile app with a cloud backend and an optional web dashboard. All pose processing should run on the device where possible, so raw video does not need to leave the phone.

### 2.2 User Classes
- **Member (primary):** Registers, scans, follows the split, and trains.
- **Gym staff / admin:** Views member progress, manages exercise content, and reviews flagged sessions.
- **Human trainer (optional):** Reviews sessions and can add notes.

### 2.3 Assumptions and Dependencies
- The user has a smartphone with a working front or rear camera.
- The user places the phone on a stand or table so the full body is visible.
- Good lighting is available. Performance drops in low light or with loose clothing.
- The camera pose model runs at a usable frame rate on mid-range phones.

### 2.4 Constraints
- Development window is short. The MVP must be scoped tightly (see Section 12).
- Biometric data is sensitive and is regulated in many regions.
- The app cannot replace a qualified trainer or medical advice.

---

## 3. Functional Requirements

Requirements are labeled FR-xx for traceability.

### 3.1 Account and Identity
- **FR-01:** The system shall let a user register with email and password, or with a social login.
- **FR-02:** The system shall assign each user a unique, non-guessable ID at registration.
- **FR-03:** The system shall require explicit, informed consent before any body scan. The consent screen must state what is captured, why, how long it is kept, and how to delete it.
- **FR-04:** The system shall allow a user to withdraw consent and delete their biometric data.
- **FR-05:** The system shall support login, logout, and password reset.

### 3.2 Body Scan and Profile
- **FR-06:** On first login, the system shall display a pre-scan instruction asking the user to wear fitted clothing (for example, shorts and a fitted top), then guide the user through a body scan: stand in frame, turn slightly, hold still.
- **FR-07:** The system shall extract pose keypoints and relative body proportions (for example, limb-length ratios and shoulder-to-hip width ratio) from the scan. The scan shall not capture facial features, body composition, or muscle or girth measurements. If the user provides height, the system shall use it to calibrate pixel measurements into approximate centimeters. Proportion estimates shall be labeled as approximate and non-medical.
- **FR-08:** The system shall store the scan result as a profile linked to the user ID. Each profile is independent. User identity shall come from the account credentials only. The system shall not use body or facial features to identify users.
- **FR-09:** The system shall let the user enter height and weight manually if the scan fails or is declined. Only the non-biometric fields are stored in this case.
- **FR-10:** The system shall let the user re-scan from settings.

### 3.3 Workout Split and Selection
- **FR-11:** The system shall display a weekly split. The default is configurable by the gym admin.
- **FR-12:** The system shall highlight today's suggested workout based on the device date and user time zone.
- **FR-13:** The system shall let the user choose any day's workout, not only today's.
- **FR-14:** The system shall show the exercise list for the chosen muscle group (for example, Chest: bench press, push-up, incline dumbbell press).
- **FR-15:** The system shall let the user pick one or more exercises and set target sets and reps.

### 3.4 Exercise Library
- **FR-16:** Each exercise shall have a name, target muscles, a short description, a demo animation or image, and common mistakes.
- **FR-17:** Exercise content shall be editable by the gym admin without an app release.

### 3.5 Live Trainer Mode
- **FR-18:** When the user starts a set, the system shall open the camera (front or rear, user choice) and show a live preview with a skeleton overlay.
- **FR-19:** The system shall count reps for each supported exercise using joint-angle thresholds and movement phases (for example, down and up for a squat).
- **FR-20:** The system shall count sets. A set ends when the user pauses for a configurable time or taps "End set."
- **FR-21:** The system shall display the current rep count, set number, and target on screen.
- **FR-22:** The system shall give voice and on-screen cues (for example, "Lower slower", "Keep your back straight").
- **FR-23:** The system shall detect common form issues (for example, knees caving in during squats, elbows flaring too wide during push-ups, rounded back during rows) and show a corrective cue.
- **FR-24:** Form feedback shall use safe, corrective language. It shall not predict injuries or state that a movement will break or fracture anything. Example: "Keep your spine neutral. Reduce the weight and brace your core."
- **FR-25:** If the system detects a posture it cannot assess (person out of frame, poor lighting), it shall show a clear message instead of guessing.
- **FR-26:** The user shall be able to pause, resume, or stop a session at any time.
- **FR-27:** The system shall process video on-device by default. Raw video shall not be uploaded unless the user opts in for review.

### 3.6 Session Recording and Summary
- **FR-28:** At session end, the system shall save: date, split day, exercises, reps per set, target vs. actual, form-issue counts, and duration.
- **FR-29:** The system shall show a session summary screen listing each set and its reps (for example, Set 1: 12 reps, Set 2: 10 reps, Set 3: 8 reps).
- **FR-30:** The system shall show charts of reps per session, total volume (sets × reps × weight, if entered), and form-score trend over time.
- **FR-31:** The user shall be able to view past sessions, filter by date range or exercise, and export their own data as CSV or PDF.

### 3.7 Gym Admin Dashboard (Web)
- **FR-32:** The admin shall see active members, sessions per day, and average session length.
- **FR-33:** The admin shall create and edit splits and exercises.
- **FR-34:** The admin shall view flagged sessions (low form score or repeated safety cues) and add notes.
- **FR-35:** The admin shall not be able to view a member's raw camera data or biometric profile unless the member has given explicit consent for that purpose.

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-01:** Pose detection shall run at 15 fps or higher on a mid-range device (for example, a phone released in the last three years).
- **NFR-02:** Form feedback latency shall be under 300 ms from the movement to the cue.
- **NFR-03:** App cold start shall be under 3 seconds on target devices.
- **NFR-04:** Dashboard pages shall load within 2 seconds on a standard broadband connection.

### 4.2 Accuracy
- **NFR-05:** Rep counting accuracy shall be at least 90% on the supported exercise list under test conditions (good light, full body visible, single person).
- **NFR-06:** The accuracy target shall be measured on a test set of at least 20 recorded sessions per exercise, with ground truth counted by a human.

### 4.3 Security and Privacy
- **NFR-07:** All traffic shall use TLS 1.2 or higher.
- **NFR-08:** Passwords shall be hashed with bcrypt, scrypt, or Argon2.
- **NFR-09:** Body scan data and pose data shall be encrypted at rest (AES-256 or equivalent).
- **NFR-10:** Camera data shall not be stored on the server by default. Any stored media requires explicit consent and a retention limit.
- **NFR-11:** Users shall be able to delete all personal and biometric data. Deletion shall complete within 30 days, and backups shall follow the same retention rule.
- **NFR-12:** Role-based access control shall separate members, staff, and admins.
- **NFR-13:** The system shall keep an audit log of admin access to member data.

### 4.4 Usability and UI/UX
- **NFR-14:** The app shall follow a custom visual identity defined by the client's brand guidelines. It shall not use a generic template or default component kit without design work.
- **NFR-15:** The design shall be validated through at least two rounds of user testing with real gym members before final build.
- **NFR-16:** The primary workout flow (choose day → choose exercise → start set) shall take no more than three taps from the home screen.
- **NFR-17:** The camera screen shall use large, high-contrast text readable at arm's length during a workout.
- **NFR-18:** The app shall support dark mode, since gyms are often dimly lit.

### 4.5 Accessibility
- **NFR-19:** The app shall meet WCAG 2.1 AA for color contrast, text scaling, and screen reader labels.
- **NFR-20:** Voice cues shall have an on-screen text alternative. Haptic feedback shall be an option.

### 4.6 Reliability and Availability
- **NFR-21:** Backend uptime target: 99.5% monthly.
- **NFR-22:** The app shall keep working offline for a full session. Session data syncs when the connection returns.
- **NFR-23:** Crash-free sessions shall be at least 99%.

### 4.7 Maintainability
- **NFR-24:** Exercise rules (angles, thresholds, cues) shall be stored as configuration, not hard-coded, so they can be tuned without a release.
- **NFR-25:** Unit test coverage for business logic shall be at least 70%. Rep-counting logic shall have replay-based tests using recorded pose data.

---

## 5. Recommended Technology Stack

### 5.1 Mobile App
- **Option A (recommended for this timeline): React Native with Expo**, using a native pose module (MediaPipe via a community package, or a custom native module). Shares code between iOS and Android. Large ecosystem.
- **Option B: Flutter**, with Google ML Kit Pose Detection through a plugin. Strong performance and UI control.
- **Option C: Native (Swift for iOS, Kotlin for Android)**, using Apple Vision and ML Kit directly. Best performance and control, but roughly double the work.

### 5.2 Pose Estimation (on-device)
- **MediaPipe Pose (BlazePose):** Good accuracy, runs on mobile, 33 landmarks, free.
- **Apple Vision (VNDetectHumanBodyPoseRequest):** Native iOS option.
- **ML Kit Pose Detection:** Native Android and cross-platform option.

Start with one library. Do not build your own pose model for the MVP.

### 5.3 Backend
- **Node.js with NestJS** or **Python with FastAPI**. Choose based on your team's strongest language.
- **PostgreSQL** for users, splits, sessions, and reps. Use JSONB for flexible exercise rules.
- **Redis** (optional) for caching and rate limiting.
- **Object storage (S3-compatible)** only for opt-in media.

### 5.4 Authentication
- **Firebase Auth**, **Auth0**, or **AWS Cognito**. Avoid building auth from scratch.

### 5.5 Web Dashboard
- **Next.js** with React and TypeScript
- **Recharts** or **Chart.js** for charts
- **Tailwind CSS** or a custom design system aligned with the brand

### 5.6 Charts in the Mobile App
- React Native: **Victory Native** or **react-native-svg-charts**
- Flutter: **fl_chart**

### 5.7 Infrastructure
- **Docker** for local development
- **AWS, GCP, or Render** for hosting
- **GitHub Actions** for CI/CD
- **Sentry** for error tracking
- **Firebase Crashlytics** for mobile crash reporting

### 5.8 Testing
- Unit tests: Jest (JS) or pytest (Python)
- Mobile: Detox (React Native) or Flutter integration tests
- Rep-counting: replay tests using recorded pose-landmark files
- Load tests: k6

---

## 6. Data Model (Summary)

| Entity | Key Fields |
|---|---|
| User | id (UUID), email, password_hash, role, created_at, consent_version, consent_at |
| BodyProfile | id, user_id, height_cm, weight_kg (optional), proportions (JSON), scan_date, encrypted_blob |
| Split | id, gym_id, day_of_week, muscle_group, is_default |
| Exercise | id, name, muscle_groups, description, media_url, rules (JSON: angle thresholds, phases, cues) |
| Session | id, user_id, split_day, started_at, ended_at, status |
| SessionSet | id, session_id, exercise_id, set_number, target_reps, actual_reps, rest_seconds |
| FormEvent | id, session_set_id, timestamp, issue_type, severity, cue_given |
| AuditLog | id, actor_id, action, target_user_id, timestamp |

---

## 7. External Interfaces

- **Camera:** Access through the platform camera API with explicit permission prompts.
- **Pose library:** Local API only. No network call during processing.
- **Auth provider:** OAuth 2.0 / OpenID Connect.
- **Payments (future):** Stripe, out of scope for v1.
- **REST API:** JSON over HTTPS, versioned under /api/v1.

---

## 8. Key Technical Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Rep counting is unreliable for some exercises | High | Start with 3 to 5 exercises. Test with real video. Tune thresholds as config. |
| Pose detection is slow on older phones | High | Lower input resolution. Test on a low-end device early. |
| Body scan results are inconsistent | Medium | Use proportions, not absolute measurements. Offer a manual fallback. |
| Biometric privacy violations | Critical | Legal review. Explicit consent. On-device processing. Deletion flow. |
| Feedback seems medical or dangerous | High | Use corrective language only. Add a disclaimer. Route serious concerns to a human trainer. |
| Timeline is too short for full scope | High | Ship the MVP (Section 12). Defer dashboard features and extra exercises. |
| Poor lighting or clothing hurts accuracy | Medium | Show a pre-workout check ("Full body visible? Good light?"). |

---

## 9. Acceptance Criteria (MVP)

The MVP is accepted when all of the following are true:
1. A new user can register, give consent, complete a body scan, and reach the home screen.
2. The user can select a day, pick an exercise, and start a set in three taps or fewer.
3. Rep counting for at least three exercises meets NFR-05 on the test set.
4. Form feedback appears for at least one issue per exercise, using corrective language.
5. The session summary lists each set with its reps.
6. A past session appears in history with a chart.
7. The user can delete their account and biometric data.
8. The app passes a basic accessibility check and runs on one iOS and one Android device.

---

## 10. Suggested Exercises for MVP
- Push-up (chest, triceps)
- Squat (legs)
- Bicep curl (biceps)

Add bench press, pull-up, and row after the MVP is stable. Some exercises need a side-view camera angle, so note the required camera position for each.

---

## 11. Open Questions for the Client
1. What is the target user base: members only, or also walk-ins?
2. Which regions will the app launch in? (This determines privacy law requirements.)
3. Does the client want the body scan to produce measurements, or only a pose baseline?
4. What are the exact split and exercise lists?
5. Will human trainers review flagged sessions, and how quickly?
6. Are there brand guidelines, colors, and fonts already defined?
7. What devices are most common among members?
8. What is the launch date, and is there a hard deadline for the MVP?
9. Who owns the data, and what retention period is required?
10. Is there a budget for third-party services (cloud, pose APIs, auth)?

---

## 12. Suggested Delivery Plan

Given a short timeline, deliver in phases:

**Phase 1 (Days 1–2): Foundation**
- Finalize requirements with the client
- Set up repo, backend skeleton, auth, and database
- Pick the mobile framework and pose library
- Build the consent and body-scan flow

**Phase 2 (Days 3–5): Core Training Loop**
- Split and exercise screens
- Camera screen with pose overlay
- Rep counting for push-up, squat, and bicep curl
- Session recording and summary

**Phase 3 (Days 6–7): Feedback and History**
- Form feedback cues
- History list and charts
- Accessibility pass and dark mode

**Phase 4 (Days 8+): Testing and Polish**
- Test with real users and recorded sessions
- Tune thresholds
- Bug fixes and performance tuning
- Admin dashboard (basic version)

If the timeline is shorter than this, cut the admin dashboard and extra exercises first.

---

## 13. Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| Client | | | |
| Project Lead | | | |
| Technical Lead | | | |
