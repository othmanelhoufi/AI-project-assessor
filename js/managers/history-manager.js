/**
 * Assessment history management
 */
import { DOM_SELECTORS } from '../config/dom-selectors.js';
import { StorageService } from '../services/storage-service.js';
import { ModalManager } from '../components/modal-manager.js';
import { stateManager } from './state-manager.js';

export class HistoryManager {
  constructor() {
    this.container = document.querySelector(DOM_SELECTORS.history.container);
  }

  init() {
    this.loadHistory();
  }

  loadHistory() {
    if (!this.container) return;

    const assessments = StorageService.loadSavedAssessments();
    
    if (assessments.length === 0) {
      this.container.innerHTML = `
        <div class="text-center py-8">
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
    return `
      <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900">${assessment.name}</h3>
            <p class="text-sm text-gray-500 mt-1">Updated: ${assessment.date}</p>
            
            ${assessment.result ? `
              <div class="mt-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this._getStatusColor(assessment.result)}">
                  ${assessment.result.insufficientInfo ? 'Needs More Info' : 'Complete'}
                </span>
                ${assessment.result.feasibility ? `
                  <span class="ml-2 text-sm text-gray-600">
                    Risk: ${assessment.result.feasibility.risk}
                  </span>
                ` : ''}
              </div>
            ` : ''}
          </div>
          
          <div class="flex space-x-2 ml-4">
            <button 
              onclick="window.assessmentApp.reviewAssessment('${assessment.id}')"
              class="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
            >
              Review
            </button>
            <button 
              onclick="window.assessmentApp.editAssessment('${assessment.id}')"
              class="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded hover:bg-indigo-50 transition-colors"
            >
              Edit
            </button>
            <button 
              onclick="window.assessmentApp.deleteAssessment('${assessment.id}')"
              class="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _getStatusColor(result) {
    if (result.insufficientInfo) {
      return 'bg-yellow-100 text-yellow-800';
    }
    
    const risk = result.feasibility?.risk?.toLowerCase();
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': case 'very high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  async deleteAssessment(id) {
    const confirmed = await ModalManager.showConfirm(
      'Are you sure you want to delete this assessment? This action cannot be undone.',
      'Delete Assessment',
      '🗑️',
      'Delete'
    );
    
    if (confirmed) {
      const success = StorageService.deleteAssessment(id);
      if (success) {
        this.loadHistory();
        await ModalManager.showAlert('Assessment deleted successfully.', 'Deleted', '✅');
      } else {
        await ModalManager.showAlert('Failed to delete assessment. Please try again.', 'Error', '❌');
      }
    }
  }

  editAssessment(id) {
    const assessments = StorageService.loadSavedAssessments();
    const assessment = assessments.find(a => a.id === id);
    
    if (!assessment) {
      ModalManager.showAlert('Assessment not found.', 'Error', '❌');
      return;
    }

    // Load the assessment data into state
    stateManager.updateState({
      currentAnswers: assessment.answers || {},
      editingId: id,
      currentResult: assessment.result || null
    });

    // Navigate to assessment page
    window.assessmentApp.navigationManager.showPage('assessment');

    // Start the wizard with existing data
    // Make sure wizardController is used, which is the instance
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
