// ============================================================================
// FLASHCARD APP - STORY 1: DECK MANAGEMENT
// ============================================================================

// MODULE: StorageManager
// Responsibility: Persist and restore decks to/from localStorage
const StorageManager = {
  loadDecks() {
    try {
      const stored = localStorage.getItem('decks');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading decks:', e);
      return [];
    }
  },

  saveDecks(decks) {
    try {
      localStorage.setItem('decks', JSON.stringify(decks));
      return true;
    } catch (e) {
      console.error('Error saving decks:', e);
      alert('Storage quota exceeded. Please delete some decks.');
      return false;
    }
  },

  isQuotaNearFull() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return false;
    } catch (e) {
      return true;
    }
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

// MODULE: UIController
// Responsibility: Render UI and handle user interactions
const UIController = {
  currentView: 'home',
  selectedDeckId: null,
  editingCardId: null,

  render() {
    const app = document.getElementById('app');

    if (this.currentView === 'home') {
      this.renderHomeScreen(app);
    } else if (this.currentView === 'deck') {
      this.renderDeckScreen(app);
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
