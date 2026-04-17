# Flashcard App — Technical Architecture

**Designed:** 2026-04-17 12:40 CDT
**For:** Amelia (Frontend Lead), Nico (Infrastructure)
**Status:** READY FOR IMPLEMENTATION

---

## 1. System Overview

The Flashcard App is a **client-side, browser-native flashcard study tool** with zero backend dependencies. Users create decks, study cards one-at-a-time with flip animations, track progress, and persist everything locally via `localStorage`.

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser Environment                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             User Interface Layer (HTML/CSS)         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │  Home Screen │  │  Deck View   │  │Study Mode │ │   │
│  │  │ (deck list)  │  │ (card mgmt)  │  │(flip UI)  │ │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ▲                                  │
│                            │ render()                         │
│                            │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Application State & Modules (JS)            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │DeckManager   │  │StudySession  │  │Progress   │ │   │
│  │  │(CRUD decks,  │  │(flip, mark,  │  │Tracker    │ │   │
│  │  │ cards)       │  │ navigate)    │  │(% known)  │ │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │UIController  │  │ShuffleEngine │                │   │
│  │  │(view logic)  │  │(randomize)   │                │   │
│  │  └──────────────┘  └──────────────┘                │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ▲                                  │
│                            │ read/write                       │
│                            │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Storage Layer                               │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │   StorageManager (localStorage adapter)     │   │   │
│  │  │   - key: "decks" → [{deck}, {deck}, ...]   │   │   │
│  │  │   - serialize/deserialize JSON              │   │   │
│  │  │   - quota management                        │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ▼                                  │
│                    Browser Storage (~5-10MB)                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Key Principle:** All state lives in memory (`AppState` singleton). All persistence is explicit via `StorageManager`. UI is purely reactive — state changes trigger re-renders.

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Language** | Vanilla JavaScript (ES6+) | No build tool overhead; localStorage + DOM API are native. Keep it simple for a v1 MVP. |
| **HTML** | Semantic HTML5 | Form elements, accessibility, no JSX overhead. |
| **Styling** | Vanilla CSS3 | CSS Grid for layout, CSS Transforms for smooth card flip animation. No preprocessor needed. |
| **State Management** | In-memory JS objects + localStorage | Single source of truth: `AppState` in memory, persisted to localStorage. No Redux/MobX complexity. |
| **Animations** | CSS 3D Transforms | Hardware-accelerated card flip: `transform: rotateY(180deg)` in <500ms. |
| **Build Tool** | Netlify CLI + simple npm scripts | No webpack/Vite; just serve static files. Option to add Vite later if bundle size explodes. |
| **Deployment** | Netlify (JAMstack) | Auto-deploy on GitHub push. Global CDN. Perfect for static sites. |
| **Browser Support** | Modern (Chrome, Safari, Firefox, Edge 90+) | localStorage is universal. CSS 3D transforms work everywhere. No IE11 support needed. |

---

## 3. Core Modules

### Module: **StorageManager**
**Responsibility:** Persist and restore decks to/from `localStorage`.

**Public Interface:**
```javascript
StorageManager.loadDecks()           // → [Deck, ...]
StorageManager.saveDecks(decks)      // → void (throws on quota exceeded)
StorageManager.isQuotaNearFull()     // → boolean
StorageManager.clearAll()            // → void (for testing/reset)
```

**Implementation Notes:**
- Reads/writes to `localStorage.getItem("decks")` as JSON array
- Validates schema before restoring (backward compatibility)
- Catches quota exceeded errors and notifies UI
- No other modules directly touch localStorage

---

### Module: **DeckManager**
**Responsibility:** CRUD operations on decks and cards; single source of truth for deck data.

