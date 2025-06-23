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
      // Load assessment data
      await DataService.loadAssessmentData();
      
      // Initialize components
      // REVISED: Pass the wizard controller to the navigation manager
      this.navigationManager.init(this.wizardController); 
      this.wizardController.init();
      this.historyManager.init();
      
      // Set up global event listeners
      this._setupGlobalEvents();
      
      // Handle initial page from URL
      this._handleInitialPage();
      
      console.log('AI Project Assessment App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
      await this._handleInitializationError(error);
    }
  }

  _setupGlobalEvents() {
    // Start assessment button
    const startBtn = document.querySelector(DOM_SELECTORS.wizard.startBtn);
    startBtn?.addEventListener('click', () => {
      // Ensure editingId is cleared when starting a fresh assessment from the main button
      stateManager.setState('editingId', null);
      this.wizardController.startAssessment();
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (event) => {
      this.navigationManager.handlePopState(event);
    });

    // Handle page visibility changes for auto-save
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._autoSave();
      }
    });
  }

  _handleInitialPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page') || 'assessment';
    this.navigationManager.showPage(page);
  }

  _autoSave() {
    const { currentAnswers, editingId } = stateManager.getState();
    if (Object.keys(currentAnswers).length > 0) {
      // Auto-save current progress
      console.log('Auto-saving progress...');
      // Could implement auto-save logic here
    }
  }

  async _handleInitializationError(error) {
    await ModalManager.showAlert(
      'There was an error loading the application. Please refresh the page and try again.',
      'Initialization Error',
      '⚠️'
    );
  }

  // Public methods for global access
  setAnswer(questionId, value) {
    this.wizardController.setAnswer(questionId, value);
  }

  deleteAssessment(id) {
    return this.historyManager.deleteAssessment(id);
  }

  editAssessment(id) {
    return this.historyManager.editAssessment(id);
  }

  reviewAssessment(id) {
    return this.historyManager.reviewAssessment(id);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new AIProjectAssessmentApp();
  app.init();
  
  // Make app available globally for HTML onclick handlers
  window.assessmentApp = app;
});
