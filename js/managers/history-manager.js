/**
 * Assessment history management
 */
import { DOM_SELECTORS } from '../config/dom-selectors.js';
import { StorageService } from '../services/storage-service.js';
import { ModalManager } from '../components/modal-manager.js';
import { stateManager } from './state-manager.js';
import { ResultRenderer } from '../components/result-renderer.js'; // Added for generating result HTML
import { DataService } from '../services/data-service.js'; // Added for fetching question details

export class HistoryManager {
  constructor() {
    this.container = document.querySelector(DOM_SELECTORS.history.container);
    this.resultRenderer = new ResultRenderer(); // Instantiate ResultRenderer
  }

  init() {
    this.loadHistory();
    this._setupEventListeners();
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
    const result = assessment.result || {};
    const feasibility = result.feasibility || {};
    const eta = result.eta || {};
    const techProfile = result.techProfile || {};

    const title = assessment.name || 'Untitled Assessment';
    const timestamp = assessment.date ? new Date(assessment.date).toLocaleDateString() : 'N/A';
    
    const riskLevel = feasibility.risk || 'N/A';
    const riskColorClasses = this._getRiskBadgeClasses(riskLevel);

    const confidenceLevel = feasibility.confidence || 'N/A';
    const confidenceColorClasses = this._getConfidenceBadgeClasses(confidenceLevel);

    let timelineEstimate = 'N/A';
    if (eta.min && eta.max) {
      timelineEstimate = eta.min === eta.max ? `${eta.min} months` : `${eta.min}-${eta.max} months`;
    }

    // Attempt to get technology category. This is a guess based on common patterns.
    // Or it could be a more general category derived from the techProfile.
    const techCategory = techProfile.Category || 'N/A'; // Use techProfile.Category based on new findings

    return `
      <div class="assessment-card bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 ease-in-out cursor-pointer" data-assessment-id="${assessment.id}">
        <div class="p-5 md:p-6">
          <div class="flex flex-col sm:flex-row justify-between items-start mb-3">
            <div class="flex-1 mb-3 sm:mb-0">
              <h3 class="text-lg md:text-xl font-semibold text-blue-700 hover:text-blue-800 transition-colors">${title}</h3>
              <p class="text-xs text-gray-500 mt-1">Last updated: ${timestamp}</p>
            </div>
            <div class="flex space-x-2 flex-shrink-0">
              <button 
                onclick="event.stopPropagation(); window.assessmentApp.editAssessment('${assessment.id}')"
                title="Edit Assessment"
                class="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-100 border border-indigo-300 rounded-md hover:bg-indigo-500 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                Edit
              </button>
              <button 
                onclick="event.stopPropagation(); window.assessmentApp.deleteAssessment('${assessment.id}')"
                title="Delete Assessment"
                class="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-100 border border-red-300 rounded-md hover:bg-red-500 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Delete
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-sm">
            <div class="p-3 rounded-md">
              <span class="block text-xs font-medium text-gray-500 mb-0.5">Risk Level</span>
              <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full ${riskColorClasses}">${riskLevel}</span>
            </div>
            <div class="p-3 rounded-md">
              <span class="block text-xs font-medium text-gray-500 mb-0.5">Feasibility</span>
              <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full ${confidenceColorClasses}">${confidenceLevel}</span>
            </div>
            <div class="p-3 rounded-md">
              <span class="block text-xs font-medium text-gray-500 mb-0.5">Timeline</span>
              <span class="text-gray-800 font-medium">${timelineEstimate}</span>
            </div>
            <div class="p-3 rounded-md">
              <span class="block text-xs font-medium text-gray-500 mb-0.5">Tech Category</span>
              <span class="text-gray-800 font-medium whitespace-normal break-words" title="${techCategory}">${techCategory}</span>
            </div>
          </div>
          
          ${result.insufficientInfo ? `
            <div class="mt-3 p-2.5 bg-yellow-50 border border-yellow-300 rounded-md text-yellow-700 text-xs flex items-center">
              <svg class="h-4 w-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.25 3.031-1.743 3.031H4.42c-1.493 0-2.493-1.701-1.743-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm0-3.75a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75z" clip-rule="evenodd"/></svg>
              Needs More Info to Finalize
            </div>
          ` : ''}

        </div>
        <div class="assessment-details hidden p-6 border-t border-gray-200 bg-gray-50">
          {/* Detailed content will be loaded here */}
          <div class="text-center text-gray-500">Loading details...</div>
        </div>
      </div>
    `;
  }