**Public Interface:**
```javascript
DeckManager.createDeck(name)                    // → Deck
DeckManager.getDeck(deckId)                     // → Deck | null
DeckManager.getAllDecks()                       // → [Deck, ...]
DeckManager.updateDeckName(deckId, newName)     // → Deck
DeckManager.deleteDeck(deckId)                  // → void
DeckManager.addCard(deckId, front, back)        // → Card
DeckManager.updateCard(deckId, cardId, front, back)  // → Card
DeckManager.deleteCard(deckId, cardId)          // → void
DeckManager.getCardsForDeck(deckId)             // → [Card, ...]
```

**Implementation Notes:**
- Manages unique IDs (UUID v4 or timestamp-based)
- Updates `AppState.decks` in memory
- Calls `StorageManager.saveDecks()` after each operation
- Validates all inputs (empty strings, missing IDs, etc.)
- Cards start with `known: false`

---

### Module: **ProgressTracker**
**Responsibility:** Calculate and track progress metrics.

**Public Interface:**
```javascript
ProgressTracker.getProgress(deckId)           // → { total: N, known: M, percent: X }
ProgressTracker.markKnown(deckId, cardId)     // → void
ProgressTracker.markReview(deckId, cardId)    // → void
ProgressTracker.resetProgress(deckId)         // → void (all cards → known: false)
ProgressTracker.getKnownCards(deckId)         // → [Card, ...]
ProgressTracker.getUnknownCards(deckId)       // → [Card, ...]
```

**Implementation Notes:**
- Reads from `DeckManager`, no independent state
- Progress is stored in card `known` flag
- Updates stored to localStorage via `DeckManager`
- Percent = (known count / total count) × 100

---

### Module: **ShuffleEngine**
**Responsibility:** Randomize card order for study sessions (non-destructive).

**Public Interface:**
```javascript
ShuffleEngine.shuffle(cards)              // → [Card, ...] (new array, original unchanged)
ShuffleEngine.createShuffledSession(deckId, options) // → StudySession (pre-shuffled)
```

**Implementation Notes:**
- Uses Fisher-Yates shuffle algorithm
- Returns new array; never modifies original
- Shuffle state is **session-local only** — not persisted
- Called when user enters Study Mode with shuffle enabled

---

### Module: **StudySession**
**Responsibility:** Manage a single study session (card sequence, flip state, navigation).

**Public Interface:**
```javascript
StudySession.create(deckId, options)      // → StudySession
StudySession.getCurrentCard()             // → Card | null
StudySession.flip()                       // → void (toggle flipped state)
StudySession.markKnown()                  // → void (mark and advance)
StudySession.markReview()                 // → void (mark and advance)
StudySession.nextCard()                   // → boolean (true if more cards, false if done)
StudySession.previousCard()               // → boolean
StudySession.exit()                       // → { totalCards: N, knownCount: M }
StudySession.getProgress()                // → { current: X, total: Y }
```

**Implementation Notes:**
- Stateful object created when user clicks "Study"
- Tracks current card index and flip state
- Does NOT modify deck data until user marks "know it" or "review"
- Calls `ProgressTracker` to update cards
- Exit summary shown before return to Deck view

---

### Module: **UIController**
**Responsibility:** Manage screen state and render logic; bridge between user input and business logic.

**Public Interface:**
```javascript
UIController.showHomeScreen()
UIController.showDeckView(deckId)
UIController.showStudyMode(studySession)
UIController.updateProgressBar(deckId)
UIController.showModal(title, content, actions)
UIController.toast(message, type)  // 'success' | 'error' | 'info'
UIController.render()  // full page re-render (called after state changes)
```

**Implementation Notes:**
- Holds only ephemeral UI state (current screen, modal open/closed)
- Real state lives in `DeckManager`, `StudySession`, `ProgressTracker`
- Event listeners attached to buttons; dispatch to appropriate module
- Re-renders only affected DOM subtrees (not full page each time)
- Responsive: single column mobile, multi-column desktop (CSS Grid)

---

### Module: **AppState** (Singleton)
**Responsibility:** In-memory representation of all user data.

