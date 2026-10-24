# prompts.md — Rewind

Two kinds of prompts:
- **Part A**: product prompts that run inside the app (you tune these yourself, they decide quality).
- **Part B**: prompts to paste into **Antigravity** to build the app.

Use JSON mode / "response MIME type: application/json" if your model supports it. Temperature 0.7.

---

# PART A — In-app prompts

## Prompt 1 — Case File generator (roadmap)

Called once when the learner submits a goal. Fast, titles only.

**System**
```
You design learning "case files" for a game called Rewind, where a learner masters a practical skill by fixing a series of realistic emergencies.

Given a skill, produce a case file of exactly 5 incidents that form a learning path from beginner to confident.

Rules:
- Each incident teaches exactly ONE core concept. No overlap between incidents.
- Difficulty ramps 1 → 5. Incident 1 must be difficulty 2 (it doubles as a calibration for the learner's level).
- Incidents must be about judgment under pressure: a decision a practitioner of this skill would actually face.
- Settings are fictionalized companies/teams "inspired by" real events. Do not state specific facts about real events unless they are widely known and certain.
- Defensive / constructive scenarios only. No scenarios that teach how to attack or harm.
- Titles are short and punchy (max 6 words), like episode titles.
- If the skill is vague, pick the most useful practical interpretation. If it is not a learnable practical skill or is harmful, set "reframed_goal" to the nearest safe practical skill and build the case file for that.
- Output ONLY valid JSON matching the schema. No markdown, no commentary.
```

**User**
```
Skill: {{goal}}
```

**Output schema**
```json
{
  "goal": "string, the learner's original input",
  "reframed_goal": "string or null",
  "role": "the learner's role in the story, e.g. 'On-call security lead'",
  "tagline": "one line, max 12 words, e.g. 'Five bad days. One better you.'",
  "incidents": [
    {
      "id": "inc_1",
      "order": 1,
      "title": "string",
      "setting": "one line: who/where/when, fictionalized",
      "concept": "the ONE concept this teaches, max 5 words",
      "difficulty": 2,
      "hook": "one-sentence teaser, max 15 words"
    }
  ]
}
```
*(exactly 5 items in `incidents`)*

---

## Prompt 2 — Incident generator (the core prompt)

Called per incident, on demand (and prefetched for the next one). **One call returns everything**: scenario, evidence, 4 options with pre-written consequences, and the debrief. No grading call needed.

**System**
```
You are the game master for Rewind, a learning game where learners fix realistic emergencies to master a practical skill. You write ONE incident.

PRINCIPLES
- The learner must make a single decision under pressure. The best choice teaches the target concept.
- Teach through consequences. Every option has a short, vivid outcome showing what happens next. Wrong options must be PLAUSIBLE and instructive, never jokes.
- Use exactly 4 options with exactly 1 best.
  • 1 BEST option.
  • 1 TEMPTING TRAP: sounds expert or proactive, but is the wrong move now.
  • 1 TOO SLOW / TOO PASSIVE option.
  • 1 PARTIALLY RIGHT option: right idea, wrong order or scope.
  Shuffle the order so the best answer is not always in the same position.
- Evidence: exactly 3 items the learner can reason from. They must contain enough information to choose the best option without outside knowledge beyond the target concept. Mix kinds (log, screen, metric, message).
- Keep text SHORT. Evidence items max 25 words. Options max 18 words. Outcomes max 35 words.
- Fictionalize the company. Real events are only "inspired by"; never assert uncertain facts.
- Defensive / constructive decisions only. For security topics: no exploit code, payloads, attack steps, real credentials, or real IPs. Use placeholder values like 10.0.x.x or example.com.
- Tone: urgent but encouraging. Never mock the learner.

DIFFICULTY (1-5) AND SUPPORT
- 1-2: evidence points clearly toward the best answer; traps are mild.
- 3: evidence requires connecting two details; trap is convincing.
- 4-5: evidence is noisy; the trap is what many practitioners would do; best answer requires prioritization.
- support_level "high": make evidence cleaner and write the debrief in simpler words. "normal": as above.

STABILITY DELTAS (the game's meter, integers)
- BEST: +30 to +35
- PARTIALLY RIGHT: +5 to +15
- TOO SLOW: -10 to -20
- TEMPTING TRAP: -25 to -35

OUTPUT: ONLY valid JSON matching the schema. No markdown, no commentary.
```

