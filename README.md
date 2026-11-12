# 🐈‍⬛ Harmonic Cat

**Interactive, gamified music theory for electronic music producers.**
Learn → Hear → Experiment → Apply → Compose, in short exercises that give feedback right away. Every concept points back to something you can make in Ableton Live.

- "Studio hardware" design: warm charcoal panels, cream silkscreen text, a signal-orange accent with amber LED highlights, expanded grotesk headings (Archivo) with mono labels (IBM Plex Mono), tight corners, sequencer-pad skill tree and segmented LED meters. The mascot is an original black cat ("Midi") wearing headphones.
- English UI by default, with a Korean toggle (Settings → Language)
- Runs fully offline after `npm install`: no backend, no accounts, no paid APIs. Progress is saved in `localStorage`.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm test           # unit tests (Vitest): theory engine, exercise evaluation, MIDI writer, curriculum integrity
npm run typecheck  # tsc --noEmit
npm run build      # production build
npm start          # serve the production build
```

Requires Node 20+ (developed with Node 22). Audio needs one click, tap or keypress before it can start (browser autoplay rules). The header shows a **"Tap for sound"** pill until audio is running. On iPhone, the audio engine is preloaded and started inside the tap itself, and it switches iOS into "playback" mode, so sound works even when the ring/silent switch is set to silent.

## Accounts, login and security

There's no sign-up page. Accounts are listed in `src/lib/auth/users.ts` (current users: `cat`, `bruno`). To add someone:

```bash
node scripts/add-user.mjs <username>
```

The script prints a strong random password **once** and a record to paste into `users.ts`. It never stores the password itself.

Security basics:

- **No stored passwords.** Each account has a random salt and a verifier: the SHA-256 of a PBKDF2-SHA256 key, 600,000 iterations. The session cookie is httpOnly, Secure and SameSite=Lax, lasts 90 days, and holds a key that can only be derived from the password. Changing a user's record invalidates their sessions.
- **Brute-force protection.** After 5 failed attempts, the account and the IP are both locked for 15 minutes. Every failure is also delayed by a random 0.4–0.8 s. Unknown usernames take the same time as real ones, so usernames can't be guessed from timing.
- **Security headers.** The app sends X-Frame-Options and a CSP `frame-ancestors 'none'` (clickjacking), plus `nosniff`, a strict Referrer-Policy, HSTS and a restrictive Permissions-Policy. `X-Powered-By` is removed.
- **Separate data per account.** Progress, settings and the Lab project are saved per user, even on a shared device.
- `HC_AUTH=off` disables the login, for local development.

**Scores, lessons, achievements, settings and the Lab project are saved automatically in the browser** (localStorage) and survive refreshes. There's no server, so to move them to another device, use **Settings → Your scores** (download or copy a backup, then restore it on the other device).

Limits: the lockout counter lives in each server instance's memory, and there's no self-service password change.

## What's inside

| Page | What you can do |
| --- | --- |
| **Home** | Continue learning, current world, skill mastery, Quick Practice, Deep Dive, Composition Lab |
| **Learn** | Skill tree of 7 worlds and 53 lessons, with boss challenges. Every lesson is open, so you can skip ahead freely. |
| **Practice** | Quick Practice (5 drills), **Deep Dive Mode** (endless, adaptive, timer, optional break nudges, pause), Review challenge, **Placement test**, endless drills by type |
| **Ear Training** | Intervals (melodic or harmonic), chord qualities, scales and modes. Unlimited replays and hints. |
| **Playground** | Scale Explorer, Chord Explorer (with a "What chord is this?" detector), Progression Builder (Roman numerals, functions, voicings, stabs), 16-step sequencer, free 3-octave piano |
| **Composition Lab** | Tempo, key and scale, chord progression editor, bassline and melody sequencers (4, 8 or 16 bars, with an "expand with variation" option), drums or metronome, mute, **MIDI export**, and **Generate exercises from your project** |
| **Progress** | Level and XP, mastery stars per lesson, cat-themed achievements |
| **Settings** | Language (EN/KO), note names, solfège labels, sharps or flats, focus mode, reduced motion, break reminder, volume, reset |

### Reflect (on demand)

**Reflect** (sidebar, dashboard tile D, or the optional button on a finished lesson) generates a reflective session from what you actually practised. It's never forced. Scopes: this lesson, since your last reflection, today, last 7 days, or everything. Each session has:

- summary notes, from the lessons you touched
- key terms (with their Korean words)
- *Going well* and *Worth another look*
- 2–3 "in your own words" questions
- a quick re-check of the exercises you missed
- a studio task

Save it to your journal, or download it as Markdown notes. Sessions are built from a local activity log and lesson content, without any AI service. The code is in `src/lib/reflection/generate.ts`, which is tested.

### Notebook: highlights, notes and questions

Every lesson has a small **Notebook** under its intro video. It's also available mid-lesson through the **Intro** button.

- **★ Save this part** stars whatever the video is explaining right now. You can also star any concept bullet.
- **✎ Note** saves a quick note. Type it, or dictate it in English or Korean using the device's speech recognition.
- **Ask** turns a spoken or typed question into a self-contained prompt that includes the lesson and the current scene. It opens that prompt in **ChatGPT, Claude, Perplexity or Google** in a new tab and saves the question. Paste the answer back to keep the Q&A. There's no built-in AI, so no API key or cost is involved.
- Notes appear in the lesson's **My notes** list. They're also in every **Reflect** session for that window or lesson, under *Your notes & questions*, in the downloadable Markdown notes, and in *All my notes* on the Reflect page. They're included in progress backups.
- The microphone is only allowed on this site's own pages (`Permissions-Policy: microphone=(self)`).

### Lesson intros & Korean term hints

- **Voiceover (natural voice).** Every intro scene and concept note is narrated with a pre-recorded neural voice: Kokoro-82M, voice `af_heart`, Apache-2.0. The clips are shipped as MP3s in `public/voice` (about 9 MB) and play through the same Web Audio context as the music. The next clip is preloaded, so there's no gap between scenes. Spoken text is cleaned for speech ("C#" becomes "C sharp", "W W H" becomes "whole, whole, half", and Roman numerals become words). The renderer also makes sure the note "A" is said "ay", not "uh". If a recording is missing, the app falls back to the device's built-in voice, which you can also choose in **Settings → Voiceover**. To re-record after editing scripts:

  ```bash
  npx tsx scripts/export-narration.ts > narration.json
  python3 scripts/render-voice.py narration.json model.onnx voices.npz public/voice
  ```

  The model comes from `onnx-community/Kokoro-82M-v1.0-ONNX` on Hugging Face. A test fails if any narrated sentence has no recording.
- **Scripts.** Every lesson has a hand-written intro. Each scene shows one big key idea, with a spoken explanation, piano visuals and sound, and the intro ends with a **Remember** recap.
- **Intro "video" for every lesson.** Before the exercises, each lesson has a short animated intro with captions, highlighted piano keys, step and interval labels (W/H, R/3/5…) and sound. You can play or pause it, skip between scenes, and reopen it mid-lesson with the **Intro** button. Scripts live in `src/content/intros.ts`. 26 lessons have hand-written scripts, and the rest are generated from the lesson's concept and demo. All of it is original content, so there are no licensing issues.
- **More on YouTube.** Each lesson links to a YouTube *search* for its topic. No third-party videos are embedded or rehosted.
- **Korean term hints.** Explanations are always in English. Music terms are annotated inline with their Korean word, for example *semitone* `반음` and *whole tone* `온음`. Hover or tap a term to see a short Korean definition. Each lesson intro also lists its key terms (핵심 용어). The glossary has about 100 entries and lives in `src/content/glossary.ts`. You can turn the hints off in Settings.

### Exercise types (all data-driven and evaluated by the theory engine)

| Type | Kind | Notes |
| --- | --- | --- |
| A. Identify the note | `identify-note` | Any octave; enharmonic-safe (Gb accepts the F# key) |
| Build an interval | `build-interval` | |
| B. Build a scale | `build-scale` | Validates pitch-class sets, then plays the scale ascending |
| C. Build a chord | `build-chord` | Any voicing; an optional `inversion` requires a specific bass note. Shows the intervals from the root. |
| D. Ear training | `ear-interval`, `ear-chord` | Randomised into a multiple-choice question at runtime |
| E. Complete the progression | `complete-progression` | Three outcomes: **correct**, **creative** (valid but different, e.g. a plagal IV instead of V) and **incorrect** |
| F. Fix the melody | `fix-melody` | Only the stated goal is checked (for example "end on a chord tone"). Other tensions are explained as passing or neighbour tones, not marked wrong. |
| G. Bassline builder | `bassline` | 16-step sequencer with a drum loop and chord stabs. Feedback covers chord-tone anchors, off-beats and chromatic notes. |
| H. Call and response | `call-response` | Always gets a "creative" result with feedback on theory (ending note, contour, rhythmic links), never a single right answer |
| Multiple choice | `choice` | Optional audio and keyboard display |

### Keyboard shortcuts (desktop)

| Key | Action |
| --- | --- |
| `A W S E D F T G Y H U J K O L P ; '` | Play piano keys (same layout as Ableton's computer MIDI keyboard) |
| `Z` / `X` | Octave down / up |
| `Enter` | Check the answer, or continue |
| `Backspace` | Clear the selection |
| `Space` | Play or replay |
| `1`–`9` | Choose an answer |
| `/` | Hint |
| `Esc` | Leave the lesson |
| `Shift+F` | Toggle Focus Mode |

