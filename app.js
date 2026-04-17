// ============================================================================
// FLASHCARD APP - STORY 1: DECK MANAGEMENT
// ============================================================================

// MODULE: StorageManager
// Responsibility: Persist and restore decks to/from localStorage
const StorageManager = {
  STORAGE_KEY: 'decks',
  QUOTA_WARNING_KEY: 'quotaWarning',

  loadDecks() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      // Validate schema before returning
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        console.warn('Invalid schema in localStorage; resetting to empty.');
        return [];
      }

      // Basic validation: ensure each deck has required fields
      return parsed.filter(deck => 
        deck.id && deck.name && Array.isArray(deck.cards)
      );
    } catch (e) {
      console.error('Error loading decks from localStorage:', e);
      return [];
    }
  },

  saveDecks(decks) {
    try {
      if (!Array.isArray(decks)) {
        console.error('saveDecks received non-array:', decks);
        return false;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(decks));
      localStorage.removeItem(this.QUOTA_WARNING_KEY); // Clear any prior warning
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
        localStorage.setItem(this.QUOTA_WARNING_KEY, 'true');
        alert('Storage quota exceeded. Please delete some decks or cards to make space.');
      } else {
        console.error('Error saving decks to localStorage:', e);
      }
      return false;
    }
  },

  isQuotaNearFull() {
    try {
      const testKey = '__quota_test__';
      const testValue = new Array(1024).fill('x').join(''); // 1KB test
      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);
      return false;
    } catch (e) {
      return true;
    }
  },

  getStorageStats() {
    try {
      const used = new Blob(
        Object.values(localStorage).map(v => v.toString())
      ).size;
      return {
        usedBytes: used,
        estimatedPercent: (used / (5 * 1024 * 1024)) * 100 // Assume 5MB limit
      };
    } catch (e) {
      return null;
    }
  },

  clearAll() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.QUOTA_WARNING_KEY);
  }
};

// MODULE: DeckManager
// Responsibility: CRUD operations on decks and cards
const DeckManager = {
  decks: [],

  init() {
    this.decks = StorageManager.loadDecks();
  },

  _generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  createDeck(name) {
    if (!name || !name.trim()) {
      alert('Deck name is required.');
      return null;
    }

    const newDeck = {
      id: this._generateId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      cards: []
    };

    this.decks.push(newDeck);
    StorageManager.saveDecks(this.decks);
    return newDeck;
  },

  addCard(deckId, front, back) {
    if (!front || !front.trim() || !back || !back.trim()) {
      alert('Both front and back text are required.');
      return null;
    }

    const deck = this.decks.find(d => d.id === deckId);
    if (!deck) {
      console.error('Deck not found:', deckId);
      return null;
    }

    const newCard = {
      id: this._generateId(),
      front: front.trim(),
      back: back.trim(),
      known: false
    };

    deck.cards.push(newCard);
    StorageManager.saveDecks(this.decks);
    return newCard;
  },

  editCard(deckId, cardId, front, back) {
    if (!front || !front.trim() || !back || !back.trim()) {
      alert('Both front and back text are required.');
      return null;
    }

    const deck = this.decks.find(d => d.id === deckId);
    if (!deck) {
      console.error('Deck not found:', deckId);
      return null;
    }

    const card = deck.cards.find(c => c.id === cardId);
    if (!card) {
      console.error('Card not found:', cardId);
      return null;
    }

    card.front = front.trim();
    card.back = back.trim();
    StorageManager.saveDecks(this.decks);
    return card;
  },

  deleteCard(deckId, cardId) {
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck) {
      console.error('Deck not found:', deckId);
      return false;
    }

    const index = deck.cards.findIndex(c => c.id === cardId);
    if (index === -1) {
      console.error('Card not found:', cardId);
      return false;
    }

    deck.cards.splice(index, 1);
    StorageManager.saveDecks(this.decks);
    return true;
  },

  deleteDeck(deckId) {
    const index = this.decks.findIndex(d => d.id === deckId);
    if (index === -1) {
      console.error('Deck not found:', deckId);
      return false;
    }

    this.decks.splice(index, 1);
    StorageManager.saveDecks(this.decks);
    return true;
  },

  getDeckById(deckId) {
    return this.decks.find(d => d.id === deckId);
  },

  getAllDecks() {
    return this.decks;
  }
};

