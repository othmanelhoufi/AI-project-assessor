/**
 * Progress tracking and navigation component
 */
import { DOM_SELECTORS } from '../config/dom-selectors.js';
import { stateManager } from '../managers/state-manager.js';

export class ProgressTracker {
  constructor() {
    this.elements = {
      bar: document.querySelector(DOM_SELECTORS.progress.bar),
      text: document.querySelector(DOM_SELECTORS.progress.text),
      percentage: document.querySelector(DOM_SELECTORS.progress.percentage)
    };
  }

  init() {
    stateManager.subscribe('assessmentData', () => this.updateProgress());
  }

  updateProgress() {
    const { currentAnswers, allQuestions, assessmentData, currentCategoryIndex } = stateManager.getState();
    
    if (!allQuestions || allQuestions.length === 0) return;

    const answeredQuestions = Object.keys(currentAnswers).length;
    const totalQuestions = allQuestions.length;
    const progressPercent = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    
    const categoryName = assessmentData.categories?.[currentCategoryIndex]?.name || '';
    
    if (this.elements.bar) {
      this.elements.bar.style.width = `${progressPercent}%`;
    }

    if (this.elements.text) {
      this.elements.text.textContent = `Current Section: ${categoryName}`;
    }

    if (this.elements.percentage) {
      this.elements.percentage.textContent = `${progressPercent}% Complete`;
    }
  }

  show() {
    const container = document.querySelector(DOM_SELECTORS.wizard.progressContainer);
    container?.classList.remove('hidden');
  }

  hide() {
    const container = document.querySelector(DOM_SELECTORS.wizard.progressContainer);
    container?.classList.add('hidden');
  }
}