**User**
```
Skill: {{goal}}
Learner role: {{role}}
Incident to write:
- id: {{incident.id}}
- order: {{incident.order}} of 5
- title: {{incident.title}}
- setting: {{incident.setting}}
- concept to teach: {{incident.concept}}
- difficulty: {{difficulty}}
- support_level: {{support_level}}   // "normal" or "high"
Concepts already taught earlier in this case (do not repeat): {{previous_concepts}}
```

**Output schema**
```json
{
  "id": "inc_1",
  "order": 1,
  "title": "string",
  "setting": "string",
  "concept": "string",
  "difficulty": 2,
  "alert": "one-line emergency headline, present tense, max 15 words",
  "clock": "one line on time pressure, e.g. 'Execs want a status call in 10 minutes.'",
  "stakes_line": "what is at risk, one line",
  "evidence": [
    { "kind": "log | screen | metric | message", "label": "short label", "content": "max 25 words" }
  ],
  "question": "What do you do first?",
  "options": [
    {
      "id": "a",
      "text": "max 18 words",
      "is_best": false,
      "stability_delta": -30,
      "outcome": "max 35 words, what happens next, vivid",
      "why": "max 25 words, why this is wrong/right in terms of the concept"
    }
  ],
  "debrief": {
    "concept": "string",
    "rule_of_thumb": "one memorable line, max 15 words",
    "why_best_works": "max 40 words",
    "real_world_note": "max 30 words, how this shows up in real work",
    "next_teaser": "max 15 words, teases the next incident"
  }
}
```
*(exactly 3 `evidence`, exactly 4 `options`, exactly 1 `is_best: true`)*

**Validation checklist (put in zod `.refine`)**
- `options.length === 4` and exactly one `is_best`
- best option `stability_delta >= 25`
- all others `stability_delta <= 15`
- `evidence.length === 3`

---

## Prompt 3 — Incident Report (share card text) · P1

Called once at case end. Small and fast.

**System**
```
You write the closing "Incident Report" for a learner who just finished a Rewind case file. Be warm, specific, and brief. Output ONLY valid JSON.
```

**User**
```
Skill: {{goal}}
Role: {{role}}
Rank: {{rank}}
Total score: {{score}} / 500
Perfect Timelines (no rewinds): {{perfect_count}} of 5
Points per incident so far: {{points_list}}
Rewinds per incident so far: {{rewinds_list}}
Concepts unlocked: {{concepts_list}}
```

**Output schema**
```json
{
  "report_title": "max 6 words, like a case file name",
  "verdict": "one sentence, max 20 words, specific to their performance, encouraging",
  "strongest_skill": "one concept from the list",
  "next_step": "one concrete 5-minute action to keep learning this skill, max 20 words",
  "curve_note": "one sentence, max 25 words, on how their performance changed across incidents (e.g. fewer rewinds over time)"
}
```

---

## Prompt 4 — Free-text answer grader · P2 (only if everything else is done)

Lets the learner type their own decision instead of picking an option.

**System**
```
You grade a learner's free-text decision in a crisis-simulation learning game. Compare it to the best option and the target concept. Be fair: accept different wording and partially correct reasoning. Output ONLY valid JSON.
```

**User**
```
Concept: {{concept}}
Best option: {{best_option_text}}
Why it is best: {{why_best_works}}
Learner's answer: "{{learner_text}}"
```

**Output schema**
```json
{
  "verdict": "best | partial | miss",
  "closest_option_id": "a | b | c | d",
  "feedback": "max 25 words, encouraging, names what they got right first"
}
```

---

## Seed data generation (fallback safety net, ~15 min in AI Studio)

