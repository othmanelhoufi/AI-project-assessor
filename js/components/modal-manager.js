/**
 * Modal management component
 */
import { DOM_SELECTORS } from '../config/dom-selectors.js';
import { CONSTANTS } from '../config/constants.js';

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

  static showReviewModal(assessment) {
    const elements = this._getModalElements('review');
    
    elements.title.textContent = `Assessment Review: ${assessment.name}`;
    elements.content.innerHTML = this._generateReviewContent(assessment);
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

  static _generateReviewContent(assessment) {
    const { answers, result } = assessment;
    
    // Import DataService for question lookup
    import('../services/data-service.js').then(({ DataService }) => {
      // Generate questions and answers section
      let questionsHtml = '<div class="space-y-4">';
      
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
      let resultHtml = '<div class="mt-8">';
      if (!result) {
        resultHtml += '<p class="text-gray-500">No assessment result available.</p>';
      } else {
        const resultData = result;
        
        // Handle insufficient information case
        if (resultData.insufficientInfo) {
          resultHtml += `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 class="text-lg font-semibold text-yellow-800 mb-2">⚠️ Insufficient Information</h3>
              <p class="text-yellow-700">${resultData.insufficientInfoMessage}</p>
              ${resultData.uncertainAreas ? `
                <div class="mt-2">
                  <p class="font-medium text-yellow-800">Areas needing clarification:</p>
                  <ul class="list-disc list-inside text-yellow-700">
                    ${resultData.uncertainAreas.map(area => `<li>${area}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          `;
        } else {
          // Standard result
          resultHtml += `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 class="text-lg font-semibold text-blue-800 mb-2">📋 Assessment Summary</h3>
              <p class="text-blue-700">${resultData.summary}</p>
            </div>
          `;
          
          // Feasibility
          if (resultData.feasibility) {
            resultHtml += `
              <div class="mb-4">
                <h4 class="font-medium text-gray-900">Risk Level: ${resultData.feasibility.risk}</h4>
                <p>Confidence: ${resultData.feasibility.confidence}</p>
                ${resultData.feasibility.summary ? `<p class="text-sm text-gray-600">${resultData.feasibility.summary}</p>` : ''}
              </div>
            `;
          }
          
          // Tech Profile
          if (resultData.techProfile) {
            resultHtml += `
              <div class="mb-4">
                <h4 class="font-medium text-gray-900 mb-2">Technology Profile</h4>
                <table class="min-w-full border border-gray-200">
                  <thead>
                    <tr class="bg-gray-50">
                      <th class="border border-gray-200 px-3 py-2 text-left">Aspect</th>
                      <th class="border border-gray-200 px-3 py-2 text-left">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.entries(resultData.techProfile).map(([key, value]) => `
                      <tr>
                        <td class="border border-gray-200 px-3 py-2 font-medium">${this._formatAspectName(key)}</td>
                        <td class="border border-gray-200 px-3 py-2">${value}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `;
          }
          
          // Timeline
          if (resultData.eta) {
            resultHtml += `
              <div class="mb-4">
                <h4 class="font-medium text-gray-900">Timeline</h4>
                <p>Total Duration (${resultData.scope_title || 'Project'}): ${
                  resultData.eta.min === resultData.eta.max 
                    ? `${resultData.eta.min} months` 
                    : `${resultData.eta.min}-${resultData.eta.max} months`
                }</p>
              </div>
            `;
          }
          
          // Team Composition
          if (resultData.roles) {
            resultHtml += `
              <div class="mb-4">
                <h4 class="font-medium text-gray-900 mb-2">Required Team</h4>
                <div class="space-y-2">
                  ${Object.entries(resultData.roles).map(([roleKey, role]) => `
                    <div class="border border-gray-200 rounded p-3">
                      <h5 class="font-medium">${role.title || roleKey}</h5>
                      ${role.allocation ? `<p class="text-sm text-gray-600">Allocation: ${role.allocation}</p>` : ''}
                      ${role.priority ? `<p class="text-sm text-gray-600">Priority: ${role.priority}</p>` : ''}
                      ${role.experience ? `<p class="text-sm text-gray-600">Experience: ${role.experience}</p>` : ''}
                      ${role.knowledge ? `<p class="text-sm text-gray-600">Knowledge: ${role.knowledge}</p>` : ''}
                      ${role.criticalSkills ? `<p class="text-sm text-gray-600">Critical Skills: ${Array.isArray(role.criticalSkills) ? role.criticalSkills.join(', ') : role.criticalSkills}</p>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }
        }
      }
      resultHtml += '</div>';
      
      return questionsHtml + resultHtml;
    });
    
    // Return placeholder while async import loads
    return '<p>Loading review content...</p>';
  }

  static _formatAspectName(key) {
    return key.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
  }
}
