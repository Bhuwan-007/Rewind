# PRD: Rewind — Learn any skill by fixing its worst day

> Working name: **Rewind**. Tagline: *"Don't read about the disaster. Fix it."*
> Build window: **2 hours** (with Antigravity doing the heavy coding). Demo: **60 seconds**.

---

## 1. One-liner

A learner types a skill. Rewind turns it into a **case file of 5 escalating emergencies** (a breach, a conversion crash, a bad deploy...). In each one the learner makes **one decision under pressure**, watches the consequences play out, and can **rewind time** to try again. Every incident teaches exactly one concept.

## 2. How it answers the problem statement

| PS requirement | Rewind's answer |
|---|---|
| Learner picks a goal, gets an AI roadmap | One text box → AI generates a **Case File**: 5 incidents, easy → hard, shown as a timeline strip |
| Meets the learner where they are | Incident 1 doubles as a **calibration**. Clean solve → next incident is harder. Struggle → next one stays gentle and adds a hint |
| Clear steps, next actions, visible progress | Timeline strip always visible at top: ✓ done · ● current · ○ locked. One big action per screen |
| 60-second demo, "where do I start?" → confident first step | Type skill → alert on screen in ~5s → one decision → consequence → "you just learned X" |
| **Gamification (judged)** | Stability meter, rewind tokens, forgiving streak, Perfect Timeline badge, shareable Incident Report |
| **Simplicity (judged)** | One screen = one emergency = one question = four buttons. No menus, no sidebar, no settings |

## 3. Why it's different

Every other team will build a roadmap + XP bar or an RPG quest list. Rewind's roadmap is **a story, not a syllabus**. The hook (a ticking emergency) lands in the first 5 seconds of the demo, and **rewinding time after a bad choice** is a mechanic nobody else will have. Failure becomes the fun part, not the penalty.

## 4. Target user

Beginner-to-intermediate self-learners picking up a practical skill (cybersecurity, UI/UX, product, SQL, DevOps, marketing analytics, etc.). Skills where *judgment under pressure* is the real skill work best. Fuzzy/creative skills (e.g. guitar) are out of scope for the demo.

## 5. Core loop (the whole product)

```
Type skill
   ↓
Case File generated (5 incidents on a timeline)
   ↓
┌──────────────────────────────────────────────┐
│ INCIDENT: alert + 3 pieces of evidence        │
│ QUESTION: "What do you do first?" (4 options) │
│        ↓                                      │
│ REVEAL: consequence plays out, meter moves    │
│        ↓                    ↓                 │
│   best choice          wrong choice           │
│        ↓                    ↓                 │
│ DEBRIEF card         ⏪ REWIND (costs token)  │
│ (1 concept learned)   → pick again            │
└──────────────────────────────────────────────┘
   ↓
Next incident unlocks (difficulty adapts)
   ↓
Case closed → Incident Report share card
```

## 6. Screens (6 total: the 5 below + Curve)

1. **Home**: big text input ("What do you want to learn?"), 4 example chips (Cybersecurity, UI/UX, SQL, DevOps), one button: **Start the case**.
2. **Incident**: red alert banner, clock line, 3 evidence cards (log / screen / metric / message), the question, 4 option buttons. Timeline strip + stability meter at top.
3. **Reveal**: the chosen option's outcome, with the meter animating. If wrong: glitchy "timeline collapsing" effect and a **⏪ Rewind** button. If right: calm "timeline saved" effect and **Continue**.
4. **Debrief**: one card: concept name, one-line rule of thumb, why the best choice works, a real-world note, teaser for the next incident.
5. **Case Closed**: score, badge, concepts unlocked, **Share card** (downloadable image).

6. **Curve**: the learner's learning curve (points per incident, rewinds used, concepts unlocked, one AI note). Plain SVG chart.

A slim **navbar** (max 3 links: Case · Curve · New skill, plus streak / score / rewind tokens) is on every screen. The **timeline strip** (the roadmap) is persistent on screens 2-4. Full visual spec is in `design.md`.

## 7. Feature scope

### P0 — must ship (demo breaks without these)
- Goal input → Case File generation (JSON, validated)
- Incident screen with evidence, question, 4 options
- Reveal screen with outcome + stability meter animation
- Rewind mechanic (3 tokens per case)
- Debrief card
- Persistent timeline strip with progress
- Score + localStorage persistence
- **Live Gemini generation for ANY skill (the default path)**, so judges can type whatever they want
- **Seeded fallback case** for 1-2 skills (used automatically if the API fails, times out, or is rate limited)
- **Navbar** + visual system exactly as in `design.md`