**Structure:**
```javascript
const AppState = {
  decks: [
    {
      id: "deck-001",
      name: "Spanish Vocab",
      createdAt: 1713350400000,  // timestamp
      cards: [
        { id: "card-001", front: "Hola", back: "Hello", known: false },
        { id: "card-002", front: "Adiós", back: "Goodbye", known: true },
      ]
    },
    // ... more decks
  ],
  currentScreen: "home",  // 'home' | 'deckView' | 'study'
  currentDeckId: null,
  currentStudySession: null,
  uiState: {
    modalOpen: false,
    toastMessage: null,
  }
}
```

**Mutations:**
- Only via public methods in `DeckManager`, `ProgressTracker`, `StudySession`, `UIController`
- Never mutate directly (enforce via architecture review)

---

## 4. Data Model

### Deck Schema (JSON)

```json
{
  "id": "deck-001",
  "name": "Spanish Vocabulary",
  "createdAt": 1713350400000,
  "cards": [
    {
      "id": "card-001",
      "front": "Hola",
      "back": "Hello",
      "known": false
    }
  ]
}
```

### Card Schema (JSON)

```json
{
  "id": "card-001",
  "front": "What is the capital of France?",
  "back": "Paris",
  "known": false
}
```

### localStorage Format

```json
{
  "decks": [
    { /* Deck 1 */ },
    { /* Deck 2 */ }
  ]
}
```

**Key Constraints:**
- `id`: UUID v4 or `timestamp-randomString` (no collisions)
- `front`, `back`: strings, 1-5000 chars (validate on input)
- `known`: boolean (default false)
- `createdAt`: JS timestamp in milliseconds
- No nested arrays beyond `cards` (flat structure)

---

## 5. Data Flow

### Scenario: User Creates a Deck

```
User clicks "New Deck" button
  ↓
UIController.showModal("New Deck", form)
  ↓
User enters name, clicks "Create"
  ↓
UIController.onCreateDeck(name)
  ├→ DeckManager.createDeck(name)
  │   ├→ Create Deck object with new ID
  │   ├→ Add to AppState.decks
  │   └→ StorageManager.saveDecks(AppState.decks)  [persisted]
  └→ UIController.showDeckView(deckId)
      └→ Render deck cards, add card form
```

### Scenario: User Studies & Marks a Card

```
User clicks "Study" button
  ↓
UIController.showStudyMode(deckId)
  ├→ StudySession.create(deckId, { shuffle: true })
  │   ├→ ShuffleEngine.shuffle(cards) [non-destructive]
  │   └→ Return session with card #1 active
  └→ Render study view with first card
      └→ Card front text visible, flip button ready

User clicks card to flip
  ↓
UIController.onFlip()
  ├→ StudySession.flip()  [toggle flipped state]
  └→ Re-render: card back text now visible

User clicks "Know It" button
  ↓
UIController.onMarkKnown()
  ├→ StudySession.markKnown()
  │   ├→ ProgressTracker.markKnown(deckId, cardId)  [updates AppState]
  │   ├→ StorageManager.saveDecks()  [persisted]
  │   └→ StudySession.nextCard()  [advance to next]
  └→ Re-render: next card appears, progress bar updates

User clicks "Exit Study"
  ↓
UIController.onExitStudy()
  ├→ StudySession.exit()  [returns summary]
  ├→ UIController.showExitSummary(summary)
  └→ After 2s, UIController.showDeckView(deckId)
      └→ Progress updated, card list re-rendered
```

### Scenario: App Loads

```
Browser loads index.html
  ↓
JavaScript initializes
  ↓
StorageManager.loadDecks()
  ├→ localStorage.getItem("decks")
  ├→ Parse JSON
  └→ Populate AppState.decks

UIController.render()
  ├→ Check AppState.currentScreen
  └→ Render Home Screen with all decks
```

---

