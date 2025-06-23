/**
 * Modal management component
 */
import { DOM_SELECTORS } from '../config/dom-selectors.js';
import { CONSTANTS } from '../config/constants.js';
import { ResultRenderer } from './result-renderer.js'; // Import ResultRenderer

export class ModalManager {
  static showAlert(message, title = CONSTANTS.MODAL_DEFAULTS.ALERT.title, icon = CONSTANTS.MODAL_DEFAULTS.ALERT.icon) {
    return new Promise((resolve) => {
      const elements = this._getModalElements('alert');
      
      elements.title.textContent = title;
      elements.message.textContent = message;
      elements.icon.textContent = icon;
      elements.modal.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);

      const handleClose = () => {
        elements.modal.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
        elements.ok.removeEventListener('click', handleClose);
        resolve();
      };

      elements.ok.addEventListener('click', handleClose);
    });
  }

  static showConfirm(
    message, 
    title = CONSTANTS.MODAL_DEFAULTS.CONFIRM.title, 
    icon = CONSTANTS.MODAL_DEFAULTS.CONFIRM.icon, 
    okText = CONSTANTS.MODAL_DEFAULTS.CONFIRM.okText, 
    okClass = CONSTANTS.MODAL_DEFAULTS.CONFIRM.okClass
  ) {
    return new Promise((resolve) => {
      const elements = this._getModalElements('confirm');
      
      elements.title.textContent = title;
      elements.message.textContent = message;
      elements.icon.textContent = icon;
      elements.ok.textContent = okText;
      elements.ok.className = `px-4 py-2 text-white rounded-lg transition-colors ${okClass}`;
      elements.modal.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);

      const handleClose = (result) => {
        elements.modal.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
        elements.cancel.removeEventListener('click', handleCancel);
        elements.ok.removeEventListener('click', handleOk);
        resolve(result);
      };

      const handleCancel = () => handleClose(false);
      const handleOk = () => handleClose(true);

      elements.cancel.addEventListener('click', handleCancel);
      elements.ok.addEventListener('click', handleOk);
    });
  }

  static showPrompt(message, title = CONSTANTS.MODAL_DEFAULTS.INPUT.title, placeholder = CONSTANTS.MODAL_DEFAULTS.INPUT.placeholder, defaultValue = '') {
    return new Promise((resolve) => {
      const elements = this._getModalElements('input');
      
      elements.title.textContent = title;
      elements.message.textContent = message;
      elements.field.placeholder = placeholder;
      elements.field.value = defaultValue;
      elements.error.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
      elements.modal.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
      elements.field.focus();

      const handleClose = (result) => {
        elements.modal.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
        elements.cancel.removeEventListener('click', handleCancel);
        elements.ok.removeEventListener('click', handleOk);
        elements.field.removeEventListener('keydown', handleKeydown);
        resolve(result);
      };

      const handleCancel = () => handleClose(null);
      const handleOk = () => {
        const value = elements.field.value.trim();
        if (!value) {
          elements.error.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
          elements.field.focus();
          return;
        }
        handleClose(value);
      };

      const handleKeydown = (e) => {
        if (e.key === 'Enter') {
          handleOk();
        } else if (e.key === 'Escape') {
          handleCancel();
        }
      };

      elements.cancel.addEventListener('click', handleCancel);
      elements.ok.addEventListener('click', handleOk);
      elements.field.addEventListener('keydown', handleKeydown);
    });
  }

  static async showReviewModal(assessment) {
    const elements = this._getModalElements('review');
    
    elements.title.textContent = `Assessment Review: ${assessment.name}`;
    // Await the content generation
    elements.content.innerHTML = await this._generateReviewContent(assessment);
    elements.modal.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);

    const handleClose = () => {
      elements.modal.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
      elements.close.removeEventListener('click', handleClose);
      elements.closeBtn.removeEventListener('click', handleClose);
    };

    elements.close.addEventListener('click', handleClose);
    elements.closeBtn.addEventListener('click', handleClose);
  }

  static _getModalElements(type) {
    const selectors = DOM_SELECTORS.modals[type];
    const elements = {};
    
    for (const [key, selector] of Object.entries(selectors)) {
      elements[key] = document.querySelector(selector);
    }
    
    return elements;
  }

  static async _generateReviewContent(assessment) { // Made async
    const { answers, result } = assessment;
    
    // Import DataService for question lookup
    // Await the dynamic import
    const { DataService } = await import('../services/data-service.js');

    // Generate questions and answers section
    let questionsHtml = '<div class="space-y-4">';
    // ... rest of the function remains largely the same, but it's now inside an async function
    // and the .then() structure is removed.
    // The generated HTML (questionsHtml + resultHtml) will be stored in a variable, let's call it htmlContent
    // and then returned at the end of the function.
    // For brevity, I'm not reproducing the entire HTML generation logic here,
    // just showing the key change with async/await for the import.

    // --- Start of existing HTML generation logic (simplified for this diff) ---
    for (const [questionId, answer] of Object.entries(answers)) {
      const question = DataService.getQuestionById(questionId);
      if (!question) continue;
      
      const selectedOption = DataService.getOptionByValue(questionId, answer);
      const isUncertain = selectedOption?.is_uncertain || false;

      questionsHtml += `
        <div class="border-l-4 ${isUncertain ? 'border-yellow-400' : 'border-green-400'} pl-4">
          <h4 class="font-medium text-gray-900">${question.text}</h4>
          <p class="text-sm ${isUncertain ? 'text-yellow-700' : 'text-green-700'}">
            ${isUncertain ? '⚠️ ' : '✓ '}${selectedOption ? selectedOption.label : answer}
          </p>
        </div>
      `;
    }
    questionsHtml += '</div>';

    // Generate result section
    let resultHtml = '<div class="mt-8 pt-6 border-t border-gray-200">'; // Added border for separation

    if (!result) {
      resultHtml += '<p class="text-gray-500">No assessment result available.</p>';
    } else {
      if (result.insufficientInfo) {
          // Kept the replicated HTML for insufficientInfo for this fix, as per plan.
          // This avoids needing to refactor ResultRenderer._renderInsufficientInfo immediately.
          resultHtml += `
            <div class="bg-yellow-50 border-l-4 border-yellow-400 shadow-lg rounded-r-lg p-6 max-w-3xl mx-auto">
              <div class="flex items-center mb-1">
                <svg class="h-6 w-6 text-yellow-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.25 3.031-1.743 3.031H4.42c-1.493 0-2.493-1.701-1.743-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm0-3.75a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75z" clip-rule="evenodd"/></svg>
                <h3 class="text-xl font-semibold text-yellow-800">Insufficient Information for Full Assessment</h3>
              </div>
              <div class="ml-8">
                <p class="text-sm text-yellow-700 mb-3">${result.insufficientInfoMessage || 'The assessment could not be fully generated due to missing or uncertain information in key areas.'}</p>
                ${result.uncertainAreas && result.uncertainAreas.length > 0 ? `
                  <div>
                    <h4 class="text-sm font-semibold text-yellow-800 mb-1">Areas needing clarification:</h4>
                    <ul class="space-y-1">
                      ${result.uncertainAreas.map(area => `
                        <li class="flex items-start text-sm text-yellow-700">
                          <svg class="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                          <span>${area}</span>
                        </li>`).join('')}
                    </ul>
                  </div>
                ` : '<p class="text-sm text-yellow-600">No specific areas were highlighted, but some information was marked as uncertain.</p>'}
                <p class="mt-4 text-sm text-yellow-700">Please review your answers, gather more details where needed, and then re-run the assessment.</p>
              </div>
            </div>
          `;
      } else {
          // For standard results, instantiate ResultRenderer and call its method
          const localResultRenderer = new ResultRenderer();
          resultHtml += localResultRenderer._generateStandardResultHTML(result);
      }
    }
    resultHtml += '</div>';

    const htmlContent = `
      <div>
        <h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Questions & Answers</h3>
        ${questionsHtml}
      </div>
      <div>
        <h3 class="text-xl font-semibold text-gray-800 mt-8 mb-4 border-b pb-2">Assessment Result</h3>
        ${resultHtml}
      </div>
    `;
    // --- End of existing HTML generation logic ---
    
    // No longer returning placeholder, as the function is now async.
    // The caller will await the actual content.
    return htmlContent;
  }

  // Remove _formatAspectName from ModalManager as it's specific to ResultRenderer's old way
  // static _formatAspectName(key) {
  //   // This is the correct content for _formatAspectName
  //   return key.replace(/([A-Z])/g, ' $1')
  //             .replace(/^./, str => str.toUpperCase())
  //             .trim();
  // }
}