### Learning and gamification design (ADHD-friendly)

- No streaks, energy, hearts or timers that force you to wait. A **Long Nap** achievement *rewards* coming back after a break.
- XP rewards understanding: a first-try answer earns 10 XP, an answer after a hint 6 XP and a later attempt 4 XP. Repeating an exercise you already mastered earns very little.
- Lessons count as complete at 60% solved, and skipping is never punished. You can test out with the placement test or with "I know this — skip".
- Deep Dive Mode is built for 2–4 hour hyperfocus sessions: an adaptive mix that favours weak spots, a session timer, optional break nudges (25, 50 or 90 minutes, or off) and a pause that stops the timer.

## Exporting MIDI to Ableton Live

- **Composition Lab → Export MIDI** writes a Standard MIDI File (type 1, 480 PPQ). Track 0 carries the tempo and 4/4 time signature, followed by **Chords**, **Bass**, **Melody** and **Drums**.
- Drums are on channel 10 using General MIDI notes: kick 36 (C1), clap 39, hat 42. These map onto Ableton's Drum Rack defaults.
- Muted parts are left out of the export, so the file contains exactly what you hear.
- Drag the `.mid` file into Ableton's Arrangement view, and each part lands on its own MIDI track.
- You can also export from the Progression Builder, the Step Sequencer and the Chord Explorer.