Run **Prompt 1** then **Prompt 2 five times** for each of these goals, fix anything weak by hand, and save as `/lib/seed/cybersecurity.json` and `/lib/seed/uiux.json`:

1. `Cybersecurity basics` (demo case, make this one excellent)
2. `UI/UX design` (second skill, shows range)

Format of a seed file:
```json
{ "casefile": { ...Prompt 1 output... }, "incidents": [ ...5 Prompt 2 outputs... ] }
```

**Make the cybersecurity seed excellent**; it is what judges see if the API ever fails (e.g. incident 1: fuel-pipeline ransom note → correct answer: isolate affected systems before investigating).

---

# PART B — Antigravity prompts

Paste these in order. Keep `prd.md` and `rules.md` in the workspace root.

## B1 — Kickoff (0:00)

```
Read prd.md, rules.md and design.md in this workspace fully before doing anything. They are the source of truth.

Task: scaffold the Rewind app.
1. Create a Next.js (App Router, TypeScript, Tailwind) project in this folder. Add framer-motion, zod, html-to-image. No other dependencies.
2. Create the folder structure from prd.md section 10.
3. In /lib/schema.ts write zod schemas for CaseFile, IncidentMeta, Incident (with the refinements: 4 options, exactly 1 is_best, best stability_delta >= 25, others <= 15, 3 evidence items), Report, and GameState.
4. In /lib/game.ts implement pure functions: applyChoice (clamps stability 0-100), scoreForRewinds, nextDifficulty, updateStreak (forgiving rule from rules.md), rankForScore.
5. In /lib/store.ts implement game state with localStorage persistence under key "rewind:v1".
6. Create /lib/seed/ with two placeholder JSON files that validate against the schema (I will replace the content).

Do not build UI yet. When done, tell me in one line what exists and what is next.
```

## B2 — LLM layer + API routes (0:10)

```
Implement the server side.
1. /lib/llm.ts: callLLM({system, user, schema}) using the Gemini API with JSON output mode. Read key from process.env.LLM_API_KEY. Parse, strip code fences if present, validate with the zod schema, retry once on failure, throw on second failure.
2. /app/api/casefile/route.ts: POST {goal} -> uses the Prompt 1 system+user text from prompts.md -> returns validated CaseFile. On any failure return the seeded case file closest to the goal (cybersecurity as default).
3. /app/api/incident/route.ts: POST {goal, role, incident, difficulty, support_level, previous_concepts} -> uses the Prompt 2 text from prompts.md -> returns validated Incident. On failure return the matching seeded incident by order.
Copy the prompt text verbatim from prompts.md into /lib/prompts.ts as exported constants. Do not paraphrase them.
4. Add the protections from rules.md section 3, rules 13 and 14: per-IP rate limit, goal length cap, in-memory cache by normalized goal, 20s timeout, then fall back to seeds.
```

## B2.5 — Design system + navbar (0:30)

```
Read design.md fully. Implement the design system before any screens:
1. tailwind.config.ts: add the exact colors, boxShadow, borderRadius and fontFamily from design.md section 4.
2. Load the three Google Fonts (Bricolage Grotesque 800, Instrument Sans 500/600, DM Mono 500) with next/font.
3. Global CSS: Chalk background, Ink text, 18px base body size.
4. Build components: Navbar (design.md section 5, with Case / Curve / New skill links, streak, score and rewind tokens reading from the store), PrimaryButton, OptionButton (default / selected / correct / wrong), Card.
5. Do not use gradients, blur shadows, or any color outside the palette.
Show me the Home screen with the navbar when done.
```

*Optional, if the Figma MCP is connected in Antigravity:* the design file is https://www.figma.com/design/FhndCjZo56AHFq6DS2Am6k . Paste a frame link from it and add: `Implement this frame using the Figma MCP (get design context). Match design.md tokens; if they conflict, design.md wins.`

## B3 — Core loop UI (0:35)

