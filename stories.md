# Flashcard App — User Stories

## Epic 1: Deck Management

### Story 1.1: Create a New Deck
**Description:** Users can create a new deck by entering a name and immediately start adding cards.
**Acceptance Criteria:**
- User clicks "New Deck" button from Home screen
- Modal or form appears with a text input for deck name
- Deck name is required (validation prevents empty submission)
- On submit, new deck is created with unique ID and current timestamp (createdAt)
- New deck appears in the Home deck list immediately after creation
- User is either returned to Home or prompted to add their first card

### Story 1.2: Add a Card to a Deck
**Description:** Users can add new cards to a deck with front (question) and back (answer) text.
**Acceptance Criteria:**
- User navigates to Deck view and clicks "Add Card" button
- Form or modal appears with two text inputs: "Front" and "Back"
- Both fields are required (validation prevents empty submission)
- On submit, card is created with unique ID and `known: false` by default
- New card appears in the deck's card list
- User can add multiple cards in sequence without friction

### Story 1.3: Edit a Card in a Deck
**Description:** Users can modify the front or back text of an existing card.
**Acceptance Criteria:**
- In Deck view, user clicks edit icon/button on a card
- Modal or inline form opens with current front/back text pre-filled
- User can edit either or both fields
- On submit, card is updated in the deck
- Changes persist immediately in the card list
- User can cancel without saving

### Story 1.4: Delete a Card from a Deck
**Description:** Users can remove cards they no longer need to study.
**Acceptance Criteria:**
- In Deck view, user clicks delete icon/button on a card
- Optional confirmation prompt appears (to prevent accidental deletion)
- On confirm, card is removed from the deck
- Card no longer appears in the deck's card list
- Progress tracking still reflects remaining cards

### Story 1.5: Delete an Entire Deck
**Description:** Users can remove a deck they no longer want to use.
**Acceptance Criteria:**
- In Home view, user clicks delete icon/button on a deck
- Confirmation dialog appears (to prevent accidental deletion)
- On confirm, deck and all its cards are permanently removed
- Deck no longer appears in the Home deck list
- localStorage is updated to reflect removal

---

## Epic 2: Study Mode & Card Interaction

### Story 2.1: Start Study Mode
**Description:** Users can begin a study session for a deck to practice cards one at a time.
**Acceptance Criteria:**
- In Deck view, user clicks "Study" or similar button
- Study view loads with the first card displayed (face down or showing only front)
- Card content is clearly readable (adequate font size, contrast)
- A "Done Studying" or "Exit" button is always visible to return to Deck view
- Deck title and current card number (e.g., "Card 3/45") are shown

### Story 2.2: Flip a Card
**Description:** Users can flip cards to see the back (answer) while studying.
**Acceptance Criteria:**
- In Study view, user taps/clicks the card or a "Flip" button
- Card visual flips smoothly (CSS 3D transform animation, <500ms)
- Front text is hidden, back text is fully visible
- User can flip back and forth without limit
- Flip state resets when moving to the next card

### Story 2.3: Mark a Card as "Know It"
**Description:** Users can mark a card as learned to track progress.
**Acceptance Criteria:**
- In Study view (card flipped to show answer), user clicks "Know It" button
- Card is marked with `known: true` in localStorage
- Visual confirmation appears (brief toast, color change, or checkmark)
- Study view automatically advances to the next card (if available) after 500ms delay
- If all cards in session have been reviewed, Study view exits and shows completion summary

### Story 2.4: Mark a Card as "Review Again"
**Description:** Users can flag cards they need more practice on.
**Acceptance Criteria:**
- In Study view (card flipped to show answer), user clicks "Review Again" button
- Card is marked with `known: false` in localStorage
- Visual confirmation appears
- Study view automatically advances to the next card (if available) after 500ms delay
- If all cards in session have been reviewed, Study view exits and shows completion summary