## 6. APIs & Interfaces

### Public API by Module

#### **StorageManager**
```javascript
// Load all decks from localStorage
StorageManager.loadDecks() → [Deck]

// Save decks to localStorage; throws if quota exceeded
StorageManager.saveDecks(decks: [Deck]) → void

// Check if quota is getting full (e.g., >80%)
StorageManager.isQuotaNearFull() → boolean

// Wipe all decks (for testing/reset)
StorageManager.clearAll() → void
```

#### **DeckManager**
```javascript
DeckManager.createDeck(name: string) → Deck
DeckManager.getDeck(deckId: string) → Deck | null
DeckManager.getAllDecks() → [Deck]
DeckManager.updateDeckName(deckId: string, newName: string) → Deck
DeckManager.deleteDeck(deckId: string) → void
DeckManager.addCard(deckId: string, front: string, back: string) → Card
DeckManager.updateCard(deckId: string, cardId: string, front: string, back: string) → Card
DeckManager.deleteCard(deckId: string, cardId: string) → void
DeckManager.getCardsForDeck(deckId: string) → [Card]
```

#### **ProgressTracker**
```javascript
ProgressTracker.getProgress(deckId: string) → { total: number, known: number, percent: number }
ProgressTracker.markKnown(deckId: string, cardId: string) → void
ProgressTracker.markReview(deckId: string, cardId: string) → void
ProgressTracker.resetProgress(deckId: string) → void
ProgressTracker.getKnownCards(deckId: string) → [Card]
ProgressTracker.getUnknownCards(deckId: string) → [Card]
```

#### **ShuffleEngine**
```javascript
ShuffleEngine.shuffle(cards: [Card]) → [Card]
ShuffleEngine.createShuffledSession(deckId: string, options: {}) → StudySession
```

#### **StudySession**
```javascript
StudySession.create(deckId: string, options: { shuffle?: boolean }) → StudySession

getCurrentCard() → Card | null
flip() → void
markKnown() → void
markReview() → void
nextCard() → boolean
previousCard() → boolean
exit() → { totalCards: number, knownCount: number }
getProgress() → { current: number, total: number }
```

#### **UIController**
```javascript
UIController.showHomeScreen() → void
UIController.showDeckView(deckId: string) → void
UIController.showStudyMode(deckId: string) → void
UIController.updateProgressBar(deckId: string) → void
UIController.showModal(title: string, content: HTMLElement, actions: [Action]) → void
UIController.toast(message: string, type: 'success' | 'error' | 'info') → void
UIController.render() → void  // full or partial re-render
```

---

## 7. Performance Strategy

### Challenge 1: Large Decks (1000+ Cards)

**Problem:** Rendering 1000 cards in Deck view will be slow.

**Solutions:**
1. **Lazy Loading (Recommended for v1):**
   - Load first 50 cards immediately
   - Pagination buttons: "Load More" or "Next Page"
   - Each page loads in <100ms

2. **Virtual Scrolling (v2):**
   - Render only visible cards in viewport
   - Scroll handler re-renders on demand
   - Handles 10,000+ cards smoothly

3. **Study Mode Fast Path:**
   - Study mode doesn't render all cards — only current card
   - No performance hit

**Implementation:**
```javascript
DeckManager.getCardsForDeck(deckId, page = 0, pageSize = 50) → [Card]
// Default pagination is 50 cards/page
```

### Challenge 2: localStorage Quota (5-10 MB limit)

**Problem:** localStorage has a fixed quota; large decks risk hitting it.

**Solutions:**
1. **Quota Monitoring:**
   - After each save, check remaining quota
   - Warn user if >80% full
   - Error on full quota; prompt user to delete decks

2. **Compression (Optional):**
   - Use `LZ-string` library to compress JSON before storing
   - Reduces size by ~60-70%
   - Adds 2-5ms overhead (negligible)

