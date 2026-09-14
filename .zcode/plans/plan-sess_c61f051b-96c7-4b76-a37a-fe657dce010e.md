# FP26 v6 "Integration & Correction" — match_engine.html overhaul

Guiding rule (per your own analysis): **no rewrite**. Preserve what works (`passOptions` scoring, `evalSpatialOpportunity`, one-presser+cover `assignPress`, loan/roam formation system), fix root causes, wire dead layers, remove conflicting legacy logic, calibrate last. All changes are surgical edits inside the single 3,241-line file.

Key discovery that corrects the pasted analysis: decision selection is **already fully deterministic** (no `gauss()` in utilities anywhere) — the stability problem is *commitment enforcement and multi-writer conflicts*, not selection noise. Also `T.phase` and `T.threatMap` are computed but never read — the "team objective layer" you wanted is half-built and just needs wiring.

## Phase 0 — Baseline
- Open the file in a browser, run 2–3 full fast-sim matches; record possession, passes, accuracy, shots, xG, fouls, corners.
- Add permanent small stat counters for lofted passes (attempted/completed) to `blankStats()` (line 917) + BUILD-UP stats panel — needed to measure the lob fix, useful forever.

## Phase 1 — Carrier vs chaser speed (user: "through on goal must be stoppable")
- `effSpeed()` (2584): replace `wb = 0.74 + drib*0.16` with skill-gated `wb = clamp(0.62 + 0.20*drib + 0.08*pace + 0.05*comp, 0.62, 0.95)` (Strong tier: average carrier ~78–84%, elite ~92%).
- `moveStep()` (2617): extra stamina drain when sprinting with the ball.

## Phase 2 — Fix lob-pass overuse (root cause confirmed)
- `laneSafety()` (1047): ground near-blocker weight 1.3→1.0; lofted near-blocker 0.35→0.55; lofted header-contest zone earlier (t>0.45) and wider (3.0m).
- `flightContests()` (1115): defenders can contest dropping lofted balls below ~2.2m near the landing point — removes the lofted interception-immunity (z>1.25 skip).
- `passOptions()` (1357): stronger loft penalty (1442: max −0.25 → −0.15 − up to −0.35 by distance), minimum distance 26m for switch candidacy, subtract aerial-contest risk at the landing point, penalize loft when `style.direct` is low.
- GK clearances/distribution and crosses stay lofted (legitimate). Target: lofted share ~10–15% of passes.

## Phase 3 — Formation adherence + de-clustering (the "grouping up" fix)
**In possession** (`thinkAttack` 1791, `zoneAnchor` 1309):
- Tighten roam caps: CB 5→4, FB 8→6.5, DM 7→6, CM 9→7.5, W 9.5→8.5, ST 12→10; raise per-meter roam cost ~30%; raise SHAPE base utility 0.44→0.50.
- De-cluster: crowding penalty radius 5→7m / slope 0.14→0.18 (2035); SUP support points spread around an anchor+carrier midpoint (not a ring on the carrier); always keep near+far triangle options.
- Open up own-third structure: POCKET gate 34→28; ST/AM drop-short option in own third; FB width live early; DM pivot behind the ball.

**Out of possession** (`thinkDefense` 2140, `updateBlock` 1294):
- Unstack the ball-y pulls: `blockShift` anchor factor 0.5→0.35 (1353), CB ball-side lerp 0.6→0.45 (2155), cap anchor lateral drift from slot.
- Marking (2187): blend mark position with zone point (keep shape), radius 7–8→9m, refuse marks >12m from anchor, priority from threatMap (Phase 4).
- Separation (2214): strength 0.5→0.8, radius 5→6m.
- Pressing (2082): keep 1 presser + 1 cover; tighten radii (ST 14/21→12/17m, mids 10–11/15–16.5→9/13m); presser score weighted by **formation-anchor distance** so the structurally-correct player pressures (your requirement), not the nearest wanderer.
- Light defensive state machine in `duelsStep` (2220): LINE/ZONE/MARK/SCREEN defenders may enter CONTAIN when the carrier is within ~3.5m (today only PRESS/DEF can jockey); decelerating goal-side approach; tackle only in the challenge window (heavy touch / touch distance / carrier turned); beaten → RECOVER sprint goal-side ~1.2s.
- Rest defense: FB push conditional on DM/CB cover; CBs+GK(+1) never leave anchor while team has the ball.