### Story 2.5: Navigate Between Cards During Study
**Description:** Users can move through cards sequentially during a study session.
**Acceptance Criteria:**
- After marking a card, Study view automatically shows the next unreviewed card
- Card number indicator updates (e.g., "Card 4/45")
- Card content is fully visible and readable
- User can manually click "Previous" or "Next" buttons if needed (optional, but nice-to-have)
- Attempting to advance past the last card exits Study mode

---

## Epic 3: Shuffle & Card Order

### Story 3.1: Shuffle Deck Before Study Session
**Description:** Users can randomize card order for each study session to improve retention.
**Acceptance Criteria:**
- In Deck view, before entering Study mode, user sees a "Shuffle" or similar toggle/button
- Toggle is checked/enabled by default (or user clicks "Study Shuffled")
- When Study mode starts, cards appear in random order (different each session)
- Original deck card order remains unchanged in Deck view
- Shuffle state does NOT persist across sessions (fresh randomization each time)

---

## Epic 4: Progress Tracking

### Story 4.1: View Progress Per Deck
**Description:** Users can see what percentage of cards they've marked as "known" in each deck.
**Acceptance Criteria:**
- In Home view, each deck card shows a progress indicator (e.g., "32/100 cards known" or "32%")
- Progress is calculated as: (cards with `known: true`) / (total cards) × 100
- Progress updates immediately after exiting Study mode
- Decks with 0 cards show "0/0 cards"
- Decks with all cards marked "known" show "100%"

### Story 4.2: View Progress During Study Session
**Description:** Users see their current progress within an ongoing study session.
**Acceptance Criteria:**
- In Study view, card counter shows current position (e.g., "Card 3/45")
- Progress percentage or card count is visible (e.g., "Known: 12/45")
- Progress updates in real-time as user marks cards

### Story 4.3: Reset Progress for a Deck
**Description:** Users can reset all "known" flags to start fresh with a deck.
**Acceptance Criteria:**
- In Deck view, user clicks "Reset Progress" or settings menu
- Confirmation dialog appears ("Are you sure?")
- On confirm, all cards in the deck are marked with `known: false`
- Progress percentage resets to 0%
- Cards retain their front/back content (not deleted)

---

## Epic 5: UI Screens & Navigation

### Story 5.1: Home Screen – Deck List
**Description:** Users see all their decks in one place with quick access to create, study, or manage each deck.
**Acceptance Criteria:**
- Home screen displays a list of all existing decks
- Each deck shows: name, card count, progress %, and creation date (optional)
- Decks are sorted by last-accessed or creation date (TBD)
- "New Deck" button is prominent and always visible
- Empty state message appears if no decks exist ("No decks yet. Create one to get started!")
- Clicking a deck name navigates to Deck view
- Each deck has delete and edit buttons

### Story 5.2: Deck View – Card List & Management
**Description:** Users can see all cards in a deck and manage them (add, edit, delete).
**Acceptance Criteria:**
- Deck name appears at top (clickable to edit, optional)
- Card count is shown (e.g., "45 cards total")
- All cards are listed with front text visible (truncated if too long)
- "Add Card" button is prominent
- Each card has edit and delete buttons
- "Study" button initiates Study mode
- "Back" button returns to Home
- Progress % is displayed
- Empty state message appears if deck has 0 cards

### Story 5.3: Study View – Single Card Display
**Description:** Users see one card at a time in a focused, distraction-free interface.
**Acceptance Criteria:**
- Card takes up most of the screen (large, readable text)
- Card shows front text initially (back is hidden)
- Flip button/tap zone is clearly identifiable
- "Know It" and "Review Again" buttons are accessible (e.g., at bottom)
- Card number and progress info are visible (but not dominant)
- "Exit Study" or "Done" button allows early exit back to Deck view
- No distracting UI elements; focus on the card

---

## Epic 6: Data Persistence

