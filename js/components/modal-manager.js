/**
 * Modal management component
 */
import { DOM_SELECTORS } from '../config/dom-selectors.js';
import { CONSTANTS } from '../config/constants.js';
import { ResultRenderer } from './result-renderer.js';
// ADDED: Statically import DataService at the top of the module.
import { DataService } from '../services/data-service.js';

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
      this._exportAssessmentToPdf(assessment, elements);
    };

    elements.close.addEventListener('click', handleClose);
    elements.closeBtn.addEventListener('click', handleClose);
    elements.exportPdfBtn.addEventListener('click', handleExport);
  }

  /**
   * REWRITTEN: Handles the PDF export logic by programmatically generating the document.
   * @param {object} assessment - The assessment data.
   * @param {object} elements - The modal's DOM elements.
   */
  static _exportAssessmentToPdf(assessment, elements) {
    const { jsPDF } = window.jspdf;
    const { exportPdfBtn } = elements;
    
    const originalBtnContent = exportPdfBtn.innerHTML;
    
    exportPdfBtn.disabled = true;
    exportPdfBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Exporting...</span>`;

    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      // REMOVED: The problematic 'require' call. DataService is now imported at the top.
      const resultRenderer = new ResultRenderer();

      let y = 20; // Initial y position
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;

      const addPageIfNeeded = (spaceNeeded) => {
        if (y + spaceNeeded > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // --- PDF Header ---
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text("AI Project Assessment Report", margin, y);
      y += 8;
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text(assessment.name, margin, y);
      y += 6;
      doc.setFontSize(10);
      doc.text(`Date: ${new Date(assessment.date).toLocaleDateString()}`, margin, y);
      y += 10;
      doc.setDrawColor(200);
      doc.line(margin, y, maxWidth + margin, y);
      y += 10;

      // --- Questions & Answers ---
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text("Questions & Answers", margin, y);
      y += 8;

      if (assessment.answers && Object.keys(assessment.answers).length > 0) {
        for (const [questionId, answerValue] of Object.entries(assessment.answers)) {
          const question = DataService.getQuestionById(questionId);
          if (!question) continue;
          
          const selectedOption = DataService.getOptionByValue(questionId, answerValue);
          const isUncertain = selectedOption?.is_uncertain || false;

          addPageIfNeeded(15);
          doc.setFontSize(11);
          doc.setTextColor(50);
          doc.setFont('helvetica', 'bold');
          const questionLines = doc.splitTextToSize(question.text, maxWidth);
          doc.text(questionLines, margin, y);
          y += questionLines.length * 5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(isUncertain ? '#D97706' : '#059669'); // Amber-600 or Emerald-600
          const answerText = `${isUncertain ? '⚠️ ' : '✓ '} ${selectedOption ? selectedOption.label : answerValue}`;
          const answerLines = doc.splitTextToSize(answerText, maxWidth - 5);
          doc.text(answerLines, margin + 5, y);
          y += answerLines.length * 5 + 5;
        }
      } else {
        addPageIfNeeded(10);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("No answers were recorded for this assessment.", margin, y);
        y += 10;
      }
      
      // --- Assessment Result ---
      addPageIfNeeded(20);
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text("Assessment Result", margin, y);
      y += 10;

      if (assessment.result) {
        const resultText = this._generateResultTextForPdf(assessment.result, resultRenderer);
        const resultLines = doc.splitTextToSize(resultText, maxWidth);
        
        addPageIfNeeded(resultLines.length * 5);
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(resultLines, margin, y);

      } else {
        addPageIfNeeded(10);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("No result was generated for this assessment.", margin, y);
      }

      // --- Save PDF ---
      const timestamp = new Date().toISOString().slice(0, 10);
      const safeName = assessment.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${safeName}_${timestamp}.pdf`;
      doc.save(fileName);

    } catch (err) {
      console.error("Error exporting to PDF:", err);
      this.showAlert('Could not export to PDF. Please try again.', 'Export Error', '❌');
    } finally {
      // Restore button state
      exportPdfBtn.disabled = false;
      exportPdfBtn.innerHTML = originalBtnContent;
    }
  }
  
  /**
   * NEW: Helper to generate a plain text representation of the result for the PDF.
   */
  static _generateResultTextForPdf(result, renderer) {
      let text = '';
      if (result.insufficientInfo) {
          text += 'Insufficient Information for Full Assessment\n\n';
          text += (result.insufficientInfoMessage || '') + '\n\n';
          if (result.uncertainAreas && result.uncertainAreas.length > 0) {
              text += 'Areas needing clarification:\n';
              result.uncertainAreas.forEach(area => text += `- ${area}\n`);
          }
          return text;
      }

      // Feasibility & ETA
      text += '--- Project Estimates & Feasibility ---\n';
      if (result.feasibility) {
          text += `Risk Level: ${result.feasibility.risk}\n`;
          text += `Feasibility Confidence: ${result.feasibility.confidence}\n`;
          if(result.feasibility.summary) text += `Summary: ${result.feasibility.summary}\n`;
      }
      if (result.eta) {
          text += `Timeline Estimate: ${result.eta.min}-${result.eta.max} months for ${result.scope_title || 'Project'}\n\n`;
      }

      // Warnings
      if (result.warnings && result.warnings.length > 0) {
          text += '--- Important Warnings ---\n';
          result.warnings.forEach(w => text += `- ${w}\n`);
          text += '\n';
      }

      // Tech Profile
      if (result.techProfile && Object.keys(result.techProfile).length > 0) {
          text += '--- Technology Profile ---\n';
          Object.entries(result.techProfile).forEach(([key, value]) => {
              text += `${renderer._formatAspectName(key)}: ${value}\n`;
          });
          text += '\n';
      }

      // Team
      if (result.roles && Object.keys(result.roles).length > 0) {
          text += '--- Required Team ---\n';
          Object.values(result.roles).forEach(role => {
              text += `${role.title || 'Unknown Role'}:\n`;
              if(role.allocation) text += `  - Allocation: ${role.allocation}\n`;
              if(role.experience) text += `  - Experience: ${role.experience}\n`;
              if(role.criticalSkills) text += `  - Skills: ${Array.isArray(role.criticalSkills) ? role.criticalSkills.join(', ') : role.criticalSkills}\n`;
          });
      }

      return text;
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
    // REMOVED: Dynamic import is no longer needed as it's imported statically.
    const resultRenderer = new ResultRenderer();
    const { answers, result } = assessment;

    let questionsHtml = '<div class="space-y-4">';
    if (answers && Object.keys(answers).length > 0) {
      for (const [questionId, answerValue] of Object.entries(answers)) {
        const question = DataService.getQuestionById(questionId);
        if (!question) continue;
        
        const selectedOption = DataService.getOptionByValue(questionId, answerValue);
        const isUncertain = selectedOption?.is_uncertain || false;

        questionsHtml += `
          <div class="border-l-4 ${isUncertain ? 'border-yellow-400 bg-yellow-50' : 'border-green-400 bg-green-50'} pl-4 py-2 rounded-r-md">
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

    return `
      <div class="space-y-8">
        <div>
          <h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Questions & Answers</h3>
          ${questionsHtml}
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Assessment Result</h3>
          ${resultHtml}
        </div>
      </div>
    `;
  }
}
