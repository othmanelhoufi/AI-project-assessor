/**
 * Wizard flow and question management
 */
import { DOM_SELECTORS } from '../config/dom-selectors.js';
import { CONSTANTS } from '../config/constants.js';
import { stateManager } from '../managers/state-manager.js';
import { ProgressTracker } from './progress-tracker.js';
import { ResultRenderer } from './result-renderer.js';
import { AssessmentService } from '../services/assessment-service.js';
import { ModalManager } from './modal-manager.js';
import { StorageService } from '../services/storage-service.js';
import { QuestionRenderer } from './question-renderer.js'; // Import the new renderer

export class WizardController {
  constructor() {
    this.progressTracker = new ProgressTracker();
    this.resultRenderer = new ResultRenderer();
    
    this.elements = {
      container: document.querySelector(DOM_SELECTORS.wizard.container),
      start: document.querySelector(DOM_SELECTORS.wizard.start),
      questionContainer: document.querySelector(DOM_SELECTORS.wizard.questionContainer),
      navigation: document.querySelector(DOM_SELECTORS.wizard.navigation),
      resultContainer: document.querySelector(DOM_SELECTORS.wizard.resultContainer),
      prevBtn: document.querySelector(DOM_SELECTORS.buttons.prev),
      nextBtn: document.querySelector(DOM_SELECTORS.buttons.next),
      startOverNavBtn: document.querySelector(DOM_SELECTORS.buttons.startOverNav),
      startOverResultBtn: document.querySelector(DOM_SELECTORS.buttons.startOverResult),
      saveBtn: document.querySelector(DOM_SELECTORS.buttons.saveAssessment)
    };
  }

  init() {
    this.progressTracker.init();
    this._setupEventListeners();
    this._setupStateSubscriptions();
  }

  _setupEventListeners() {
    this.elements.prevBtn?.addEventListener('click', () => this.goToPrevious());
    this.elements.nextBtn?.addEventListener('click', () => this.goToNext());
    this.elements.startOverNavBtn?.addEventListener('click', () => this.startOver());
    this.elements.startOverResultBtn?.addEventListener('click', () => this.startOver());
    this.elements.saveBtn?.addEventListener('click', () => this.saveAssessment());
  }

  _setupStateSubscriptions() {
    stateManager.subscribe('currentCategoryIndex', () => this._updateNavigation());
    stateManager.subscribe('currentAnswers', () => {
        this.progressTracker.updateProgress();
        this._updateCategoryStyles();
        this._updateNavigation();
    });
  }

  startAssessment() {
    this._showWizardStep('question');
    this.progressTracker.show();
    this._renderCurrentCategory();
  }

  goToNext() {
    const { currentCategoryIndex, assessmentData } = stateManager.getState();
    const totalCategories = assessmentData.categories?.length || 0;

    if (currentCategoryIndex >= totalCategories - 1) {
      this._completeAssessment();
    } else {
      stateManager.setState('currentCategoryIndex', currentCategoryIndex + 1);
      this._renderCurrentCategory();
    }
  }

  goToPrevious() {
    const { currentCategoryIndex } = stateManager.getState();

    if (currentCategoryIndex > 0) {
      stateManager.setState('currentCategoryIndex', currentCategoryIndex - 1);
      this._renderCurrentCategory();
    }
  }

  startOver() {
    stateManager.setState('editingId', null);
    stateManager.resetAssessment();
    this._showWizardStep('start');
    this.progressTracker.hide();
  }

  async saveAssessment() {
    const assessmentName = stateManager.getState('editingId') 
      ? StorageService.loadSavedAssessments().find(a => a.id === stateManager.getState('editingId'))?.name 
      : 'My AI Project Assessment';

    const name = await ModalManager.showPrompt(
      'Enter a name for this assessment:',
      'Save Assessment',
      'e.g., Customer Churn Prediction Model',
      assessmentName
    );
    
    if (!name) return;
    
    const assessment = {
      id: stateManager.getState('editingId') || Date.now().toString(),
      name: name,
      date: new Date().toISOString(),
      answers: stateManager.getState('currentAnswers'),
      result: stateManager.getState('currentResult')
    };
    
    const success = StorageService.saveAssessment(assessment);
    
    if (success) {
      await ModalManager.showAlert('Assessment saved successfully!', 'Success', '✅');
      stateManager.setState('editingId', assessment.id);
      stateManager.emit('assessment-saved');
    } else {
      await ModalManager.showAlert('Failed to save assessment. Please try again.', 'Error', '❌');
    }
  }