The writer (`src/lib/midi/writer.ts`) has no dependencies. Tests check variable-length quantity encoding, tempo, pitches, onsets and durations, and event ordering (at the same tick, note-off comes before note-on, so repeated notes stay separate).

## Architecture

```
src/
  lib/theory/        Pure, tested music theory engine (built on Tonal.js)
    notes.ts         pitch classes, enharmonics, MIDI conversion, note colours, solfège
    intervals.ts     interval table, spelled transposition
    scales.ts        major/minor/pentatonic/modes/harmonic minor, degrees, relative keys
    chords.ts        chord formulas, spelling, inversions, detection, chord-tone roles, voice leading
    harmony.ts       diatonic triads/sevenths, Roman numerals, functions, borrowed-chord analysis
  lib/exercises/     Exercise types, evaluation (all correctness logic), ear-training instantiation,
                     random drill generators, exercises generated from a Lab project
  lib/music/         Shared note-event model used by BOTH audio playback and MIDI export,
                     progression resolution, Lab project → events
  lib/midi/          SMF writer + minimal reader (for tests)
  lib/audio/         Tone.js engine (lazy-loaded, started after a gesture, one timeline at a time)
  lib/progress/      XP / level / mastery rules (pure) + selectors
  content/           Curriculum (7 worlds, 53 lessons, 193 exercises) and achievements
  store/             Zustand stores persisted to localStorage (progress, settings, lab project)
  components/        piano/, exercises/ (ExercisePlayer, LessonRunner, PracticeSession),
                     tools/ (explorers, sequencer, progression builder), ui/ (shadcn/ui-style), mascot/
  app/               Next.js App Router pages
```