3. **Limits Documentation:**
   - UI message: "Approximately 500-1000 average decks can be stored"
   - Estimate: 1 deck × 100 cards ≈ 10-15 KB

**Implementation:**
```javascript
StorageManager.saveDecks(decks) {
  const json = JSON.stringify(decks);
  const size = new Blob([json]).size;
  const quota = localStorage.getItem("decks") ? 
                new Blob([localStorage.getItem("decks")]).size : 0;
  
  if (size > 5 * 1024 * 1024) {  // 5 MB
    throw new Error("Storage quota exceeded");
  }
  
  localStorage.setItem("decks", json);
}
```

### Challenge 3: Card Flip Animation Performance

**Problem:** Janky animations if not GPU-accelerated.

**Solution:**
- Use CSS 3D Transform: `transform: rotateY(180deg)`
- Transitions in CSS: `transition: transform 0.6s ease-in-out`
- GPU-accelerated; zero JavaScript overhead

**Implementation:**
```css
.card {
  width: 300px;
  height: 400px;
  perspective: 1000px;
  transition: transform 0.6s ease-in-out;
}

.card.flipped {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}
```

### Challenge 4: App Load Time

**Problem:** Parsing large JSON on app start could delay first render.

**Solution:**
- localStorage reads are sync and fast (<10ms even with 10 MB data)
- Render immediately, then hydrate state
- No loading spinner needed

**Implementation:**
```javascript
// On app start
const decks = StorageManager.loadDecks();  // < 10ms
AppState.decks = decks;
UIController.render();  // instant
```

---

## 8. Architecture Decision Records (ADRs)

### ADR #1: Vanilla JavaScript vs React

**Status:** ACCEPTED  
**Date:** 2026-04-17

**Context:**
- Simple CRUD app with 3 screens (Home, Deck, Study)
- No server-side integration
- localStorage persistence only
- Card flip animation needs to be smooth
- Team expertise: vanilla JS preferred

**Decision:**
Use **Vanilla JavaScript (ES6+)** with vanilla CSS for styling.

**Rationale:**
1. **No Build Complexity:** Ship as static HTML/CSS/JS; instant CI/CD
2. **Smaller Bundle:** Single JS file <50 KB minified (vs React+deps ~150 KB)
3. **Faster Initial Load:** No hydration, no JSX parsing
4. **Easier CSS Animation Control:** Direct control over `transform` in CSS, no React re-render thrashing
5. **No Virtual DOM Overhead:** State changes are simple; DOM updates are direct
6. **Team Velocity:** No React learning curve; faster implementation

**Tradeoff:**
- Manual DOM manipulation (accepted; not complex at this scale)
- No component reusability (decks, cards are simple enough to template)
- No strict prop validation (use JSDoc comments instead)

**Alternative Considered:**
- **React:** Overkill for a v1 MVP. Useful if app grows to 50+ components or needs server sync.

---

### ADR #2: localStorage as Single Source of Truth

**Status:** ACCEPTED  
**Date:** 2026-04-17

**Context:**
- PRD says "no accounts, no server"
- Data is device-local (user owns their own data)
- Offline-first by default
- No need for sync or backups (v1)

**Decision:**
Use **localStorage as the single source of truth**. All state persists here; memory is a cache.

**Rationale:**
1. **Simplicity:** No sync conflicts, no server API, no network latency
2. **Offline First:** App works 100% without internet
3. **Privacy:** User data never leaves their browser
4. **Zero Backend Ops:** No databases, no DevOps, pure frontend
5. **Instant Saves:** No network latency or retry logic

