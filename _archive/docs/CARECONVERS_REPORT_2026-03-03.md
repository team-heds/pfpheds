# CareConvers Report

**Project:** Plateforme HEdS (PFP)
**Module:** CareConvers
**Date:** 2026-03-03
**Prepared by:** GitHub Copilot (GPT-5.3-Codex)

---

## 1) Executive Summary

CareConvers is a guided pedagogical simulation designed to train nursing/health students in clinical communication, pain assessment, and escalation/transmission practices in a geriatric scenario.

The module is functional and pedagogically rich, with a deterministic step engine, contextual media feedback, and a quiz phase. The main architecture is straightforward and maintainable: Vue frontend + Express backend + intent classification (Gemini with regex fallback).

The most important technical concern is **state isolation**: current backend and frontend behavior can cause cross-user session collisions in multi-user conditions. A short hardening pass is recommended before broader rollout.

---

## 2) Pedagogical Objective

CareConvers aims to develop:

- Professional introduction and adapted communication with cognitively/auditory-impaired patients
- Structured pain assessment (OPQRST-like questioning)
- Clinical judgment for escalation
- Standardized handoff quality (ISBAR)
- Knowledge consolidation through a terminal quiz

Scenario framing and phrase expectations are documented in [GUIDE_PHRASES_CARECONVERS.md](../GUIDE_PHRASES_CARECONVERS.md).

---

## 3) Current Technical Scope

### Frontend

- Main view and interaction logic: [src/views/pages/CareConvers.vue](../src/views/pages/CareConvers.vue)
- Route registration (auth-required): [src/router.js](../src/router.js#L670)
- UX includes objectives modal, scenario slides, dossier PDF modal, contextual media panel, step tracker, chat, and quiz UI

### Backend

- Active integration point: [backend/index.js](../backend/index.js#L112)
- Stateful route engine: [backend/supabase/careconversStoreBackend.js](../backend/supabase/careconversStoreBackend.js)
- Endpoints:
  - `POST /api/chat`
  - `POST /api/reset`

### Legacy/Parallel Artifact

- A separate minimal backend exists at [backend/careconvers/index.js](../backend/careconvers/index.js), but active app flow currently uses the route mounted in `backend/index.js`.

---

## 4) Runtime Flow (As Implemented)

1. Learner submits text in CareConvers UI.
2. Frontend calls `POST /api/chat`.
3. Backend resolves user step state.
4. Intent is classified (Gemini if configured; regex fallback otherwise).
5. Step machine validates intent and returns:
   - textual response,
   - `nextStep`,
   - optional media payload.
6. Frontend updates tracker/chat/media and plays avatar TTS response.
7. On step 11, quiz state is initialized/scored until completion.

---

## 5) Gemini Integration Assessment

Gemini is used as a **label classifier**, not a generative dialogue engine.

- Model call: `gemini-2.5-flash`
- Input: user phrase + **current-step constrained label set**
- Output contract: return one exact label (canonicalized afterward)
- Fallback behavior:
  - if Gemini unavailable (`GEMINI_API_KEY` missing), use regex
  - if Gemini fails/returns unknown, use regex

Relevant implementation:
- [backend/supabase/careconversStoreBackend.js](../backend/supabase/careconversStoreBackend.js#L210-L336)
- Env key declaration: [backend/.env.example](../backend/.env.example#L1)

---

## 6) Strengths

- Clear pedagogical progression (11 steps + quiz)
- Deterministic server-side flow (good for assessment reproducibility)
- Multi-layer intent robustness (LLM + regex fallback)
- Rich in-scenario reinforcement (media + instruction text + step tracker)
- Low architectural complexity, fast to iterate

---

## 7) Risks and Gaps (Priority)

### Critical (P1)

1. **User state collision risk**
   - Backend defaults to a shared user identifier (`demo_user`) when `userId` is absent.
   - Frontend request does not currently include `userId` in `/chat` payload.
   - Effect: cross-user session bleed in concurrent use.

2. **Global OPQRST counter shared across users**
   - `temp` is module-global; progression at step 6 can be contaminated by another user.

### High (P2)

3. **Client-exposed TTS key**
   - Google TTS API key appears hardcoded in frontend.
   - Effect: key leakage/abuse risk.

4. **Reset endpoint not wired in frontend flow**
   - `/api/reset` exists but is not called by CareConvers UI.
   - Effect: stale server state across interrupted sessions.

5. **Quiz bootstrap edge behavior**
   - Step 11 logic can evaluate user input before first question emission in some entry paths.

### Medium (P3)

6. **In-memory state only**
   - No persistence; restart loses progress.
   - No TTL cleanup strategy for long-running process.

---

## 8) Recommendations

### Immediate (1-3 days)

- Require and validate `userId` end-to-end for CareConvers calls
- Replace global `temp` with per-user OPQRST progress map
- Ensure first quiz question is emitted immediately upon entering step 11
- Call `POST /api/reset` on explicit restart/new session in UI

### Short Term (1-2 weeks)

- Move TTS to backend proxy or dev-only key policy
- Add state TTL cleanup and lightweight telemetry (step transitions, completion rates, fallback rates)
- Add targeted tests for step 6, step 10, step 11 transitions

### Mid Term (2-6 weeks)

- Persist conversation sessions (Supabase) for continuity and analytics
- Build educator dashboard for cohort outcomes:
  - completion,
  - ISBAR quality,
  - quiz score distribution,
  - frequent failure intents by step

---

## 9) Suggested Success Metrics

- Scenario completion rate
- Median time per step and total session duration
- Step 6 and Step 10 retry frequency
- ISBAR completeness at first attempt
- Quiz mean score and pass threshold attainment
- Gemini vs regex fallback ratio

---

## 10) Overall Conclusion

CareConvers is already a strong educational module with clear clinical training intent and practical UX scaffolding. It is close to production-grade for controlled cohorts, but should receive a targeted hardening sprint focused on user-state isolation and key/security hygiene before wider deployment.
