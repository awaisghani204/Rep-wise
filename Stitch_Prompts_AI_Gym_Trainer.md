# Stitch Prompt Pack: AI Gym Trainer App

Use these prompts in order. Paste Part 1 first to set the design direction, then paste each screen prompt separately. Stitch works best with one screen per prompt. If a screen comes out inconsistent, paste Part 1 again before regenerating.

---

## Part 1: Master Design Direction (paste first)

```
Design a mobile app called "Trainer" for iOS and Android, portrait orientation, 390 x 844 frames. It is an AI gym coach that uses the phone camera to count reps and give form cues during workouts.

Visual direction: industrial athletic. Think of a well-lit training facility with raw concrete, chalk, and steel. Not a generic SaaS look. No purple or blue gradients, no glassmorphism, no floating blurred orbs, no rounded pastel cards with soft shadows.

Color system:
- Primary background: near-black charcoal #0E0F11 (dark mode is the default because gyms are dim)
- Surface: #17191C for cards, #22252A for raised elements
- Text primary: chalk white #F2F0EB
- Text secondary: #8A8F98
- Accent: signal orange #FF5A1F for primary actions, active states, and live counters
- Success: #3DDC84 for good form
- Warning: #FFB020 for form cues
- Danger: #FF3B3B for stop and delete actions only

Typography:
- Display and numbers: a condensed grotesk such as Barlow Condensed or Oswald, uppercase for headings
- Body: Inter (use Inter for all body text, labels, and buttons)
- Rep counters and stats: a tabular monospace or tabular numerals such as JetBrains Mono or Space Mono

Shape and spacing: sharp to slightly rounded corners (4 to 8 px radius), 16 px screen margins, 8 px spacing grid. Use thin 1 px dividers instead of heavy shadows. Use hard edges and strong typographic hierarchy for a bold, editorial feel.

Iconography: simple line icons with 2 px stroke, no emojis.

Motion cues (describe in annotations): snappy 150 ms transitions, a pulsing accent ring around the live rep counter.

Accessibility: text contrast at least 4.5:1, touch targets at least 48 px, large readable type on the workout screen.

Keep this design system identical across all screens.
```

---

## Part 2: Onboarding and Account

### Screen 1: Welcome / Splash
```
Mobile welcome screen for the "Trainer" app on a dark charcoal background. Large condensed uppercase headline "TRAIN WITH A COACH WHO IS ALWAYS ON." Smaller supporting text: "Form checks, rep counting, and a weekly plan. Works without a gym trainer." Full-width orange primary button "GET STARTED" and a text button "I already have an account" below. Background: an abstract, high-contrast black-and-white photo treatment of a barbell plate, or a flat graphic of a barbell silhouette in charcoal, no gradients.
```

### Screen 2: Sign Up
```
Mobile sign-up screen in the dark industrial style. Header "CREATE ACCOUNT" with a back arrow. Fields: Full name, Email, Password (with show/hide toggle and a strength bar). Full-width orange button "CONTINUE". Divider with "or". Two outlined buttons: "Continue with Apple" and "Continue with Google". Small footer text linking to Terms and Privacy. Show one field in an error state with a red helper message "Password must be at least 8 characters."
```

### Screen 3: Biometric Consent
```
Mobile consent screen with a dark charcoal background. Header "BEFORE WE SCAN YOU" with a step indicator "Step 1 of 3". A short plain-language list (not a dense paragraph) with icons:
- What we capture: body pose and proportions from a short camera scan
- Why: to tune exercise tracking to your body
- Where it is processed: on your phone by default
- How long we keep it: until you delete it
- How to delete: Settings > Privacy > Delete my data
Two checkboxes: "I agree to the body scan and processing of my biometric data" (required) and "Allow me to opt in to sharing sessions with my trainer" (optional, unchecked). Primary button "AGREE AND CONTINUE" disabled until required checkbox is checked. Secondary text button "Not now, enter my height instead."
```

---

## Part 3: Body Scan

### Screen 4: Body Scan Camera Guide
```
Mobile camera screen for a body scan. Full-bleed camera viewfinder showing a faint, dark silhouette outline of a standing person in the center. The outline is drawn as a thin chalk-white line. Top bar: close X and "STEP 2 OF 3". Bottom panel with three instructions in large text: "Stand 2 m from the phone," "Full body in frame," "Hold still for 5 seconds." Status chip at the top, reading "Searching for body..." in amber. Orange circular capture button at the bottom, disabled state visible.
```

### Screen 5: Body Scan In Progress
```
Mobile camera screen during a body scan. Live camera view with a skeleton overlay: thin orange lines connecting body keypoints (shoulders, elbows, wrists, hips, knees, ankles), with small dots at each joint. Top status chip reads "Hold still" in orange. A circular progress ring around the bottom edge shows 60% complete. Text beneath: "Scanning... 3 seconds left." Dark and minimal, no other chrome.
```

