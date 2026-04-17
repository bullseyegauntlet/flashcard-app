// Flashcard App - Main Logic
// Stores decks and cards in localStorage

class FlashcardApp {
  constructor() {
    this.decks = this.loadDecks();
    this.currentDeck = null;
    this.currentCardIndex = 0;
    this.init();
  }

  loadDecks() {
    const stored = localStorage.getItem('flashcard-decks');
    return stored ? JSON.parse(stored) : {};
  }

  saveDecks() {
    localStorage.setItem('flashcard-decks', JSON.stringify(this.decks));
  }

  createDeck(name) {
    if (!this.decks[name]) {
      this.decks[name] = [];
      this.saveDecks();
      this.render();
    }
  }

  addCard(deckName, front, back) {
    if (this.decks[deckName]) {
      this.decks[deckName].push({ front, back, learned: false });
      this.saveDecks();
      this.render();
    }
  }

  init() {
    this.render();
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = '<p>Flashcard App initialized! This is a placeholder.</p>';
  }
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new FlashcardApp();
});