  _getRiskBadgeClasses(risk) {
    const riskLower = risk?.toLowerCase();
    if (riskLower === 'low') return 'bg-green-100 text-green-800 border border-green-300';
    if (riskLower === 'medium') return 'bg-yellow-100 text-yellow-800 border border-yellow-300'; // Changed from blue for better semantic meaning
    if (riskLower === 'high' || riskLower === 'very high') return 'bg-red-100 text-red-700 border border-red-300';
    return 'bg-gray-100 text-gray-700 border border-gray-300'; // Default for N/A or other
  }

  _getConfidenceBadgeClasses(confidence) {
    const confidenceLower = confidence?.toLowerCase();
    if (confidenceLower === 'very high' || confidenceLower === 'high') return 'bg-green-100 text-green-800 border border-green-300';
    if (confidenceLower === 'medium') return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    if (confidenceLower === 'low' || confidenceLower === 'very low') return 'bg-red-100 text-red-700 border border-red-300';
    return 'bg-gray-100 text-gray-700 border border-gray-300'; // Default for N/A or other
  }

  async _generateAssessmentDetailsHTML(assessment) {
    const { answers, result } = assessment;
    
    let questionsHtml = '<div class="space-y-4">';
    if (answers && Object.keys(answers).length > 0) {
        for (const [questionId, answer] of Object.entries(answers)) {
            const question = DataService.getQuestionById(questionId); // DataService is now imported
            if (!question) continue;
            
            const selectedOption = DataService.getOptionByValue(questionId, answer);
            const isUncertain = selectedOption?.is_uncertain || false;

            questionsHtml += `
                <div class="border-l-4 ${isUncertain ? 'border-yellow-400' : 'border-green-400'} pl-4 py-2">
                <h4 class="font-medium text-gray-800">${question.text}</h4>
                <p class="text-sm ${isUncertain ? 'text-yellow-700' : 'text-green-700'}">
                    ${isUncertain ? '⚠️ ' : '✓ '} ${selectedOption ? selectedOption.label : answer}
                </p>
                </div>
            `;
        }
    } else {
        questionsHtml += '<p class="text-gray-500">No answers recorded for this assessment.</p>';
    }
    questionsHtml += '</div>';

    let resultHtml = '<div class="mt-6 pt-6 border-t border-gray-200">';
    if (!result) {
      resultHtml += '<p class="text-gray-500">No assessment result available.</p>';
    } else {
      if (result.insufficientInfo) {
        // Use ResultRenderer to generate insufficient info message
        const insufficientInfoContainer = document.createElement('div');
        // Temporarily assign to elements for ResultRenderer
        const originalInsufficientWarning = this.resultRenderer.elements.insufficientWarning;
        this.resultRenderer.elements.insufficientWarning = insufficientInfoContainer;
        this.resultRenderer._renderInsufficientInfo(result);
        resultHtml += insufficientInfoContainer.innerHTML;
        this.resultRenderer.elements.insufficientWarning = originalInsufficientWarning; // Restore
      } else {
        resultHtml += this.resultRenderer._generateStandardResultHTML(result);
      }
    }
    resultHtml += '</div>';

    return `
      <div class="max-w-full mx-auto">
        <h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Questions & Answers</h3>
        ${questionsHtml}
      </div>
      <div>
        <h3 class="text-xl font-semibold text-gray-800 mt-6 mb-4 border-b pb-2">Assessment Result</h3>
        ${resultHtml}
      </div>
    `;
  }

  _setupEventListeners() {
    this.container?.addEventListener('click', async (event) => {
      const card = event.target.closest('.assessment-card');
      if (card) {
        const detailsDiv = card.querySelector('.assessment-details');
        const assessmentId = card.dataset.assessmentId;

        if (!detailsDiv || !assessmentId) return;

        const isExpanded = detailsDiv.classList.toggle('hidden');
        card.classList.toggle('expanded', !isExpanded); // Add 'expanded' class if details are visible

        // If expanding and content hasn't been loaded yet
        if (!isExpanded && !detailsDiv.dataset.loaded) {
          detailsDiv.innerHTML = '<div class="text-center text-gray-500 py-4">Loading details...</div>'; // Show loading indicator
          const assessments = StorageService.loadSavedAssessments();
          const assessment = assessments.find(a => a.id === assessmentId);
          if (assessment) {
            const detailsHtml = await this._generateAssessmentDetailsHTML(assessment);
            detailsDiv.innerHTML = detailsHtml;
            detailsDiv.dataset.loaded = 'true'; // Mark as loaded
          } else {
            detailsDiv.innerHTML = '<div class="text-center text-red-500 py-4">Error loading details. Assessment not found.</div>';
          }
        }
      }
    });
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
      currentResult: assessment.result || null,
      currentCategoryIndex: 0 // Ensure wizard starts from the first category
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
