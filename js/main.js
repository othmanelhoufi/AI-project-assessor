/**
 * Main application initialization
 */
import { stateManager } from './managers/state-manager.js';
import { NavigationManager } from './managers/navigation-manager.js';
import { WizardController } from './components/wizard-controller.js';
import { HistoryManager } from './managers/history-manager.js';
import { DataService } from './services/data-service.js';
import { ModalManager } from './components/modal-manager.js';
import { DOM_SELECTORS } from './config/dom-selectors.js';

class AIProjectAssessmentApp {
  constructor() {
    this.navigationManager = new NavigationManager();
    this.wizardController = new WizardController();
    this.historyManager = new HistoryManager();
  }

  async init() {
    try {
      await DataService.loadAssessmentData();
      
      this.navigationManager.init(this.wizardController); 
      this.wizardController.init();
      this.historyManager.init();
      
      this._setupGlobalEvents();
      this._handleInitialPage();
      
      console.log('AI Project Assessment App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
      await this._handleInitializationError(error);
    }
  }

  _setupGlobalEvents() {
    const startBtn = document.querySelector(DOM_SELECTORS.wizard.startBtn);
    startBtn?.addEventListener('click', () => {
      stateManager.setState('editingId', null);
      this.wizardController.startAssessment();
    });

    window.addEventListener('popstate', (event) => {
      this.navigationManager.handlePopState(event);
    });
  }

  _handleInitialPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page') || 'assessment';
    this.navigationManager.showPage(page, true); // Pass true to avoid pushing state on initial load
  }

  async _handleInitializationError(error) {
    const container = document.querySelector('#wizardContainer') || document.body;
    container.innerHTML = `<div class="p-8 text-center text-red-600">
        <h3 class="text-xl font-semibold">Application Failed to Load</h3>
        <p class="mt-2 text-gray-700">Could not load critical assessment data. Please check your connection and refresh the page.</p>
        <p class="mt-1 text-sm text-gray-500">${error.message}</p>
    </div>`;
  }

  // Public methods for global access from HTML onclick handlers
  setAnswer(questionId, value) {
    this.wizardController.setAnswer(questionId, value);
  }

  deleteAssessment(id) {
    return this.historyManager.deleteAssessment(id);
  }

  editAssessment(id) {
    return this.historyManager.editAssessment(id);
  }

  /**
   * UPDATED: Expose the reviewAssessment method globally.
   */
  reviewAssessment(id) {
    return this.historyManager.reviewAssessment(id);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new AIProjectAssessmentApp();
  // Make app available globally for HTML onclick handlers
  window.assessmentApp = app;
  app.init();
});
