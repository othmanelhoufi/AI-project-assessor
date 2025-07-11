/**
 * Modal management component
 */
import { DOM_SELECTORS } from '../config/dom-selectors.js';
import { CONSTANTS } from '../config/constants.js';
import { ResultRenderer } from './result-renderer.js';
import { DataService } from '../services/data-service.js';
// pdf-export-service.js is no longer used.

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
        if (e.key === 'Enter') handleOk();
        else if (e.key === 'Escape') handleCancel();
      };

      elements.cancel.addEventListener('click', handleCancel);
      elements.ok.addEventListener('click', handleOk);
      elements.field.addEventListener('keydown', handleKeydown);
    });
  }
  
  static async showReviewModal(assessment) {
    const elements = this._getModalElements('review');
    if (!elements.modal) return;

    elements.title.textContent = `Assessment Review: ${assessment.name}`;
    elements.content.innerHTML = '<div class="text-center text-gray-500">Loading details...</div>';
    elements.modal.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);

    const contentHtml = await this._generateReviewContent(assessment);
    elements.content.innerHTML = contentHtml;

    const handleClose = () => {
      elements.modal.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
      elements.close.removeEventListener('click', handleClose);
      elements.closeBtn.removeEventListener('click', handleClose);
      elements.exportPdfBtn.removeEventListener('click', handleExport);
    };
    
    const handleExport = () => {
      const contentWrapper = elements.content.querySelector('#pdf-content-wrapper');
      this._exportAssessmentToPdf(assessment, contentWrapper, elements.exportPdfBtn);
    };

    elements.close.addEventListener('click', handleClose);
    elements.closeBtn.addEventListener('click', handleClose);
    elements.exportPdfBtn.addEventListener('click', handleExport);
  }

  /**
   * REWRITTEN: Handles PDF export using html2pdf.js for a clean, what-you-see-is-what-you-get result.
   * @param {object} assessment - The assessment data.
   * @param {HTMLElement} elementToExport - The HTML element to convert to PDF.
   * @param {HTMLButtonElement} exportBtn - The export button element to show loading state.
   */
  static async _exportAssessmentToPdf(assessment, elementToExport, exportBtn) {
    const originalBtnContent = exportBtn.innerHTML;
    
    exportBtn.disabled = true;
    exportBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Exporting...</span>`;

    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const safeName = (assessment.name || 'assessment').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${safeName}_report_${timestamp}.pdf`;

      const opt = {
        margin:       15, // Set margins
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false }, // Scale down canvas for better fit
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        // This tells html2pdf to avoid breaking elements with the 'avoid-break' class
        pagebreak:    { mode: ['css', 'legacy'], avoid: '.avoid-break' }
      };

      await html2pdf().set(opt).from(elementToExport).save();

    } catch (err) {
      console.error("Error exporting to PDF:", err);
      this.showAlert('Could not export to PDF. Please try again.', 'Export Error', '❌');
    } finally {
      exportBtn.disabled = false;
      exportBtn.innerHTML = originalBtnContent;
    }
  }

  static _getModalElements(type) {
    const selectors = DOM_SELECTORS.modals[type];
    const elements = {};
    for (const [key, selector] of Object.entries(selectors)) {
      elements[key] = document.querySelector(selector);
    }
    return elements;
  }

  static async _generateReviewContent(assessment) {
    const resultRenderer = new ResultRenderer();
    const { answers, result } = assessment;

    // Use 'avoid-break' class on elements we don't want to split across pages.
    let questionsHtml = '<div class="space-y-4">';
    if (answers && Object.keys(answers).length > 0) {
      for (const [questionId, answerValue] of Object.entries(answers)) {
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

    let resultHtml = '';
    if (result) {
      const tempContainer = document.createElement('div');
      resultRenderer.elements.standardContainer = tempContainer;
      resultRenderer.elements.insufficientWarning = tempContainer;
      resultRenderer.render(result);
      resultHtml = tempContainer.innerHTML;
    } else {
      resultHtml = '<p class="text-gray-500">No result was generated for this assessment.</p>';
    }

    // This wrapper is the element that will be passed to html2pdf
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