## Phase 4 — Wire the dead team layer + architecture cleanup
- Make `T.phase` (1019) drive decisions: BUILD → retention/width/safe SUP; PROGRESS → between-lines/half-space/through balls; FINISH/CHANCE → box runs/cutbacks/shots; modulate `zoneAnchor` push by phase.
- Wire `T.threatMap` (1037) into marking priority + rest defense (replaces ad-hoc threat at 2200).
- Intent ownership fix (light unification, no rewrite): `commitUntil` respected by `thinkDefense` too (interrupt only on ball moved >8m / possession change / press handoff); `duelsStep` only steers CONTAIN/press players so it stops fighting `thinkDefense` targets each frame; `takeBall` (1194) resets stale MARK/CONTAIN/LINE/ZONE on turnover.
- Legacy cleanup: dead `T.blockTx` write (1296), `settlePass` completion on botched control (1173), duplicate commitment term in `foulP` (2225), wire-or-remove `gkRef`, surface `spaceLabel` in inspector or drop it.

## Phase 5 — Set pieces & match flow
- **Foul stoppage**: `whistleFoul` (2281) → new `STOPPAGE` phase block in `step()` beside GOAL/HALF (2735): ball dead, players decelerate to walk, banner/card; ~1.4s base +0.8 yellow / +2.5 red / +1.2 penalty; then the free kick/penalty SETUP. Advantage logic unchanged.
- **Corners** (build 2395 / execute 2514): attackers crowd the box — 2 near post 6-yard, 2 penalty-spot zone, 1 far post, 1 at 18-yd edge, 1 short option, 2 back; delivery zones aligned with where they stand (today they stand 19–25m out while the ball lands 6–12m out); scripted near/far-post runs at delivery; defenders: GK + 2 zonal on 6-yard line + man-mark the 4 best aerial threats + edge + short cover. Counters: clearing defender arms `counterUntil` (already exists), corner attackers get slow recovery loans so the counter is real.
- **Free kicks near the box** (2428/2547): corner-style crowding (4–5 in the box with staggered runs, edge runner, 2 back); 9.15m 4-man wall kept; same counter behavior after a clearance.
- **Throw-ins** (2381/2504): walking phase first (~1.2s, walk mode = 1.6 m/s already in effSpeed), taker jogs to the spot; 3–4 dynamic passing options (short along the line / upfield / back to CB-GK) that adjust to create angles; nearest 1–2 opponents GUARD those options during SETUP (special-case the press/duel gates for THROWIN); live re-score at execute kept; long throws rarer.
- **Goal kicks** (2412/2535): wait 3–4.5s (randomized) with early-fire once teammates are within ~6m of their restart slots and opponents are set (hard cap ~6s); teammates visibly return to formation before the kick; distribution choice logic unchanged.

## Phase 6 — Pitch polish (fixed camera, per your choice)
- Corner quarter-arcs (r=1m) + corner flags at all four corners.
- Goals: solid posts/crossbar + net with ~2m depth behind the line (mesh grid, light perspective).
- Turf: finer 18–20-band two-tone mow stripes, subtle radial vignette, pre-rendered noise texture on an offscreen canvas (computed once).
- Surroundings: dark stand gradient beyond the touchlines + thin ad-board strip; consistent 0.12m chalk lines.
- Heatmap softened (debug only). No camera changes.

## Phase 7 — Calibration & verification (after each phase; final sweep at end)
- Method: open in browser, fast-sim 3–5 full matches per checkpoint; debug overlay + inspector for visual checks (own-half spacing, press selection, set-piece shapes); screenshots of corner/FK/throw-in/goal-kick freezes.
- Targets: 250–400 total passes, 10–18 shots, 0.8–2.2 xG per team, lofted share 10–15%, ~10–20 fouls, 4–10 corners, max 2 players on the ball at any time, through-on-goal carriers caught unless elite.
- Regressions fixed phase-locally before moving on; tunable constants kept in small blocks so calibration is cheap.