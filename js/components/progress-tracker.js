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
    // Subscribe to state changes
    stateManager.subscribe('currentCategoryIndex', () => this.updateProgress());
    stateManager.subscribe('assessmentData', () => this.updateProgress()); // Subscribe to data loading
  }

  // REVISED METHOD: Update progress based on categories
  updateProgress() {
    const { currentCategoryIndex, assessmentData } = stateManager.getState();
    const categories = assessmentData.categories || [];
    const totalCategories = categories.length;

    if (!totalCategories) return;

    const progressPercent = Math.round((currentCategoryIndex / totalCategories) * 100);
    const currentStep = currentCategoryIndex + 1;

    // Update progress bar
    if (this.elements.bar) {
      this.elements.bar.style.width = `${progressPercent}%`;
    }

    // Update text
    if (this.elements.text) {
      this.elements.text.textContent = `Section ${currentStep} of ${totalCategories}: ${categories[currentCategoryIndex]?.name || ''}`;
    }

    // Update percentage
    if (this.elements.percentage) {
      this.elements.percentage.textContent = `${progressPercent}%`;
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
