# Task for John (PM)

You are John, the PM. Your role: Take a PRD and break it into clear, actionable user stories grouped into epics. Each story has acceptance criteria. You work with precision, not creativity.

---

## TASK: Decompose this PRD into epics and user stories

## PRD:

### Simple Flashcard App

#### Problem
Studying with paper flashcards is clunky, and most digital alternatives require accounts or subscriptions.

#### Goal
A browser-based flashcard app where users create decks, flip cards, and track what they've learned — all local.

#### Users
Students, language learners, anyone memorizing facts.

#### Core Features
1. Create deck — Name a deck and add cards (front + back text).
2. Study mode — Flip cards one at a time; mark as "Know it" or "Review again".
3. Shuffle — Randomize card order per session.
4. Progress — Show % of cards marked "known" per deck.
5. Edit / delete — Modify cards or remove decks.
6. Persistence — Decks and progress saved via localStorage.

#### Screens
1. Home: list of decks + "new deck" button.
2. Deck view: list of cards + edit/add/delete.
3. Study view: one card at a time, flip on tap, Know/Review buttons.

#### Non-Goals (v1)
No accounts, no spaced repetition algorithm, no import/export, no images or audio on cards.

#### Data Model
Deck { id, name, createdAt, cards: [{ id, front, back, known }] }
Stored as JSON array under key decks in localStorage.

#### Tech
HTML + vanilla JS (or React).
localStorage for persistence.
CSS transform for card flip animation.

#### Deployment (Netlify)
Host: Netlify (free tier, static hosting).
Setup: Connect GitHub repo via Netlify dashboard.
Build command: npm run build (React) or none (vanilla).
Publish directory: dist/ or build/ (React) or / (vanilla).
CI/CD: Auto-deploys on push to main; preview deploys for PRs.
Domain: Default *.netlify.app; custom domain optional with free HTTPS.
Config: netlify.toml for build settings + SPA redirect fallback.

#### Success Metric
Cards flip smoothly; progress persists across sessions; decks load instantly.

#### Risks
localStorage per-browser — users lose decks if they switch devices or clear cache.
Large decks (1000+ cards) may slow initial load → lazy-render card lists if needed.

---

## DELIVERABLE:

Create a stories.md file at: `/Users/bullseye/Desktop/projects/flashcard-app/stories.md`

Format:

```
# Stories

## Epic 1: [Epic Name]

### Story [#]: [Story Title]
**Description:** [one sentence]
**Acceptance Criteria:**
- [AC1]
- [AC2]
- [AC3]

[repeat for all stories in epic]

## Epic 2: [Epic Name]
[etc]
```

---

## RECEIPT:

Write your receipt to: `/Users/bullseye/Desktop/projects/flashcard-app/receipts/john-decompose-{timestamp}.md`

Format:

```
# Receipt: John — Decompose PRD

**Status:** DONE
**Artifacts:**
- stories.md

**Summary:**
[Brief summary of epics and story count. Example: "Decomposed into 3 epics (Core App, Study Features, Persistence) with 8 total stories."]

**Token Usage:** [your estimate]
```

When done, return this receipt and stop.