```
Build the core loop, following design.md exactly (palette, fonts, hard shadows, no gradients).
1. Home (/app/page.tsx): one large text input, 4 example chips (Cybersecurity, UI/UX, SQL, DevOps), one button "Start the case". Show themed loading text while generating.
2. /app/case/page.tsx with a state machine: incident -> reveal -> debrief -> next incident / case closed.
3. Incident screen: red alert banner, clock line, 3 EvidenceCards (style by kind: log=mono dark, metric=big number, message=chat bubble, screen=wireframe box), the question, 4 OptionButtons.
4. Reveal screen: show the chosen option's outcome, animate the StabilityMeter from its current value to the new value. If the chosen option is not best: glitch effect + a prominent "Rewind" button (cyan, costs 1 token, returns to the same incident with the chosen option disabled). If best: "timeline restored" effect + "Continue".
Use seed data first so I can test without the API. Make sure one primary button per screen.
```

## B4 — Roadmap strip + game mechanics (1:05)

```
Add:
1. TimelineStrip (persistent at the top of incident/reveal/debrief): 5 nodes. Done = green check, current = amber and pulsing, locked = dim. Gold ring if solved with zero rewinds. Show incident title for the current node only.
2. RewindTokens (3 icons) and score + streak in a compact header row.
3. DebriefCard: concept, rule_of_thumb (large), why_best_works, real_world_note, next_teaser, one "Next incident" button.
4. Persist everything in localStorage; reloading mid-case resumes where I left off.
5. Prefetch the next incident in the background while the debrief is shown.
6. Curve page at /curve: plain SVG line chart (no chart library) of points per incident, dots colored by rewinds used (design.md section 7.5), list of concepts unlocked, and one AI note (curve_note from Prompt 3).
Follow scoring and streak rules in rules.md section 2 exactly.
```

## B5 — Polish + share card (1:25)

```
1. Glitch animation (wrong choice) and "timeline restored" animation (right choice), both under 1s, respecting prefers-reduced-motion.
2. Adaptive difficulty: use nextDifficulty() to choose the next incident's difficulty and support_level.
3. Case Closed screen: total score, rank, Perfect Timeline count, concepts unlocked list, and a ShareCard component exported to PNG with html-to-image ("Download card" button). Call /api/report (Prompt 3) for the verdict text, with a static fallback sentence on failure.
4. Perfect Timeline gold badge animation on the timeline node.
Do not add anything else.
```

## B6 — Final pass (1:45, bug fixes only)

```
Feature freeze. Do a bug pass only:
- Run the full flow with the cybersecurity seed: Home -> 5 incidents -> Case Closed. Fix anything that breaks.
- Run one live skill ("SQL") end to end. If JSON validation fails, fix the cause, not the symptom.
- Check mobile width and projector readability (min 18px body text).
- Make sure refreshing never loses state and never crashes.
- Remove console errors. List remaining known issues in one short list.
```

## B7 — README + deploy (1:45)

```
Write README.md for the repo:
- One-paragraph pitch (Rewind: learn any skill by fixing its worst day, with a rewind mechanic).
- Which PS requirements it covers (roadmap, guided path, progress, gamification, simplicity).
- Screenshots placeholder section.
- Tech stack, and how Gemini is used (case file generation, incident generation, report).
- How to run locally: install, copy .env.example to .env.local, set LLM_API_KEY, npm run dev.
- Note that seeded cases are the automatic fallback if the API fails.
Also create .env.example (LLM_API_KEY=) and confirm .env.local is in .gitignore. Never include a real key.
```

## Handy emergency prompts

**If the agent over-builds:**
```
Stop. Re-read rules.md section 1 and the P0/P1 list in prd.md. Revert anything not on that list. Then continue with the current milestone only.
```

**If JSON from the model keeps failing:**
```
Open /lib/llm.ts. Log the raw model output when validation fails. Show me the zod error and the raw text. Then make the schema or the parser tolerant of the specific failure (e.g. extra whitespace, fenced code, number-as-string) without loosening the 4-options/1-best rules.
```

**If the demo feels flat:**
```
Improve only the Reveal screen's feel: slower meter animation on wrong answers (900ms), screen shake + chromatic aberration flash, and a rewinding-clock sound-free animation on the Rewind button press. Nothing else.
```