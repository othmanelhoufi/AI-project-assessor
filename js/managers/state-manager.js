/**
 * Application state management
 */
export class StateManager {
  constructor() {
    this.state = {
      assessmentData: {},
      allQuestions: [],
      currentCategoryIndex: 0,
      currentAnswers: {},
      currentResult: null,
      editingId: null
    };
    
    this.listeners = new Map();
  }

  // State getters
  getState(key) {
    return key ? this.state[key] : { ...this.state };
  }

  // State setters with change notification
  setState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this._notifyListeners(key, value, oldValue);
  }

  updateState(updates) {
    for (const [key, value] of Object.entries(updates)) {
      this.setState(key, value);
    }
  }

  // Event system for state changes
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  _notifyListeners(key, newValue, oldValue) {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`Error in state listener for ${key}:`, error);
        }
      });
    }
  }

  // Convenience methods for common operations
  resetAssessment() {
    const updates = {
      currentCategoryIndex: 0,
      currentResult: null,
    };

    // Only reset answers and editingId if not currently editing
    if (!this.state.editingId) {
      updates.currentAnswers = {};
      updates.editingId = null;
    }
    // If we are editing, currentAnswers and editingId are preserved.
    // currentCategoryIndex is always reset to 0 to start from the beginning.

    this.updateState(updates);
  }

  setAnswer(questionId, value) {
    const answers = { ...this.state.currentAnswers };
    answers[questionId] = value;
    this.setState('currentAnswers', answers);
  }

  getCurrentQuestion() {
    const { allQuestions, currentCategoryIndex } = this.state;
    return allQuestions[currentCategoryIndex] || null;
  }

  // NEW METHOD: Helper to get the full current category object
  getCurrentCategory() {
    const { assessmentData, currentCategoryIndex } = this.state;
    return assessmentData.categories?.[currentCategoryIndex] || null;
  }
  
  // REVISED METHOD: canGoNext now checks all questions in the category
  canGoNext() {
    const currentCategory = this.getCurrentCategory();
    if (!currentCategory || !currentCategory.questions) {
      return false;
    }

    // Check if every question in the current category has an answer
    return currentCategory.questions.every(question => {
      const answer = this.state.currentAnswers[question.id];
      return answer !== undefined && answer !== null && answer !== '';
    });
  }

  canGoPrev() {
    return this.state.currentCategoryIndex > 0;
  }

  isComplete() {
    return this.state.currentCategoryIndex >= this.state.allQuestions.length;
  }
}

// Export singleton instance
export const stateManager = new StateManager();