  _renderCurrentCategory() {
    const currentCategory = stateManager.getCurrentCategory();
    if (!currentCategory) return;

    const { currentAnswers } = stateManager.getState();
    const questions = currentCategory.questions || [];

    // Header for the category
    const headerHtml = `
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 class="text-xl md:text-2xl font-bold text-gray-900">${currentCategory.name}</h2>
        <p class="mt-2 text-gray-600">${currentCategory.description || ''}</p>
      </div>
    `;

    // Render each question using the dedicated renderer
    const questionsHtml = questions.map(question => {
      const answer = currentAnswers[question.id];
      return QuestionRenderer.render(question, answer);
    }).join('');

    this.elements.questionContainer.innerHTML = headerHtml + `<div class="space-y-6">${questionsHtml}</div>`;
    window.scrollTo(0, 0);
  }

  async _completeAssessment() {
    this.progressTracker.hide();
    this._showWizardStep('result');
    
    this.elements.startOverResultBtn?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
    this.elements.saveBtn?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);

    this.resultRenderer.renderLoading();

    const result = await AssessmentService.generateResult();
    stateManager.setState('currentResult', result);
    
    this.resultRenderer.render(result);
    
    this.elements.startOverResultBtn?.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
    this.elements.saveBtn?.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
  }

  _showWizardStep(step) {
    this.elements.start?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
    this.elements.questionContainer?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
    this.elements.navigation?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
    this.elements.resultContainer?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);

    switch (step) {
      case 'start':
        this.elements.start?.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
        break;
      case 'question':
        this.elements.questionContainer?.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
        this.elements.navigation?.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
        break;
      case 'result':
        this.elements.resultContainer?.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
        break;
    }
  }

  _updateNavigation() {
    if (!this.elements.prevBtn || !this.elements.nextBtn) return;
    
    const canPrev = stateManager.canGoPrev();
    const canNext = stateManager.canGoNext();
    const { currentCategoryIndex, assessmentData } = stateManager.getState();
    const totalCategories = assessmentData.categories?.length || 0;
    const isLastCategory = currentCategoryIndex >= totalCategories - 1;

    this.elements.prevBtn.disabled = !canPrev;
    this.elements.prevBtn.classList.toggle('opacity-50', !canPrev);
    
    this.elements.nextBtn.disabled = !canNext;
    this.elements.nextBtn.classList.toggle('opacity-50', !canNext);
    
    if (isLastCategory) {
        this.elements.nextBtn.innerHTML = 'Complete Assessment';
    } else {
        this.elements.nextBtn.innerHTML = `Next <svg class="h-5 w-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;
    }
  }

  _updateCategoryStyles() {
    const currentCategory = stateManager.getCurrentCategory();
    if (!currentCategory || !currentCategory.questions) return;
    
    const { currentAnswers } = stateManager.getState();

    currentCategory.questions.forEach(question => {
      const card = document.getElementById(`question-card-${question.id}`);
      if (!card) return;

      const answer = currentAnswers[question.id];
      let isAnswered = false;

      if (question.type === 'textarea') {
          isAnswered = answer && answer.trim().length > 0;
          
          const charCountEl = document.getElementById(`char-count-${question.id}`);
          if(charCountEl) {
              const currentLength = answer?.length || 0;
              const minLength = 300;
              const lengthColor = currentLength >= minLength ? 'text-green-600' : 'text-red-600';
              charCountEl.className = `text-right text-sm mt-2 ${lengthColor}`;
              charCountEl.textContent = `${currentLength} / ${minLength} characters minimum`;
          }
      } else {
          isAnswered = answer !== undefined && answer !== null && answer !== '';
      }
      
      if (isAnswered) {
        card.classList.remove('border-gray-300', 'bg-white');
        card.classList.add('border-green-400', 'bg-green-50');
      } else {
        card.classList.remove('border-green-400', 'bg-green-50');
        card.classList.add('border-gray-300', 'bg-white');
      }
    });
  }

  setAnswer(questionId, value) {
    stateManager.setAnswer(questionId, value);
  }
}