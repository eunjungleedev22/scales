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

## Login and saving your scores

There's one built-in account and no sign-up:

- **Username:** `cat`
- **Password:** `kitten-paws-2209`

Every page asks you to sign in once, and the session lasts a year. Sign out is in Settings. The app holds no sensitive data, so the credentials live in `src/lib/auth/session.ts`. You can override them with the `HC_USERNAME`, `HC_PASSWORD` and `HC_SECRET` environment variables, or turn the login off with `HC_AUTH=off`.

**Scores, lessons, achievements, settings and the Lab project are saved automatically in the browser** (localStorage) and survive refreshes and restarts. There's no server, so to move them to another device, go to **Settings → Your scores**:

- **Download backup** saves a `.json` file.
- **Copy backup code** copies a short text code instead.
- On the other device, **Restore from file** or paste the code.

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

### Lesson intros & Korean term hints

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