**Tradeoff:**
- Data is device-locked (can't sync to phone/laptop)
- No backups or recovery if localStorage is cleared
- 5-10 MB quota (enough for ~1000 decks)

**Future Alternative (v2):**
- Cloud sync: add optional Google Drive / Dropbox export

---

### ADR #3: Session-Only Shuffle (Non-Persistent)

**Status:** ACCEPTED  
**Date:** 2026-04-17

**Context:**
- Users want randomized card order for study sessions
- But they also want consistent deck order for editing/viewing

**Decision:**
Shuffle is **session-local and ephemeral**. Each study session re-randomizes; original deck order is unchanged.

**Rationale:**
1. **Intuitive UX:** Deck view shows cards in original order (user can plan additions)
2. **Simple Implementation:** No persistent shuffle state to manage
3. **Best Learning Practice:** Spaced repetition & randomization work best when session-fresh
4. **Reduced Storage:** No need to save shuffle state per card

**Implementation:**
```javascript
// Each time user enters Study Mode:
StudySession.create(deckId, { shuffle: true })
  ├→ Get original cards from deck
  ├→ ShuffleEngine.shuffle(cards)  [new array, original untouched]
  └→ Use shuffled array for this session only
```

---

### ADR #4: Separate Progress State vs Card State

**Status:** ACCEPTED  
**Date:** 2026-04-17

**Context:**
- Each card has a `known` flag (true = user marked as learned)
- Progress % is derived from `known` flags
- User can reset all progress without deleting cards

**Decision:**
Store progress in the **card object** (`known` boolean). Progress is derived/calculated, not stored separately.

**Rationale:**
1. **Single Source of Truth:** Card object owns all card-related state
2. **Atomic Updates:** One object per card; no sync issues
3. **Simple Reset:** Loop through cards, flip `known` to false
4. **Flexible Queries:** Easy to filter "known" vs "unknown" cards

**Alternative Considered:**
- Separate progress table: `{ deckId, cardId, known }` ← Would require join logic; rejected as over-engineered.

---

### ADR #5: In-Memory AppState for Performance

**Status:** ACCEPTED  
**Date:** 2026-04-17

**Context:**
- Study mode needs to flip cards instantly
- Deck view needs to update progress bar instantly
- Frequent state mutations during study sessions

**Decision:**
Keep a full copy of all state **in-memory** (AppState). Persist to localStorage after each mutation (fire-and-forget).

**Rationale:**
1. **Instant Reads:** No localStorage parsing on every state read
2. **Instant Renders:** State is always in memory; renders don't block on storage I/O
3. **Simple Writes:** Batch mutations, then call `StorageManager.saveDecks()` once
4. **No Race Conditions:** Single AppState object is the source of truth

**Implementation:**
```javascript
// Fast path:
DeckManager.markKnown(deckId, cardId)  // Updates AppState in-memory instantly
  ↓
StorageManager.saveDecks(AppState.decks)  // Writes to localStorage in background (async-like)
```

---

## 9. Implementation Checklist

### Phase 1: Project Setup & Infrastructure

- [ ] Create GitHub repo (`flashcard-app`)
- [ ] Clone locally; set up directory structure:
  ```
  flashcard-app/
  ├── index.html
  ├── styles/
  │   ├── main.css
  │   ├── home.css
  │   ├── deck.css
  │   └── study.css
  ├── js/
  │   ├── app.js
  │   ├── modules/
  │   │   ├── storage.js
  │   │   ├── deckManager.js
  │   │   ├── progressTracker.js
  │   │   ├── shuffleEngine.js
  │   │   ├── studySession.js
  │   │   └── uiController.js
  │   └── utils/
  │       └── id-generator.js
  ├── netlify.toml
  ├── package.json (minimal: devDeps only if linting)
  └── README.md
  ```
- [ ] Initialize package.json with npm scripts:
  ```json
  {
    "scripts": {
      "start": "python3 -m http.server 8000",
      "build": "echo 'no build step needed'",
      "deploy": "netlify deploy --prod"
    }
  }
  ```
- [ ] Connect to Netlify:
  - [ ] `npm install -g netlify-cli`
  - [ ] `netlify init` (link to GitHub repo, set build command to `echo 'build'`)
  - [ ] Create `netlify.toml`
- [ ] Set up Linting (optional, recommended for code quality):
  - [ ] ESLint config (`.eslintrc.json`)
  - [ ] Prettier config (`.prettierrc`)

### Phase 2: Core Modules (Foundation)

- [ ] **StorageManager**
  - [ ] `loadDecks()` — read from localStorage, parse JSON, handle errors
  - [ ] `saveDecks()` — write to localStorage, catch quota exceeded
  - [ ] `isQuotaNearFull()` — estimate remaining space
  - [ ] Unit tests: load/save/quota
  
- [ ] **DeckManager**
  - [ ] `createDeck()` — new ID, add to AppState
  - [ ] `getAllDecks()`, `getDeck()`
  - [ ] `updateDeckName()`
  - [ ] `deleteDeck()` — remove deck and all cards
  - [ ] `addCard()`, `updateCard()`, `deleteCard()`
  - [ ] All methods call `StorageManager.saveDecks()` after mutation
  - [ ] Unit tests: CRUD operations

- [ ] **ProgressTracker**
  - [ ] `getProgress(deckId)` — calculate % from cards
  - [ ] `markKnown()`, `markReview()` — update card.known, persist
  - [ ] `resetProgress(deckId)` — set all cards.known = false
  - [ ] `getKnownCards()`, `getUnknownCards()`
  - [ ] Unit tests: progress calc, marking

- [ ] **ShuffleEngine**
  - [ ] `shuffle(cards)` — Fisher-Yates, return new array
  - [ ] Unit tests: randomness, no mutation of original

### Phase 3: Study Session & UI Logic

- [ ] **StudySession**
  - [ ] `create(deckId, options)` — instantiate session, optionally shuffle
  - [ ] `getCurrentCard()`, `flip()`, `nextCard()`, `previousCard()`
  - [ ] `markKnown()`, `markReview()` — call ProgressTracker, auto-advance
  - [ ] `exit()` — return summary (total, known count)
  - [ ] Unit tests: navigation, marking, exit state

- [ ] **UIController**
  - [ ] Route handlers: `showHomeScreen()`, `showDeckView()`, `showStudyMode()`
  - [ ] Event listeners: all buttons, forms, keyboard shortcuts
  - [ ] `toast()`, `showModal()` — user feedback
  - [ ] `render()` — re-render active screen
  - [ ] Responsive CSS (mobile-first, then desktop)

### Phase 4: User Interface (HTML & CSS)

- [ ] **Home Screen**
  - [ ] Deck list with name, card count, progress %
  - [ ] "New Deck" button
  - [ ] Delete + Edit buttons per deck
  - [ ] Empty state message

- [ ] **Deck View**
  - [ ] Deck name + card count
  - [ ] Card list (paginated or all)
  - [ ] "Add Card" button
  - [ ] Edit + Delete per card
  - [ ] "Study" button
  - [ ] "Reset Progress" button

- [ ] **Study Mode**
  - [ ] Large card display (front/back)
  - [ ] Flip button / tap-to-flip
  - [ ] "Know It" + "Review Again" buttons
  - [ ] Card counter (e.g., "3/45")
  - [ ] Progress percentage
  - [ ] "Exit Study" button
  - [ ] Exit summary screen (before return to deck)

- [ ] **CSS Styling**
  - [ ] Card flip animation (CSS 3D transform, <500ms)
  - [ ] Responsive grid layout (1-col mobile, 2+ col desktop)
  - [ ] Accessible colors, font sizes, contrast
  - [ ] Loading states (spinners for slow operations, if any)

### Phase 5: Integration & Testing

- [ ] **End-to-End Flows**
  - [ ] Create deck → add cards → study → mark progress → exit → verify saved
  - [ ] Refresh browser → verify all data restored
  - [ ] Delete card → verify removed from Deck view
  - [ ] Reset progress → verify all cards marked unknown

- [ ] **Edge Cases**
  - [ ] Create deck with special characters in name
  - [ ] Add card with very long text (>1000 chars)
  - [ ] Study deck with 1000+ cards (performance test)
  - [ ] Delete deck mid-study session
  - [ ] localStorage quota exceeded (test with fake quota)

- [ ] **Performance Benchmarks**
  - [ ] Home screen render: <500ms (even with 100 decks)
  - [ ] Study mode load: <100ms
  - [ ] Card flip animation: smooth (60 FPS)
  - [ ] Save to localStorage: <50ms

### Phase 6: Deployment & Documentation

- [ ] **Netlify Deploy**
  - [ ] Push to GitHub main branch
  - [ ] Verify auto-deploy triggers
  - [ ] Test live URL: *.netlify.app
  - [ ] Check Lighthouse score (target: >90)

- [ ] **Documentation**
  - [ ] README.md:
    - [ ] How to run locally
    - [ ] How to deploy
    - [ ] Feature list
    - [ ] Browser support
    - [ ] Known limitations
  - [ ] Code comments: JSDoc for all public module methods
  - [ ] Architecture summary (this document, version control)

---

## 10. Readiness Assessment

### ✅ PASS — Ready for Implementation

**Status:** All prerequisites are met. Engineering can start immediately.

### Blockers: None

- ✅ PRD decomposed into 20 clear stories (John complete)
- ✅ Data model finalized (Deck + Card schema)
- ✅ Module interfaces defined (no ambiguity)
- ✅ Tech stack is proven vanilla JS (no experimental tools)
- ✅ Storage strategy is simple (localStorage only)
- ✅ Performance considerations documented (pagination, lazy-load, compression optional)

### Concerns: None

- No third-party API dependencies
- No complex async flows (everything is sync or localStorage fire-and-forget)
- No authentication or server logic (zero DevOps burden)
- No breaking browser compatibility (modern browser support)

### Recommendations for Amelia (Frontend Lead)

1. **Start with Deck Management Stories (1.1–1.5)** — CRUD is foundation. Get data model tested first.

2. **Then Study Mode (2.1–2.5)** — Card flip + marking progress is core UX. Pair with ProgressTracker.

3. **Then Persistence (6.1–6.3)** — Test localStorage save/load thoroughly. Add unit tests.

4. **Then UI Polish (5.1–5.3)** — Responsive design, animations, edge case handling.

5. **Performance (7.1–7.2)** — Pagination for large decks. Test with 1000+ card deck.

### Recommendations for Nico (Infrastructure)

1. **GitHub Repo Setup** — Clone from template, configure branch protection (main), enforce PR reviews.

2. **Netlify Configuration** — Connect repo, set build command to `npm run build` (or just serve static), enable auto-deploy.

3. **Domain Setup** — (Optional v1) Assign custom domain if desired; HTTPS is automatic.

4. **Monitoring** — Set up Netlify analytics; monitor Lighthouse scores post-deploy.

---

## Summary

| Aspect | Decision |
|--------|----------|
| **Framework** | Vanilla JavaScript (ES6+) |
| **Styling** | Vanilla CSS3 + CSS Grid + 3D Transforms |
| **State Management** | In-memory AppState + localStorage |
| **Build Tool** | None (static site) |
| **Deployment** | Netlify + GitHub auto-deploy |
| **Modules** | 6 core modules: Storage, DeckManager, ProgressTracker, ShuffleEngine, StudySession, UIController |
| **Data** | Flat Deck/Card schema stored as JSON in localStorage |
| **Performance** | Pagination for large decks, no virtual scrolling needed yet |
| **Scale** | Handles 1000+ card decks smoothly |

---

**Architecture Designed By:** Winston 🏗️  
**Date:** 2026-04-17 12:40 CDT  
**Ready For:** Amelia (implementation) + Nico (deployment)
