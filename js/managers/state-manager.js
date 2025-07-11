/**
 * Application state management with event bus
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
    this.eventBus = new Map(); // For general-purpose events
  }

  // --- State Management ---
  getState(key) {
    return key ? this.state[key] : { ...this.state };
  }

  setState(key, value) {
    const oldValue = this.state[key];
    if (oldValue === value) return; // No change
    this.state[key] = value;
    this._notifyStateListeners(key, value, oldValue);
  }

  updateState(updates) {
    for (const [key, value] of Object.entries(updates)) {
      this.setState(key, value);
    }
  }

  // --- State Subscription ---
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    return () => this.listeners.get(key)?.delete(callback);
  }

  _notifyStateListeners(key, newValue, oldValue) {
    this.listeners.get(key)?.forEach(callback => {
      try {
        callback(newValue, oldValue);
      } catch (error) {
        console.error(`Error in state listener for ${key}:`, error);
      }
    });
  }
  
  // --- Event Bus ---
  on(eventName, callback) {
    if (!this.eventBus.has(eventName)) {
      this.eventBus.set(eventName, new Set());
    }
    this.eventBus.get(eventName).add(callback);
    
    return () => this.eventBus.get(eventName)?.delete(callback);
  }
  
  emit(eventName, payload) {
    this.eventBus.get(eventName)?.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    });
  }

  // --- Assessment Logic & Selectors ---
  resetAssessment() {
    this.updateState({
      currentCategoryIndex: 0,
      currentAnswers: {},
      currentResult: null,
      editingId: null
    });
  }

  setAnswer(questionId, value) {
    const answers = { ...this.state.currentAnswers };
    answers[questionId] = value;
    this.setState('currentAnswers', answers);
  }

  getCurrentCategory() {
    return this.state.assessmentData.categories?.[this.state.currentCategoryIndex] || null;
  }
  
  canGoNext() {
    const currentCategory = this.getCurrentCategory();
    if (!currentCategory?.questions) return false;

    return currentCategory.questions.every(question => {
      const answer = this.state.currentAnswers[question.id];
      if (question.type === 'textarea') {
        return answer && answer.trim().length >= 300;
      }
      return answer !== undefined && answer !== null && answer !== '';
    });
  }

  canGoPrev() {
    return this.state.currentCategoryIndex > 0;
  }

  isComplete() {
    const totalCategories = this.state.assessmentData.categories?.length || 0;
    return this.state.currentCategoryIndex >= totalCategories;
  }
}

export const stateManager = new StateManager();