// MODULE: ShuffleEngine
// Responsibility: Randomize card order for study sessions
const ShuffleEngine = {
  shuffle(array) {
    // Fisher-Yates shuffle algorithm
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
};

// MODULE: StudySession
// Responsibility: Manage study mode state and card progression
const StudySession = {
  deckId: null,
  cards: [],
  currentCardIndex: 0,
  isFlipped: false,
  isAnswered: false,
  isShuffle: false,

  start(deckId, shouldShuffle = false) {
    const deck = DeckManager.getDeckById(deckId);
    if (!deck || deck.cards.length === 0) {
      alert('Deck is empty. Add some cards first.');
      return false;
    }

    this.deckId = deckId;
    let cardsCopy = [...deck.cards]; // Copy cards for this session
    
    // Apply shuffle if requested
    if (shouldShuffle) {
      cardsCopy = ShuffleEngine.shuffle(cardsCopy);
    }

    this.cards = cardsCopy;
    this.isShuffle = shouldShuffle;
    this.currentCardIndex = 0;
    this.isFlipped = false;
    this.isAnswered = false;
    return true;
  },

  getCurrentCard() {
    if (this.currentCardIndex >= this.cards.length) {
      return null;
    }
    return this.cards[this.currentCardIndex];
  },

  flip() {
    this.isFlipped = !this.isFlipped;
  },

  markKnown() {
    const card = this.getCurrentCard();
    if (!card) return;

    // Update card in DeckManager
    DeckManager.editCard(this.deckId, card.id, card.front, card.back);
    DeckManager.decks.find(d => d.id === this.deckId)
      .cards.find(c => c.id === card.id).known = true;
    StorageManager.saveDecks(DeckManager.decks);

    this.isAnswered = true;
    return true;
  },

  markReview() {
    const card = this.getCurrentCard();
    if (!card) return;

    // Ensure known=false (already is, but be explicit)
    DeckManager.decks.find(d => d.id === this.deckId)
      .cards.find(c => c.id === card.id).known = false;
    StorageManager.saveDecks(DeckManager.decks);

    this.isAnswered = true;
    return true;
  },

  advance() {
    this.currentCardIndex++;
    this.isFlipped = false;
    this.isAnswered = false;
  },

  isComplete() {
    return this.currentCardIndex >= this.cards.length;
  },

  getProgress() {
    return {
      current: this.currentCardIndex + 1,
      total: this.cards.length,
      percent: Math.round((this.currentCardIndex / this.cards.length) * 100)
    };
  },

  end() {
    this.deckId = null;
    this.cards = [];
    this.currentCardIndex = 0;
    this.isFlipped = false;
    this.isAnswered = false;
  }
};

// MODULE: UIController
// Responsibility: Render UI and handle user interactions
const UIController = {
  currentView: 'home',
  selectedDeckId: null,
  editingCardId: null,
  toast: null,

  render() {
    const app = document.getElementById('app');

    if (this.currentView === 'home') {
      this.renderHomeScreen(app);
    } else if (this.currentView === 'deck') {
      this.renderDeckScreen(app);
    } else if (this.currentView === 'study') {
      this.renderStudyScreen(app);
    } else if (this.currentView === 'study-complete') {
      this.renderStudyCompleteScreen(app);
    }
  },

  renderHomeScreen(app) {
    const decks = DeckManager.getAllDecks();

    let html = `
      <div class="home-screen">
        <h1>📚 Flashcard App</h1>
        <button class="btn btn-primary" onclick="UIController.showNewDeckForm()">+ New Deck</button>
    `;

    if (decks.length === 0) {
      html += '<p class="empty-state">No decks yet. Create one to get started!</p>';
    } else {
      html += '<div class="deck-list">';
      decks.forEach(deck => {
        const cardCount = deck.cards.length;
        const knownCount = deck.cards.filter(c => c.known).length;
        html += `
          <div class="deck-card">
            <div class="deck-info">
              <h3>${this.escapeHtml(deck.name)}</h3>
              <p>${cardCount} cards | ${knownCount} known</p>
            </div>
            <div class="deck-actions">
              <button class="btn btn-small" onclick="UIController.viewDeck('${deck.id}')">Study</button>
              <button class="btn btn-small btn-edit" onclick="UIController.viewDeck('${deck.id}')">Manage</button>
              <button class="btn btn-small btn-danger" onclick="UIController.confirmDeleteDeck('${deck.id}')">Delete</button>
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    html += '</div>';
    app.innerHTML = html;
  },

  renderDeckScreen(app) {
    const deck = DeckManager.getDeckById(this.selectedDeckId);
    if (!deck) {
      this.currentView = 'home';
      this.render();
      return;
    }

    let html = `
      <div class="deck-screen">
        <div class="deck-header">
          <button class="btn btn-secondary" onclick="UIController.backToHome()">&larr; Back</button>
          <h1>${this.escapeHtml(deck.name)}</h1>
          <p>${deck.cards.length} cards</p>
        </div>

        <div class="deck-actions">
          <button class="btn btn-primary" onclick="UIController.showAddCardForm()">+ Add Card</button>
          <div class="study-controls">
            <label class="checkbox-label">
              <input type="checkbox" id="shuffle-toggle" onchange="UIController.updateShuffleState()">
              🔀 Shuffle
            </label>
            <button class="btn btn-study" onclick="UIController.startStudyWithOptions('${deck.id}')">📖 Study Deck</button>
          </div>
        </div>
    `;

    if (deck.cards.length === 0) {
      html += '<p class="empty-state">No cards yet. Add some to get started!</p>';
    } else {
      html += '<div class="card-list">';
      deck.cards.forEach(card => {
        const knownBadge = card.known ? '<span class="badge badge-known">✓ Known</span>' : '<span class="badge">Not reviewed</span>';
        html += `
          <div class="card-item">
            <div class="card-content">
              <strong>Q:</strong> ${this.escapeHtml(card.front)}<br/>
              <strong>A:</strong> ${this.escapeHtml(card.back)}
              <div class="card-status">${knownBadge}</div>
            </div>
            <div class="card-actions">
              <button class="btn btn-small btn-edit" onclick="UIController.showEditCardForm('${card.id}')">Edit</button>
              <button class="btn btn-small btn-danger" onclick="UIController.confirmDeleteCard('${card.id}')">Delete</button>
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    html += '</div>';
    app.innerHTML = html;
  },

  showNewDeckForm() {
    const name = prompt('Enter deck name:');
    if (name !== null) {
      DeckManager.createDeck(name);
      this.render();
    }
  },

  showAddCardForm() {
    const front = prompt('Enter card front (question):');
    if (front === null) return;

    const back = prompt('Enter card back (answer):');
    if (back === null) return;

    DeckManager.addCard(this.selectedDeckId, front, back);
    this.render();
  },

  showEditCardForm(cardId) {
    this.editingCardId = cardId;
    const deck = DeckManager.getDeckById(this.selectedDeckId);
    const card = deck.cards.find(c => c.id === cardId);

    const front = prompt('Edit front (question):', card.front);
    if (front === null) return;

    const back = prompt('Edit back (answer):', card.back);
    if (back === null) return;

    DeckManager.editCard(this.selectedDeckId, cardId, front, back);
    this.editingCardId = null;
    this.render();
  },

  confirmDeleteCard(cardId) {
    if (confirm('Delete this card?')) {
      DeckManager.deleteCard(this.selectedDeckId, cardId);
      this.render();
    }
  },

  confirmDeleteDeck(deckId) {
    if (confirm('Delete this entire deck? This cannot be undone.')) {
      DeckManager.deleteDeck(deckId);
      this.render();
    }
  },

  viewDeck(deckId) {
    this.currentView = 'deck';
    this.selectedDeckId = deckId;
    this.render();
  },

  backToHome() {
    this.currentView = 'home';
    this.selectedDeckId = null;
    this.render();
  },

  renderStudyScreen(app) {
    const card = StudySession.getCurrentCard();
    const progress = StudySession.getProgress();
    const deck = DeckManager.getDeckById(StudySession.deckId);

    if (!card) {
      this.currentView = 'study-complete';
      this.render();
      return;
    }

    const cardClass = StudySession.isFlipped ? 'flipped' : '';
    const knownCountInDeck = deck.cards.filter(c => c.known).length;

    let html = `
      <div class="study-screen">
        <div class="study-header">
          <button class="btn btn-secondary" onclick="UIController.exitStudy()">&larr; Exit</button>
          <h2>${this.escapeHtml(deck.name)} - Study Mode</h2>
          <div class="study-progress">
            Card ${progress.current}/${progress.total}
            | ${knownCountInDeck}/${deck.cards.length} known (${Math.round((knownCountInDeck / deck.cards.length) * 100)}%)
          </div>
        </div>

        <div class="study-container">
          <div class="card-container ${cardClass}" onclick="UIController.flipCard()">
            <div class="card-inner">
              <div class="card-front">
                <p>${this.escapeHtml(card.front)}</p>
                <p class="card-hint">Click to reveal answer</p>
              </div>
              <div class="card-back">
                <p>${this.escapeHtml(card.back)}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="study-actions">
          ${!StudySession.isFlipped ? `
            <p class="text-center">Click the card to flip and see the answer.</p>
          ` : `
            <button class="btn btn-danger btn-lg" onclick="UIController.reviewAgain()">📌 Review Again</button>
            <button class="btn btn-primary btn-lg" onclick="UIController.markKnown()">✓ Know It!</button>
          `}
        </div>
      </div>
    `;

    app.innerHTML = html;
  },

  renderStudyCompleteScreen(app) {
    const deck = DeckManager.getDeckById(StudySession.deckId);
    const knownCount = deck.cards.filter(c => c.known).length;
    const total = deck.cards.length;
    const percent = Math.round((knownCount / total) * 100);

    let html = `
      <div class="study-complete-screen">
        <div class="complete-card">
          <h1>🎉 Study Complete!</h1>
          <p>Deck: <strong>${this.escapeHtml(deck.name)}</strong></p>
          <div class="complete-stats">
            <div class="stat">
              <span class="stat-label">Cards Studied:</span>
              <span class="stat-value">${total}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Cards Known:</span>
              <span class="stat-value" style="color: #4CAF50;">${knownCount}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Progress:</span>
              <span class="stat-value">${percent}%</span>
            </div>
          </div>
          <div class="complete-actions">
            <button class="btn btn-primary btn-lg" onclick="UIController.startStudy('${StudySession.deckId}')">
              Study Again
            </button>
            <button class="btn btn-secondary btn-lg" onclick="UIController.backToHome()">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    `;

    app.innerHTML = html;
  },

  flipCard() {
    if (StudySession.isAnswered) return; // Prevent flipping after answering
    StudySession.flip();
    this.render();
  },

  startStudy(deckId) {
    if (StudySession.start(deckId)) {
      this.currentView = 'study';
      this.selectedDeckId = deckId;
      this.render();
    }
  },

  startStudyWithOptions(deckId) {
    const shuffleToggle = document.getElementById('shuffle-toggle');
    const shouldShuffle = shuffleToggle ? shuffleToggle.checked : false;
    
    if (StudySession.start(deckId, shouldShuffle)) {
      this.currentView = 'study';
      this.selectedDeckId = deckId;
      this.render();
    }
  },

  updateShuffleState() {
    // Just toggle checkbox state; actual shuffle happens on study start
  },

  markKnown() {
    StudySession.markKnown();
    this.showToast('✓ Marked as known!', 'success');
    
    setTimeout(() => {
      StudySession.advance();
      this.currentView = StudySession.isComplete() ? 'study-complete' : 'study';
      this.render();
    }, 500);
  },

  reviewAgain() {
    StudySession.markReview();
    this.showToast('📌 Marked for review', 'info');
    
    setTimeout(() => {
      StudySession.advance();
      this.currentView = StudySession.isComplete() ? 'study-complete' : 'study';
      this.render();
    }, 500);
  },

  exitStudy() {
    if (confirm('Exit study mode? Progress will be saved.')) {
      StudySession.end();
      this.currentView = 'deck';
      this.render();
    }
  },

  showToast(message, type = 'info') {
    const app = document.getElementById('app');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    app.appendChild(toast);

    setTimeout(() => toast.remove(), 2000);
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// MAIN APP
class FlashcardApp {
  constructor() {
    DeckManager.init();
    UIController.render();
  }
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new FlashcardApp();
});
