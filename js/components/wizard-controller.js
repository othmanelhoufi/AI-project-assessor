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
      startOverBtn: document.querySelector(DOM_SELECTORS.buttons.startOver),
      // --- [FIX 1] --- Add the missing save button element reference ---
      saveBtn: document.querySelector(DOM_SELECTORS.buttons.saveAssessment)
    };
  }

  init() {
    this.progressTracker.init();
    this.resultRenderer.init();
    this._setupEventListeners();
    this._setupStateSubscriptions();
  }

  _setupEventListeners() {
    this.elements.prevBtn?.addEventListener('click', () => this.goToPrevious());
    this.elements.nextBtn?.addEventListener('click', () => this.goToNext());
    this.elements.startOverBtn?.addEventListener('click', () => this.startOver());
    // The event listener for the save button is now active
    this.elements.saveBtn?.addEventListener('click', () => this.saveAssessment());
  }

  _setupStateSubscriptions() {
    stateManager.subscribe('currentCategoryIndex', () => this._updateNavigation());
    stateManager.subscribe('currentAnswers', () => {
        this._updateCategoryStyles();
        this._updateNavigation();
    });
  }

  startAssessment() {
    stateManager.resetAssessment();
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
    stateManager.resetAssessment();
    this._showWizardStep('start');
    this.progressTracker.hide();
  }

  // --- [FIX 2] --- Enhance the save function to refresh the history page ---
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
      date: new Date().toISOString(), // Use ISO string for consistency
      answers: stateManager.getState('currentAnswers'),
      result: stateManager.getState('currentResult')
    };
    
    const success = StorageService.saveAssessment(assessment);
    
    if (success) {
      await ModalManager.showAlert('Assessment saved successfully!', 'Success', '✅');
      stateManager.setState('editingId', assessment.id);
      
      // Automatically refresh the history view for immediate feedback
      if (window.assessmentApp && window.assessmentApp.historyManager) {
        window.assessmentApp.historyManager.loadHistory();
      }
    } else {
      await ModalManager.showAlert('Failed to save assessment. Please try again.', 'Error', '❌');
    }
  }

  _renderCurrentQuestion() {
    const currentQuestion = stateManager.getCurrentQuestion();
    if (!currentQuestion) return;
    
    const { currentAnswers } = stateManager.getState();
    const currentAnswer = currentAnswers[currentQuestion.id];
    
    const html = `
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="mb-4">
          <span class="text-sm font-medium text-indigo-600">${currentQuestion.categoryName}</span>
        </div>
        
        <h2 class="text-xl font-semibold text-gray-900 mb-6">${currentQuestion.text}</h2>
        
        <div class="space-y-3">
          ${currentQuestion.options.map(option => `
            <label class="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
              currentAnswer === option.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
            }">
              <input 
                type="radio" 
                name="answer" 
                value="${option.value}" 
                class="mt-1 mr-3"
                ${currentAnswer === option.value ? 'checked' : ''}
                onchange="window.assessmentApp.setAnswer('${currentQuestion.id}', '${option.value}')"
              >
              <div>
                <div class="font-medium text-gray-900">${option.label}</div>
                ${option.is_uncertain ? '<div class="text-sm text-yellow-600 mt-1">⚠️ This choice indicates uncertainty</div>' : ''}
              </div>
            </label>
          `).join('')}
        </div>
      </div>
    `;
    
    this.elements.questionContainer.innerHTML = html;
  }

  // MAJOR REVISION: This method now renders a whole category of questions
  _renderCurrentCategory() {
    const currentCategory = stateManager.getCurrentCategory();
    if (!currentCategory) return;

    const { currentAnswers } = stateManager.getState();
    const questions = currentCategory.questions || [];

    const html = `
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-900">${currentCategory.name}</h2>
        <p class="mt-2 text-gray-600">${currentCategory.description || ''}</p>
      </div>

      <div class="space-y-6">
        ${questions.map(question => {
          const isAnswered = currentAnswers[question.id] !== undefined;
          const cardBorderColor = isAnswered ? 'border-green-400' : 'border-gray-300';
          const cardBgColor = isAnswered ? 'bg-green-50' : 'bg-white';

          return `
            <div id="question-card-${question.id}" class="bg-white rounded-lg shadow-sm border ${cardBorderColor} ${cardBgColor} p-6 transition-colors duration-300">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">${question.text}</h3>
              <div class="space-y-3">
                ${question.options.map(option => {
                  const isChecked = currentAnswers[question.id] === option.value;
                  return `
                    <label class="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                      isChecked ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-gray-200'
                    }">
                      <input 
                        type="radio" 
                        name="answer-${question.id}" 
                        value="${option.value}" 
                        class="mt-1 mr-3 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        ${isChecked ? 'checked' : ''}
                        onchange="window.assessmentApp.setAnswer('${question.id}', '${option.value}')"
                      >
                      <div>
                        <span class="font-medium text-gray-900">${option.label}</span>
                        ${option.is_uncertain ? '<p class="text-sm text-yellow-700 mt-1">⚠️ This choice indicates uncertainty and may require follow-up.</p>' : ''}
                      </div>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.elements.questionContainer.innerHTML = html;
    window.scrollTo(0, 0); // Scroll to top when a new section loads
  }

  _completeAssessment() {
    const result = AssessmentService.generateResult();
    stateManager.setState('currentResult', result);
    
    this.progressTracker.hide();
    this._showWizardStep('result');
    this.resultRenderer.render(result);
  }

  _showWizardStep(step) {
    // Hide all steps first
    this.elements.start?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
    this.elements.questionContainer?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
    this.elements.navigation?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
    this.elements.resultContainer?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);

    // Show the relevant step. The buttons are now inside resultContainer, so no extra logic is needed.
    switch (step) {
      case 'start':
        this.elements.start?.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
        break;
      case 'question':
        this.elements.questionContainer?.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
        this.elements.navigation?.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
        break;
      case 'result':
        // This single line now shows the results AND the buttons.
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
    
    // Update button text to be more intuitive
    this.elements.nextBtn.textContent = isLastCategory ? 'Complete Assessment' : 'Next Section';
  }

  // NEW METHOD: This lightweight function only updates styles, no re-rendering.
  _updateCategoryStyles() {
    const currentCategory = stateManager.getCurrentCategory();
    if (!currentCategory || !currentCategory.questions) return;
    
    const { currentAnswers } = stateManager.getState();

    currentCategory.questions.forEach(question => {
      const card = document.getElementById(`question-card-${question.id}`);
      if (!card) return;

      const isAnswered = currentAnswers[question.id] !== undefined;
      
      if (isAnswered) {
        card.classList.remove('border-gray-300', 'bg-white');
        card.classList.add('border-green-400', 'bg-green-50');
      } else {
        // This case is less likely to be hit but good for completeness
        card.classList.remove('border-green-400', 'bg-green-50');
        card.classList.add('border-gray-300', 'bg-white');
      }
    });
  }

  setAnswer(questionId, value) {
    stateManager.setAnswer(questionId, value);
  }
}
