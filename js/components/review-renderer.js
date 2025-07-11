/**
 * Renders the detailed content for the assessment review modal.
 */
import { DataService } from '../services/data-service.js';
import { ResultRenderer } from './result-renderer.js';

export class ReviewRenderer {
  /**
   * Generates the complete HTML content for the review modal.
   * @param {object} assessment - The full assessment object, including answers and result.
   * @returns {string} The HTML string to be injected into the modal.
   */
  static render(assessment) {
    const { answers, result } = assessment;

    // Generate the HTML for the questions and answers section.
    let questionsHtml = '<div class="space-y-4">';
    if (answers && Object.keys(answers).length > 0) {
      for (const [questionId, answerValue] of Object.entries(answers)) {
        // Skip the project description textarea in this section.
        if (questionId === 'project_description') continue;
        
        const question = DataService.getQuestionById(questionId);
        if (!question) continue;
        
        const selectedOption = DataService.getOptionByValue(questionId, answerValue);
        const isUncertain = selectedOption?.is_uncertain || false;

        questionsHtml += `
          <div class="border-l-4 ${isUncertain ? 'border-yellow-400 bg-yellow-50' : 'border-green-400 bg-green-50'} pl-4 py-2 rounded-r-md avoid-break">
            <h4 class="font-medium text-gray-800">${question.text}</h4>
            <p class="text-sm ${isUncertain ? 'text-yellow-700' : 'text-green-700'}">
              ${isUncertain ? '⚠️ ' : '✓ '} ${selectedOption ? selectedOption.label : answerValue}
            </p>
          </div>
        `;
      }
    } else {
      questionsHtml += '<p class="text-gray-500">No answers were recorded for this assessment.</p>';
    }
    questionsHtml += '</div>';

    // Generate the HTML for the assessment result section.
    let resultHtml = '';
    if (result) {
      // Use the existing ResultRenderer to generate the result part of the review.
      const tempRenderer = new ResultRenderer();
      const tempContainer = document.createElement('div');
      tempRenderer.elements.standardContainer = tempContainer;
      tempRenderer.elements.insufficientWarning = tempContainer;
      tempRenderer.render(result);
      resultHtml = tempContainer.innerHTML;
    } else {
      resultHtml = '<p class="text-gray-500">No result was generated for this assessment.</p>';
    }

    // Combine all parts into a final wrapper element for PDF export.
    return `
      <div id="pdf-content-wrapper" class="p-4">
        <div class="avoid-break mb-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">AI Project Assessment Report</h1>
          <p class="text-sm text-gray-600">For: ${assessment.name || 'Untitled Assessment'}</p>
          <p class="text-xs text-gray-400">Date: ${new Date(assessment.date).toLocaleDateString()}</p>
        </div>
        
        <div class="space-y-10">
          <div class="avoid-break">
            <h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Questions & Answers</h3>
            ${questionsHtml}
          </div>
          <div class="avoid-break">
            <h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Assessment Result</h3>
            ${resultHtml}
          </div>
        </div>
      </div>
    `;
  }
}