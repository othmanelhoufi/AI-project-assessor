/**
 * Renders the detailed content for the assessment review modal.
 */
import { DataService } from '../services/data-service.js';
import { ResultRenderer } from './result-renderer.js';
import { stateManager } from '../managers/state-manager.js';

export class ReviewRenderer {
  /**
   * Generates the complete HTML content for the review modal.
   * @param {object} assessment - The full assessment object, including answers and result.
   * @returns {string} The HTML string to be injected into the modal.
   */
  static render(assessment) {
    const { answers, result } = assessment;
    const assessmentData = stateManager.getState('assessmentData');

    let questionsHtml = '';
    const projectDescription = answers?.project_description;

    if (projectDescription) {
      questionsHtml += `
        <div class="border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-md avoid-break mb-6">
          <h4 class="font-medium text-gray-800">Project Description</h4>
          <p class="text-sm text-gray-700 mt-2">${projectDescription}</p>
        </div>
      `;
    }

    if (assessmentData && assessmentData.categories) {
      const categoriesHtml = assessmentData.categories.map(category => {
        if (category.name === "Project Context") return '';

        const questionsContent = category.questions.map(question => {
          const answerValue = answers[question.id];
          if (!answerValue) return ''; // Only show answered questions

          const selectedOption = DataService.getOptionByValue(question.id, answerValue);
          const isUncertain = selectedOption?.is_uncertain || false;

          return `
            <div class="border-l-4 ${isUncertain ? 'border-yellow-400 bg-yellow-50' : 'border-green-400 bg-green-50'} pl-4 py-2 rounded-r-md avoid-break">
              <h4 class="font-medium text-gray-800">${question.text}</h4>
              <p class="text-sm ${isUncertain ? 'text-yellow-700' : 'text-green-700'}">
                ${isUncertain ? '⚠️ ' : '✓ '} ${selectedOption ? selectedOption.label : answerValue}
              </p>
            </div>
          `;
        }).join('');

        if (questionsContent.trim() === '') return '';

        return `
          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">${category.name}</h3>
            <div class="space-y-4">${questionsContent}</div>
          </div>
        `;
      }).join('');
      
      if(categoriesHtml.trim() !== ''){
        questionsHtml += `<div class="space-y-8">${categoriesHtml}</div>`;
      }

    } 
    
    if (!projectDescription && questionsHtml.trim() === '') {
      questionsHtml = '<p class="text-gray-500">No answers were recorded for this assessment.</p>';
    }

    let resultHtml = '';
    if (result) {
      const tempRenderer = new ResultRenderer();
      const tempContainer = document.createElement('div');
      tempRenderer.elements.standardContainer = tempContainer;
      tempRenderer.elements.insufficientWarning = tempContainer;
      tempRenderer.render(result);
      resultHtml = tempContainer.innerHTML;
    } else {
      resultHtml = '<p class="text-gray-500">No result was generated for this assessment.</p>';
    }

    return `
      <div id="pdf-content-wrapper" class="p-4">
        <div class="avoid-break mb-8 text-center">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">AI Project Assessment Report</h1>
          <p class="text-lg text-gray-600">${assessment.name || 'Untitled Assessment'}</p>
          <p class="text-sm text-gray-400">Date: ${new Date(assessment.date).toLocaleDateString()}</p>
        </div>
        
        <div class="mb-4 border-b border-gray-200 lg:hidden">
            <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" id="review-tabs">
                <li class="mr-2">
                    <button class="inline-block p-4 border-b-2 rounded-t-lg" data-tab-target="#review-qa">Q&A</button>
                </li>
                <li>
                    <button class="inline-block p-4 border-b-2 rounded-t-lg" data-tab-target="#review-result">Result</button>
                </li>
            </ul>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div id="review-qa" class="lg:col-span-4 tab-panel">
              <div class="lg:sticky top-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 hidden lg:block">Questions & Answers</h3>
                <div class="max-h-[60vh] overflow-y-auto pr-4 pb-4">
                  ${questionsHtml}
                </div>
              </div>
            </div>
            <div id="review-result" class="lg:col-span-8 tab-panel">
              <h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 hidden lg:block">Assessment Result</h3>
              <div class="max-h-[60vh] overflow-y-auto pr-4 pb-4">
                  ${resultHtml}
              </div>
            </div>
        </div>
      </div>
    `;
  }
}