---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments:
  - /Users/romain/dev/ChessTrainer/_bmad-output/planning-artifacts/product-brief-BMAD-2026-02-05.md
  - /Users/romain/dev/ChessTrainer/_bmad-output/brainstorming/brainstorming-session-2026-02-05-170601.md
workflowType: 'prd'
documentCounts:
  productBriefs: 1
  research: 0
  brainstorming: 1
  projectDocs: 0
classification:
  projectType: web_app
  domain: edtech
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - ChessTrainer

**Author:** Romain
**Date:** 2026-02-05

## Success Criteria

### User Success

- Users gain **+100 Elo within 3 months** (for active users).
- Users complete **~10 puzzles per day** on average.
- Users achieve **≥ 50% puzzle success rate**.

### Business Success

N/A (not defined yet; focus is MVP functionality and user value)

### Technical Success

- **Game analysis time:** ≤ 1 minute per game.
- **Puzzle generation time:** ≤ 5 seconds.
- **Uptime:** 99%.
- **Error detection (Stockfish):** classify critical mistakes when evaluation drop ≥ 2.0.

### Measurable Outcomes

- % of active users reaching +100 Elo in 3 months.
- Average puzzles completed per active user per day.
- Average puzzle success rate across the user base.
- Median game analysis time and puzzle generation time.
- Monthly uptime.


## User Journeys

### Journey 1 — Leo (Primary User, Happy Path)

**Opening Scene:** Leo is a 22‑year‑old 1600 Elo player who feels stuck despite playing daily.  
**Rising Action:** He finds ChessTrainer via a search, creates an account, and imports his Chess.com games.  
**Climax:** He replays critical mistake positions and sees concise explanations of why the best move works.  
**Resolution:** Over days, he notices stronger decision‑making in real games and visible Elo gains.  
**Emotional Arc:** Frustration → clarity → confidence → pride in measurable progress.

### Journey 2 — Leo (Primary User, Edge Case: Slow Analysis)

**Opening Scene:** Leo imports his games, but analysis takes longer than expected.  
**Rising Action:** The app shows a progress bar with ETA, keeping him informed instead of leaving him stuck.  
**Climax:** He sees the analysis complete and moves directly into the replayable mistakes.  
**Resolution:** The transparent ETA prevents drop‑off and maintains trust.  
**Emotional Arc:** Annoyance → reassurance → re‑engagement.

### Journey 3 — Coach (Secondary User, Minimal)

**Opening Scene:** A coach wants faster insight into a student’s recurring mistakes.  
**Rising Action:** He creates an account, imports a student’s games, and reviews the critical errors list.  
**Climax:** He uses the mistake positions + explanations to give targeted feedback quickly.  
**Resolution:** He saves time and delivers more precise coaching.  
**Emotional Arc:** Time pressure → efficiency → relief.

### Journey Requirements Summary

- Account creation and secure login  
- Chess.com import flow  
- Analysis progress visibility with ETA  
- Error detection + replayable positions  
- Clear explanations to support learning and coaching

## Domain-Specific Requirements

### Compliance & Regulatory
- **GDPR (EU/France):** lawful basis for processing, privacy policy, data access and deletion.
- **Age gate:** users 16+ (no minors targeted).

### Technical Constraints
- **Data retention:** chess games retained indefinitely until user requests deletion.
- **Account deletion:** user can delete account and all associated data.
- **Accessibility:** WCAG 2.1 AA target.

### Integration Requirements
- **Chess.com import** with stable API handling and rate‑limit awareness.

### Risk Mitigations
- Clear consent and deletion flows to meet GDPR expectations.
- Transparent data handling for imported games and analysis.

## Web App Specific Requirements

### Project-Type Overview

ChessTrainer is a **SPA web app** focused on fast, repeatable training sessions. SEO is **not required**.

### Technical Architecture Considerations

- **Client-side routing** (SPA).
- **Async analysis pipeline** with visible progress + ETA (no real‑time websockets).
- **Polling-based status updates** for analysis completion.

### Browser Matrix

- **Chrome + Safari (desktop)**, last 2 versions.

### Responsive Design

- Responsive layout for desktop and mobile web (best effort).

### SEO Strategy

- **No SEO requirements** (private app use, authenticated experience).


## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP (deliver a tight, high‑quality loop: import → analyze → replay → explain).  
**Resource Requirements:** Solo developer, ~2 months.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Leo happy path (import → analyze → replay → progress)  
- Leo edge case (slow analysis with ETA)

**Must-Have Capabilities:**
- Account system
- Chess.com import
- Stockfish analysis + error detection
- Error replay + explanations
- Progress/ETA visibility during analysis

### Post-MVP Features

**Phase 2 (Post-MVP):**
- Advanced AI coach with player-specific explanations
- Specialized training modules (openings, endgames, tactics)

**Phase 3 (Expansion):**
- Personalized training plan
- Full game history and long‑term progress tracking
- Larger data corpus to enable higher-quality puzzles
- Insights into what drives improvement to refine training plans

### Risk Mitigation Strategy

**Technical Risks:** Data management scale and storage.  
**Mitigation:** Start with scoped storage limits + efficient PGN storage, monitor usage, and optimize when needed.

**Market Risks:** Emergence of a direct competitor.  
**Mitigation:** Focus on speed of iteration + strong personalization loop tied to user’s own games.

**Resource Risks:** Funding to maintain hosting and infrastructure.  
**Mitigation:** Keep infra lean, monitor costs early, and introduce monetization after MVP validation.

## Functional Requirements

### User Management
- FR1: Users can create an account with email/password.
- FR2: Users can log in and log out securely.
- FR3: Users can delete their account and all associated data.
- FR4: Users must confirm age ≥ 16 during account creation.

### Game Import
- FR5: Users can connect to Chess.com and import recent games.
- FR6: Users can select which games to import from their history.
- FR7: Users can re‑import new games without duplicating existing ones.

### Analysis & Error Detection
- FR8: The system can analyze imported games using Stockfish.
- FR9: The system can identify critical mistakes based on evaluation drop ≥ 2.0.
- FR10: The system can summarize a user’s top mistakes from recent games.

### Training / Error Replay
- FR11: Users can open a mistake position and replay the best move.
- FR12: Users can retry the same mistake position if they fail.
- FR13: Users can progress through a sequence of mistake‑based puzzles.

### Explanations
- FR14: The system can explain why the user’s move was wrong.
- FR15: The system can explain why the best move is correct.

### Progress Tracking
- FR16: Users can view their recent progress summary (mistakes, puzzles completed).
- FR17: Users can see trends in recurring mistake types.

### Coach Use (Secondary User)
- FR18: Coaches can import and review games for a student account.
- FR19: Coaches can view the student’s key mistakes and explanations.

### System Feedback
- FR20: Users can see analysis progress with a visible progress bar and ETA.
- FR21: Users receive a completion state when analysis is finished.

### Data & Privacy
- FR22: Users can access a summary of stored data (games, analyses).
- FR23: Users can request deletion of stored games and analysis data.

## Non-Functional Requirements

### Performance
- Initial page load time: < 2 seconds.
- Puzzle page load time: < 1 second.
- UI interaction response time: < 200ms.

### Security
- Data encrypted in transit (HTTPS) and at rest.
- Access to sensitive data is logged for auditing.

### Scalability
- System supports at least 100 active users without performance degradation.
- No long‑term scalability target defined yet.

### Accessibility
- WCAG 2.1 AA compliance target.

### Integration
- Chess.com integration uses retry + exponential backoff on rate limits.