### Story 6.1: Save Decks & Cards to localStorage
**Description:** All decks and cards are persisted to browser localStorage automatically.
**Acceptance Criteria:**
- Each time a deck or card is created/updated/deleted, localStorage is immediately updated
- Data is stored under key "decks" as a JSON array
- Data structure matches the PRD schema: `Deck { id, name, createdAt, cards: [{ id, front, back, known }] }`
- localStorage quota is not exceeded (monitored via browser console if applicable)
- No errors occur if localStorage fails (graceful degradation or error message)

### Story 6.2: Load Decks on App Start
**Description:** All user decks and progress are available when they return to the app.
**Acceptance Criteria:**
- On app load, decks are retrieved from localStorage at key "decks"
- Decks are displayed in Home view immediately (no loading delay)
- Progress flags (`known`) are restored for all cards
- If localStorage is empty or missing, user sees empty state (no errors)
- App handles corrupted localStorage gracefully (clears and shows message, optional)

### Story 6.3: Persist Progress Across Sessions
**Description:** Card progress (marked as "known" or "review again") survives browser closes/refreshes.
**Acceptance Criteria:**
- User marks cards as "known" during a study session
- User closes the browser or navigates away
- User returns to the app and navigates to the same deck
- Progress is fully restored (same cards show as "known", progress % matches)
- No data loss on page refresh (F5)

---

## Epic 7: Performance & Edge Cases

### Story 7.1: Handle Large Decks (1000+ Cards)
**Description:** App remains responsive even with very large decks to avoid slowdowns.
**Acceptance Criteria:**
- Deck view can render a deck with 1000+ cards without freezing (all cards listed, paginated or lazy-loaded)
- Study mode loads the first card in <500ms
- localStorage operations complete without lag
- No JavaScript errors in browser console
- Recommendation: lazy-load or paginate card lists if needed (defer to architecture phase)

### Story 7.2: Handle localStorage Limits
**Description:** App gracefully handles browser storage limits and informs user if data cannot be saved.
**Acceptance Criteria:**
- App detects when localStorage quota is exceeded
- Clear error message is shown to user (e.g., "Storage full. Please delete some decks.")
- User can still read existing decks, but cannot create new ones until space is freed
- No silent data loss

---

## Epic 8: Technical Scaffolding (Non-User Stories, but Necessary)

### Story 8.1: Set Up Project & Build Tooling
**Description:** Establish the project structure, framework (React or vanilla JS), and build configuration.
**Acceptance Criteria:**
- GitHub repo is created and accessible
- Project scaffolding (package.json, webpack/vite config, or vanilla HTML) is in place
- `npm run build` successfully produces output (dist/ or build/)
- netlify.toml is configured for SPA routing if needed
- README documents setup and deployment steps

### Story 8.2: Deploy to Netlify
**Description:** App is publicly accessible via Netlify with auto-deployments on push to main.
**Acceptance Criteria:**
- GitHub repo is connected to Netlify
- Deployment is configured to build on push to `main` branch
- App is live at `*.netlify.app` URL
- Pushing to main triggers auto-deploy (verify via Netlify dashboard)
- App loads and functions correctly in production

---

## Summary

**Total:** 20 user stories across 8 epics
- **Deck Management** (5 stories): Core CRUD for decks and cards
- **Study Mode** (5 stories): Card flipping, marking progress, navigation
- **Shuffle & Card Order** (1 story): Randomization for sessions
- **Progress Tracking** (3 stories): Viewing and resetting progress
- **UI Screens** (3 stories): Home, Deck view, Study view
- **Data Persistence** (3 stories): localStorage save/load/restore
- **Performance & Edge Cases** (2 stories): Large decks and quota limits
- **Technical Scaffolding** (2 stories): Project setup and deployment

**Key Constraints:**
- No accounts, subscriptions, or auth (v1)
- No spaced repetition or import/export (v1)
- localStorage only — no server sync (device-locked data)
- CSS transforms for smooth card flip
- Success = smooth UX, persistent progress, instant load

**Handoff:** Engineering can take these stories + acceptance criteria and estimate, design, and build. No ambiguity on what "done" means.