### P1 — ship if time allows
- Adaptive difficulty after incident 1
- Forgiving streak (first missed day = auto rest day)
- Perfect Timeline badge (solved with zero rewinds)
- Case Closed screen + share card (`html-to-image`)
- Prefetch next incident while the user reads the debrief
- **Curve page**: line chart of points per incident + concepts unlocked + AI note (plain SVG, no chart library)

### P2 — cut without guilt
- Free-text answers graded by AI
- Sound effects
- Multiple saved cases
- Auth / backend DB / settings / dark-light toggle

## 8. Gamification design (judged — make it visible)

| Mechanic | Rule |
|---|---|
| **Stability meter** | Starts at 50 each incident. Choices shift it. Reaching 100 = incident solved; dropping to 0 = timeline collapse (forces a rewind). Animated, always visible |
| **Rewind tokens** | 3 per case (shown as ⏪⏪⏪). Spend 1 to retry an incident after a wrong choice. Running out never blocks learning: you still get the debrief, just a lower score |
| **Points** | Solved first try: 100 · after 1 rewind: 60 · after 2+: 30 |
| **Perfect Timeline** | Badge for solving an incident with zero rewinds. Golden timeline node |
| **Forgiving streak** | Day streak stored in localStorage. First missed day is auto-forgiven as a "rest day" |
| **Case rank** | Intern → Analyst → Lead → Chief, based on total score at case end |
| **Incident Report** | Shareable card: skill, rank, score, concepts unlocked, one-line verdict |

Reward moments: confetti-free, on-theme **"timeline restored"** animation (screen un-glitches, node turns green).

## 9. Simplicity checklist (judged — enforce it)

- [ ] Home has exactly **1 input and 1 button** visible
- [ ] Every other screen has exactly **1 primary action**
- [ ] One slim navbar (max 3 links); zero sidebars, modals, settings, or onboarding tours
- [ ] The timeline strip *is* the roadmap; understandable in one glance
- [ ] Max ~60 words of reading per screen (evidence cards are short)
- [ ] Loading states are themed ("Rewinding the clock...") and never longer than ~6s

## 10. Technical architecture

**Stack**: Next.js (App Router) + TypeScript + Tailwind + framer-motion. LLM via server route so the API key is never in the browser. Gemini API recommended (fits Antigravity), but the code must keep the provider behind one function `callLLM()` so it can be swapped.

```
/app
  page.tsx                  Home
  case/page.tsx             Timeline + Incident/Reveal/Debrief flow
  api/casefile/route.ts     POST {goal} → CaseFile
  api/incident/route.ts     POST {goal, incidentMeta, difficulty} → Incident
  api/report/route.ts       POST {results} → ReportCard (P1)
/lib
  llm.ts                    callLLM(), JSON parsing + retry
  schema.ts                 zod schemas for CaseFile, Incident, Report
  store.ts                  game state + localStorage
  seed/                     cybersecurity.json, uiux.json (full pre-generated cases)
/components
  TimelineStrip, StabilityMeter, EvidenceCard, OptionButton,
  RevealPanel, DebriefCard, RewindTokens, ShareCard
```

### Key design decision: one LLM call per incident, no grading call
Each incident JSON contains **all 4 options with their consequences pre-written**. Choosing an option is therefore *instant* (no waiting on a grader), the reveal animation can play immediately, and rewinding is free of latency. The AI call happens only when an incident loads, and the next one is prefetched.

### Data model (see `prompts.md` for the exact JSON)

```ts
type CaseFile = { goal; role; tagline; incidents: IncidentMeta[5] }
type IncidentMeta = { id; order; title; setting; concept; difficulty: 1..5; hook }
type Incident = IncidentMeta & {
  alert; clock; stakes_line;
  evidence: { kind: 'log'|'screen'|'metric'|'message'; label; content }[3];
  question;
  options: { id; text; is_best; stability_delta; outcome; why }[4];
  debrief: { concept; rule_of_thumb; why_best_works; real_world_note; next_teaser }
}
type GameState = { case; currentIndex; tokens; score; results[]; streak; lastPlayedDate }
```

### Adaptive difficulty (P1, pure code, no AI)
After each incident: solved with 0 rewinds → next difficulty `+1`; 1 rewind → `+0`; 2+ rewinds → `-1` (min 1) and the next incident prompt gets `support_level: "high"` (clearer evidence, obvious trap labels in debrief).

## 11. Judge walkthrough (no demo video needed: GitHub link + live prototype)