Key decisions:

- **Correctness is never hard-coded in UI components.** Exercises are plain data (`ExerciseDef`), and `evaluate()` in `lib/exercises/evaluate.ts` decides the result using the theory engine.
- **Enharmonics:** answers that depend on pitch compare pitch classes, so C# and Db count as the same key. Feedback and explanations still use correct theoretical spelling (Tonal.js), for example `Eb F G Ab Bb C D` or `B D F Ab` for Bdim7.
- **Audio safety:** Tone.js is imported dynamically on the client. `AudioEngine.playEvents()` always stops the previous timeline first. Audio also stops when you change route, when an exercise unmounts and when the tab is hidden.
- **Hydration:** persisted stores use `skipHydration` and are rehydrated in `Providers`. A loading screen shows until then, which avoids SSR mismatches.
- **shadcn/ui:** components live in `src/components/ui` in shadcn's "new-york" style, on Radix primitives with Tailwind v4 tokens (`components.json` included).

## Tests

```bash
npm test
```

46 tests cover:

- pitch classes and enharmonics
- MIDI conversion
- intervals
- scale spelling, including flat keys and modes
- chord spelling, inversions, detection and roles
- voice leading
- diatonic harmony and Roman numerals
- exercise evaluation (correct, creative and incorrect)
- ear-training instantiation
- drill generators
- exercises generated from a Lab project
- curriculum integrity (unique ids, answerable questions, fix-the-melody exercises start unresolved)
- MIDI encoding and round-trips, including a full Lab project export

The main flows were also checked end to end in headless Chromium:

- lessons
- wrong-then-right feedback
- XP persisting after a reload
- scale, chord, progression, melody and bassline exercises
- ear training
- the Playground
- Lab MIDI export, parsed back
- Korean UI
- mobile touch

## Known limitations / not yet done

- **Lesson explanations are always in English, by design.** Korean appears as inline term hints. The Language setting only translates the app's navigation and buttons.
- **No embedded YouTube videos.** The intros are built in, and the YouTube links open a search.
- **Sound** is synthesised with Tone.js, not samples. **Settings → Instrument sound** has four presets: **Electric piano** (default, a classic '80s FM e-piano with chorus), **Analog poly** (a warm, chorused vintage polysynth), **Soft piano**, and **Acid** (the original bright saws with a resonant bass). Each one has a preview button. The presets are level-matched, and the master chain (compressor, hard-knee limiter, soft clip) keeps them loud enough for phone speakers without distorting.
- **The sequencers are monophonic**, with one note per step per part. Note lengths are 1/16, 1/8, 1/4 and 1/2. There is no velocity, slide or accent editing yet. MIDI export uses fixed velocities.
- **No MIDI input** from hardware controllers (Web MIDI) yet.
- **Worlds 4–7** have introductory lessons with representative exercises (as specified), not full depth.
- **The Lab's "Expand ×2 with variation"** uses a simple A A′ rule: it changes the last chord of each new 4-bar group. It isn't an arranger.
- **Progress is per browser** (localStorage) and doesn't sync between devices.
- **No error tracking or analytics.**

All musical examples in this app are original.
