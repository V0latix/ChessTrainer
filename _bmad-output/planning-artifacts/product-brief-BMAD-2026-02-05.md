---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - /Users/romain/dev/ChessTrainer/_bmad-output/brainstorming/brainstorming-session-2026-02-05-170601.md
date: 2026-02-05
author: Romain
---

# Product Brief: ChessTrainer

<!-- Content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

Chess Trainer (working name) is a personalized chess improvement tool for intermediate players who feel stuck. It imports recent games, identifies critical mistakes, and turns those exact positions into targeted training with concise explanations. The goal is faster, visible Elo progress through personalized error-driven learning at an accessible price.

---

## Core Vision

### Problem Statement

Intermediate, casual chess players (roughly 1400–2000 Elo) struggle to improve on their own because they don’t understand why they make recurring mistakes during real games.

### Problem Impact

The lack of personalized feedback causes stagnation, frustration, and eventual disengagement. Players consume generic content (videos, generic tactics) that doesn’t map to their actual errors, so progress feels slow or invisible.

### Why Existing Solutions Fall Short

Current options like Chess.com analysis, paid analysis apps (e.g., MGS‑style tools), and educational videos are either too expensive, insufficiently explanatory, or not personalized to a player’s specific mistakes. This leaves a gap for affordable, personalized error‑driven training.

### Proposed Solution

Chess Trainer automatically imports a user’s recent games, detects their worst mistakes, and converts those positions into short, focused training tasks. Each error is explained in clear, simple terms, and users immediately replay the correct move in context to build recognition and retention.

### Key Differentiators

- **Personalized on real mistakes:** Training uses the player’s own positions, not generic puzzles.
- **Fast improvement loop:** Import → analyze → error → replay → explain.
- **Affordable freemium model:** More accessible than premium analysis tools.
- **Founder‑as‑user advantage:** Built by the exact target player, enabling fast iteration on real pain.

## Target Users

### Primary Users

**Leo (Intermediate Improver)**
- **Profile:** 22 years old, ~1600 Elo, plays ~5 games/day.
- **Goals:** Reach 2000 Elo by end of year; feel clear, steady improvement.
- **Pain Points:** Feels stuck; knows he makes mistakes but doesn’t understand them; lacks personalized feedback.
- **Time/Context:** 15 minutes/day; web app.
- **Success Definition:** Sees concrete Elo gains and can recognize + correct his recurring mistakes.

### Secondary Users

**Hugo (Beginner)**
- **Profile:** 8 years old, beginner level.
- **Goal:** Beat friends and stronger adults at his chess club.
- **Pain Point:** Gets beaten consistently; doesn’t know what to fix.

**Maxime (Expert)**
- **Profile:** 30 years old, advanced player.
- **Goal:** Refine specific tactical/strategic weaknesses.
- **Pain Point:** Improving those edges takes a lot of energy and time.

**Coach (Secondary)**
- **Profile:** Coach who follows students’ games.
- **Goal:** Give better, faster feedback based on real mistakes.

### User Journey

**Discovery:** Searches “how to improve at chess” and finds Chess Trainer.  
**Onboarding:** Imports recent games from Chess.com.  
**Core Usage:** Daily short sessions: review mistakes, solve puzzles on weak spots.  
**Aha Moment:** Wins a real game by playing a best move he learned from Chess Trainer.  
**Long‑Term:** Regular re‑import of new games; systematically closes recurring gaps.

## Success Metrics

**User Success Metrics**
- **Elo Progress:** +100 Elo within 3 months for active users.
- **Engagement Habit:** ~10 puzzles per day per active user.
- **Puzzle Success Rate:** ≥ 50% average success rate.

### Business Objectives

N/A (not defined yet; focus is MVP functionality and user value)

### Key Performance Indicators

- **Active Users with Elo Gain:** % of active users achieving +100 Elo in 3 months.
- **Daily Puzzle Completion:** average puzzles completed per active user per day.
- **Puzzle Success Rate:** average success rate across all puzzles.

## MVP Scope

### Core Features

- **Account system (MVP):** user login to connect and save profile.
- **Chess.com import:** pull recent games.
- **Stockfish analysis:** evaluate games and detect critical mistakes.
- **Error replay:** present the exact positions where mistakes occurred and let users replay the best move.
- **Clear explanations:** explain why the user’s move was bad and why the correct move is better.

### Out of Scope for MVP

- Social features
- Multiplayer
- Mobile apps
- Advanced AI coach
- Deep historical game archive (beyond basic account data)

### MVP Success Criteria

- **User growth:** 10 users within 1 month of launch.
- **User outcomes:** +100 Elo in 3 months for active users.
- **Usage habit:** ~10 puzzles per day per active user.
- **Puzzle success rate:** ≥ 50% average success rate.

### Future Vision

- Advanced AI coach with richer, personalized explanations.
- Larger data corpus to generate higher‑quality puzzles.
- Deeper insights into what drives improvement.
- Specialized training modules (openings, endgames, tactics).