### Screen 6: Scan Result
```
Mobile screen showing the completed body scan. Header "YOUR PROFILE IS READY" in condensed uppercase. A small card showing a skeleton figure in chalk white with orange joint dots. Below it, a list of proportion values in monospace: Shoulder width, Arm length, Leg length, Torso ratio, each with a small horizontal bar. Note in small gray text: "Estimates based on proportions, not medical measurements." Primary orange button "START TRAINING" and secondary button "Re-scan".
```

---

## Part 4: Home and Workout Planning

### Screen 7: Home (Today)
```
Mobile home screen. Top: small greeting "MORNING, ALEX" and a profile avatar. Hero card with a dark surface and an orange left border: label "TODAY: MONDAY", title "CHEST & TRICEPS", sub-line "5 exercises · about 45 min", orange button "START WORKOUT". Below, a horizontal week strip showing Mon through Sun as chips, Monday selected in orange, others outlined in gray. Section header "EXERCISES" with a list of three rows, each showing exercise name, sets x reps target, and a small chevron. Bottom tab bar with four items: Home, Plan, Live, History, Profile, using line icons with the active tab in orange.
```

### Screen 8: Weekly Split
```
Mobile screen titled "PLAN" showing a seven-day split. Each day is a horizontal row with a day label in condensed uppercase on the left (MON, TUE, WED, THU, FRI, SAT, SUN), the muscle group in chalk white (for example "CHEST + TRICEPS", "BACK + BICEPS", "LEGS", "REST"), and a thin colored bar on the far left. Rest days are dimmed. Today's row is highlighted with an orange outline. Tapping a row is implied by a chevron on the right. Include a segmented control at the top: "Default split" and "My split".
```

### Screen 9: Exercise Selection
```
Mobile screen titled "CHEST" with a back arrow and a subtitle "Monday · 4 selected". A vertical list of exercise cards. Each card shows a small line illustration of the movement, the exercise name ("Push-up", "Incline Dumbbell Press", "Bench Press", "Cable Fly"), the target muscle tags, and a checkbox. Two cards are selected with an orange check. Each card has a small "i" icon for instructions. Bottom sticky bar with a summary "2 exercises · 3 sets each" and an orange button "CONFIGURE".
```

### Screen 10: Set Target Setup
```
Mobile screen titled "SET TARGETS" for "Push-up". Two large steppers: "SETS" showing 3 and "REPS PER SET" showing 12, each with minus and plus buttons in outlined squares. Below, a toggle "Enable live form check" that is on. A small preview card: "Camera: Front or rear, phone on stand". Orange button "START SET" at the bottom.
```

---

## Part 5: Live Trainer Mode (most important screens)

### Screen 11: Live Camera Trainer
```
Mobile live workout screen. Full-screen camera view showing a person doing a push-up from the side, with a skeleton overlay in signal orange over the body. Top bar: pause icon on the left, exercise name "PUSH-UP" in center, and a small "SET 2 OF 3" chip on the right. Large center-top counter: "08" in huge monospace orange numerals, with the label "REPS" beneath and "TARGET 12" in gray. A thin progress bar under the counter. Bottom form-feedback banner in warning amber: "Keep your core tight, hips level with shoulders." Small status chip "Camera: Good light, full body visible" in green. Bottom controls: a large "END SET" button in outlined style and a small camera-switch icon. Avoid any clutter.
```

### Screen 12: Camera Position Check
```
Mobile screen shown before a set starts, titled "CHECK YOUR SETUP". Live camera preview with a faint overlay of a person outline. Three check rows with green or amber icons: "Full body visible" (green), "Enough light" (green), "Phone is steady" (amber, "Lower the phone a little"). Small illustration showing the correct side-view placement for push-ups with a dimension arrow. Orange button "I'M READY" and a text button "Switch to rear camera".
```

### Screen 13: Set Rest Timer
```
Mobile screen shown between sets. Large centered text "SET 1 COMPLETE" in condensed uppercase, with "12 REPS" in big orange monospace numerals. A circular rest timer ring counting down "00:58" in chalk white, with the next set info below: "Set 2 of 3 · Target 12 reps". Two buttons at the bottom: "SKIP REST" outlined and "START SET 2" in solid orange. Small line of feedback text in amber: "Form tip: slow the lowering phase."
```

### Screen 14: Form Cue Alert
```
Mobile live workout screen with a warning moment. The camera view remains visible, with the skeleton overlay turning amber at the affected joints (hips). A bottom card slides up, titled "FORM CUE" in amber, with the message "Hips sagging. Brace your core and squeeze your glutes." A small secondary line: "Reduce reps if needed. Listen to your body." Two buttons: "GOT IT" and "PAUSE". Keep the rep counter visible above the card.
```

---

## Part 6: Summary, History, and Charts

