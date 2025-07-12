/**
 * Assessment history management
 */
import { DOM_SELECTORS } from '../config/dom-selectors.js';
import { StorageService } from '../services/storage-service.js';
import { ModalManager } from '../components/modal-manager.js';
import { stateManager } from './state-manager.js';
import { getRiskBadgeClasses, getConfidenceBadgeClasses } from '../utils/ui-helpers.js';
import { Formatters } from '../utils/formatters.js';

export class HistoryManager {
  constructor() {
    this.container = document.querySelector(DOM_SELECTORS.history.container);
  }

  init() {
    this.loadHistory();
    // Subscribe to the custom event to refresh history when an assessment is saved
    stateManager.on('assessment-saved', () => this.loadHistory());
  }

  loadHistory() {
    if (!this.container) return;

    let assessments = StorageService.loadSavedAssessments();
    
    // IMPROVEMENT: Sort assessments by date, with the most recent first.
    assessments.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (assessments.length === 0) {
      this.container.innerHTML = `
        <div class="text-center py-12">
          <div class="text-gray-400 text-6xl mb-4">📝</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No saved assessments</h3>
          <p class="text-gray-500">Complete an assessment and save it to see it here.</p>
        </div>
      `;
      return;
    }

    const html = `
      <div class="space-y-4">
        ${assessments.map(assessment => this._generateAssessmentCard(assessment)).join('')}
      </div>
    `;
    
    this.container.innerHTML = html;
  }

  _generateAssessmentCard(assessment) {
    const result = assessment.result || {};
    const feasibility = result.feasibility || {};
    const eta = result.eta || {};
    const techProfile = result.techProfile || {};

    const title = assessment.name || 'Untitled Assessment';
    // IMPROVEMENT: Use the new, more detailed timestamp formatter.
    const timestamp = assessment.date ? Formatters.formatTimestamp(assessment.date) : 'N/A';
    
    const riskLevel = feasibility.risk || 'N/A';
    const riskColorClasses = getRiskBadgeClasses(riskLevel);

    const confidenceLevel = feasibility.confidence || 'N/A';
    const confidenceColorClasses = getConfidenceBadgeClasses(confidenceLevel);

    let timelineEstimate = 'N/A';
    if (eta.min && eta.max) {
      timelineEstimate = eta.min === eta.max ? `${eta.min} months` : `${eta.min}-${eta.max} months`;
    }

    const techCategory = techProfile.Category || 'N/A';

    return `
      <div class="assessment-card bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        <div class="p-5 md:p-6">
          <div class="flex flex-col sm:flex-row justify-between items-start mb-4">
            <div class="flex-1 mb-3 sm:mb-0">
              <h3 class="text-lg md:text-xl font-semibold text-gray-900">${title}</h3>
              <p class="text-xs text-gray-500 mt-1">Last updated: ${timestamp}</p>
            </div>
            <div class="flex space-x-2 flex-shrink-0">
              <button 
                onclick="window.assessmentApp.reviewAssessment('${assessment.id}')"
                title="Review Assessment"
                class="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Review
              </button>
              <button 
                onclick="window.assessmentApp.editAssessment('${assessment.id}')"
                title="Edit Assessment"
                class="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              >
                Edit
              </button>
              <button 
                onclick="window.assessmentApp.deleteAssessment('${assessment.id}')"
                title="Delete Assessment"
                class="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
              >
                Delete
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-sm pt-4 border-t">
            <div class="p-3 rounded-md bg-gray-50">
              <span class="block text-xs font-medium text-gray-500 mb-0.5">Risk Level</span>
              <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full ${riskColorClasses}">${riskLevel}</span>
            </div>
            <div class="p-3 rounded-md bg-gray-50">
              <span class="block text-xs font-medium text-gray-500 mb-0.5">Feasibility</span>
              <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full ${confidenceColorClasses}">${confidenceLevel}</span>
            </div>
            <div class="p-3 rounded-md bg-gray-50">
              <span class="block text-xs font-medium text-gray-500 mb-0.5">Timeline</span>
              <span class="text-gray-800 font-medium">${timelineEstimate}</span>
            </div>
            <div class="p-3 rounded-md bg-gray-50">
              <span class="block text-xs font-medium text-gray-500 mb-0.5">Tech Category</span>
              <span class="text-gray-800 font-medium whitespace-normal break-words" title="${techCategory}">${techCategory}</span>
            </div>
          </div>
          
          ${result.insufficientInfo ? `
            <div class="mt-4 p-2.5 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800 text-xs flex items-center">
              <svg class="h-4 w-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.25 3.031-1.743 3.031H4.42c-1.493 0-2.493-1.701-1.743-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm0-3.75a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75z" clip-rule="evenodd"/></svg>
              Needs More Info to Finalize
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  async deleteAssessment(id) {
    const confirmed = await ModalManager.showConfirm(
      'Are you sure you want to delete this assessment? This action cannot be undone.',
      'Delete Assessment',
      '🗑️',
      'Delete'
    );
    
    if (confirmed) {
      StorageService.deleteAssessment(id);
      this.loadHistory();
      await ModalManager.showAlert('Assessment deleted successfully.', 'Deleted', '✅');
    }
  }

  editAssessment(id) {
    const assessments = StorageService.loadSavedAssessments();
    const assessment = assessments.find(a => a.id === id);
    
    if (!assessment) {
      ModalManager.showAlert('Assessment not found.', 'Error', '❌');
      return;
    }

    stateManager.updateState({
      currentAnswers: assessment.answers || {},
      editingId: id,
      currentResult: null,
      currentCategoryIndex: 0
    });

    window.assessmentApp.navigationManager.showPage('assessment');
    window.assessmentApp.wizardController.startAssessment();
  }

  reviewAssessment(id) {
    const assessments = StorageService.loadSavedAssessments();
    const assessment = assessments.find(a => a.id === id);
    
    if (!assessment) {
      ModalManager.showAlert('Assessment not found.', 'Error', '❌');
      return;
    }

    ModalManager.showReviewModal(assessment);
  }
}