| Time | On screen | Say |
|---|---|---|
| 0-8s | Home. Type "Cybersecurity" → Start | "Every learning app gives you a 40-item syllabus. We give you the worst day of your career, and let you fix it." |
| 8-20s | Alert: *"Fuel pipeline billing systems are down. A ransom note just appeared."* 3 evidence cards, 4 options | "You're the security lead. One decision." |
| 20-32s | Pick the tempting wrong option → timeline glitches, meter crashes | "Wrong move. In a textbook you'd never know why." |
| 32-45s | Hit **⏪ Rewind**, pick the right option → timeline restores, node turns green, debrief card slides in | "So we rewind time. You just learned isolate before you investigate." |
| 45-55s | Timeline strip shows 1/5 done, streak, score; flash the next incident teaser | "Five incidents, easy to hard. The roadmap is a story." |
| 55-60s | Share card | "From 'where do I start?' to your first real decision, in 60 seconds." |

**How judges use it**: the live link opens on Home. They type *any* skill, play through the incidents, and open **Curve** to see their learning curve for that skill. The table above is just a suggested 60-second path if you ever present live. Seeded cases are the safety net, not the main path.

## 12. 2-hour build plan (with Antigravity)

Split work: **Antigravity agent builds UI + plumbing; you own prompts, schema, and the seed data** (the parts that decide quality).

| Time | You | Antigravity agent |
|---|---|---|
| **0:00-0:10** | Drop `prd.md`, `rules.md`, `design.md` into the workspace. Paste **Kickoff Prompt** from `prompts.md` | Scaffolds Next.js + Tailwind + framer-motion, folder structure, zod schemas, store |
| **0:10-0:35** | Test **Prompt 1 & 2** in AI Studio, tune until JSON is clean. Generate + save 2 seed cases to `/lib/seed` | Builds `callLLM()`, `/api/casefile`, `/api/incident`, loads seed JSON as fallback |
| **0:35-1:05** | Review UI as it appears; fix copy | Home, Incident screen, Option buttons, Reveal with meter + rewind (**core loop working end to end**) |
| **1:05-1:25** | Check the roadmap strip reads at a glance | TimelineStrip, tokens, score, localStorage, debrief card |
| **1:25-1:45** | Test full run on seed + one live skill | Glitch/restore animations, streak, Perfect Timeline badge, prefetch next incident |
| **1:45-2:00** | Test 3 different live skills. Push to GitHub, deploy on Vercel with `LLM_API_KEY` set, write README (prompt B7) | Share card if there is time. **Otherwise freeze and bug-fix only** |

**Hard checkpoints**: core loop playable by **1:05**. At **1:45** stop adding features.

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| LLM returns bad JSON | zod validation + 1 auto-retry + fall back to seed case |
| API slow, down, or rate limited | Live generation is the default; auto-fall back to the seeded case, themed loading text, cache generated cases, per-IP rate limit |
| Hallucinated "historical facts" | Prompts require *fictionalized* companies "inspired by" real events; only widely known facts if naming a real one |
| Cybersecurity content misuse | Defensive decision-making only; no exploit steps, payloads, or attack how-tos (enforced in prompts and `rules.md`) |
| Scope creep | P2 list is banned until P0 + P1 are done |
| Wrong option feels obviously wrong | Prompt requires one *tempting trap* that sounds expert and one *too slow* option |

## 14. Success criteria

- A judge understands the product in **one glance** at the timeline + incident screen
- The rewind moment gets a visible reaction in the demo
- Full flow (type skill → debrief) works in **under 60s** for any live-generated skill
- Judges can try **any** skill, and the Curve page shows their learning curve for it

---

## 15. Live Gemini access for judges

- **Default path = live.** The deployed app calls the Gemini API through the server routes, so any skill typed by a judge produces a fresh case file and incidents.
- **Key safety:** key lives only in the host's environment variable (`LLM_API_KEY` on Vercel). Never in client code, never in GitHub.
- **Quota safety:** per-IP rate limit, 80-char goal cap, in-memory cache by normalized goal, 20s timeout, then seed fallback. Use a Flash-tier Gemini model for speed (incident generation should land in a few seconds).
- **Learning curve:** every incident logs `{ incidentId, difficulty, rewindsUsed, points }`. The Curve page plots points per incident; falling rewinds and rising points show learning. Adaptive difficulty (P1) makes the curve visible even in a 5-incident run.

## 16. Design

Look and feel (palette, type, components, motion, navbar, screens) is fully specified in `design.md`. Build the Figma frames from it first (about 15 minutes of styles + components), then have Antigravity implement the frames.