### Screen 15: Session Summary
```
Mobile session summary screen titled "WORKOUT COMPLETE" with the date and the split label "MONDAY · CHEST & TRICEPS". Top stat row with three big monospace stats: "42 MIN", "28 REPS", "2 FORM CUES". A list titled "SETS" showing each set as a row: "Push-up · Set 1 · 12 reps", "Push-up · Set 2 · 10 reps", "Push-up · Set 3 · 8 reps", each with a thin horizontal bar scaled to target. A small rep-trend bar chart below using orange bars. Two buttons: "SAVE SESSION" in solid orange and "SHARE WITH TRAINER" outlined.
```

### Screen 16: History and Progress Charts
```
Mobile screen titled "HISTORY" with a segmented control for "Sessions", "Progress", and "Form". The Progress tab shows a line chart of total reps per session over the last 8 weeks, with an orange line and thin gray gridlines, and axis labels in small monospace. Below, a card for "Form score trend" with a small area chart in chalk white. A filter row with chips "Last 30 days", "Push-up", "Squat". A list of past sessions below with date, split, and total reps.
```

### Screen 17: Session Detail
```
Mobile screen showing one past session, titled "12 MAR · CHEST & TRICEPS". Header stats row. A table-like list of sets with columns Set, Target, Actual, Form issues, using monospace numerals. Highlight the best set in orange. A small note card reading "2 flagged form cues on Set 3." Export buttons at the bottom: "EXPORT CSV" and "EXPORT PDF".
```

---

## Part 7: Profile, Privacy, and Settings

### Screen 18: Profile and Settings
```
Mobile profile screen. Top: avatar, name "Alex Morgan", email in gray. A "BODY PROFILE" card with a small skeleton thumbnail and "Last scan: 2 Nov" and a "Re-scan" link. Settings list with icons and chevrons: Units (kg / lb), Voice cues (on), Haptic feedback (on), Dark mode (on), Camera default (rear), Privacy and data, Help, Log out. Keep the list clean with 1 px dividers.
```

### Screen 19: Privacy and Data Deletion
```
Mobile screen titled "PRIVACY AND DATA". Short sections with clear headers: "Your body profile", "Camera data", "Session history". Under "Camera data", a toggle "Store video for trainer review (off)" with a helper line "Video stays on your phone unless you turn this on." A red outlined card at the bottom: "DELETE MY DATA" with a short description "Removes your body profile, sessions, and any stored media. This cannot be undone." Tapping it opens a confirmation sheet with a "Type DELETE to confirm" input field and a red "DELETE EVERYTHING" button.
```

---

## Part 8: Web Admin Dashboard (optional, after mobile)

### Screen 20: Admin Dashboard Overview
```
Desktop web dashboard, 1440 x 900 frames, same design system as the mobile app but adapted for a wide layout. Left sidebar with navigation: Overview, Members, Splits, Exercises, Flagged sessions, Audit log. Top row of four KPI cards: "Active members 214", "Sessions today 38", "Avg session length 41 min", "Flagged sessions 6". Below, a line chart of sessions per day over 30 days in signal orange, and a table of recent flagged sessions with member ID (not name), exercise, form issue, and a "Review" button. Keep it data-dense but readable.
```

### Screen 21: Admin Split Editor
```
Desktop web screen titled "SPLITS" with a weekly grid. Columns are Monday through Sunday. Each column has a muscle group dropdown at the top and a list of exercise chips beneath it that can be dragged. A side panel for "Exercise details" shows the selected exercise's rules summary and a note field. Primary button "PUBLISH SPLIT" in orange. Same industrial design language.
```

---

## Part 9: Reusable Components

Use these as a follow-up prompt to generate a component sheet.

```
Create a component library sheet for the "Trainer" app using the same design system. Include:
- Buttons: primary (orange), secondary (outlined), text, destructive (red), disabled states
- Rep counter component in three sizes
- Form cue banner in amber, success chip in green, error chip in red
- Stepper control for sets and reps
- Segmented control with two and three options
- Exercise card in default, selected, and locked states
- Bottom tab bar with five items, active state in orange
- Chart cards: line, bar, and area
- Toggle, checkbox, and input fields with focus and error states
Label each component and keep the layout clean on a light-grid background for reference.
```

---

## Tips for Using Stitch Well

1. Paste Part 1 first and check that the color and type are right before generating screens.
2. Generate one screen at a time. Batch prompts often lose consistency.
3. If a screen drifts from the style, add "Match the design system exactly as defined in the master direction" to the prompt.
4. Focus review on the Live Camera Trainer (Screen 11) and Form Cue Alert (Screen 14). Those screens carry most of the UX risk.
5. Check contrast on the orange and amber text against dark backgrounds before accepting a design.
6. Stitch output is a starting point. Plan to rebuild the final UI in your chosen framework, and use these designs as a reference.
