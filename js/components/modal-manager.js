/**
 * Modal management component
 */
import { DOM_SELECTORS } from '../config/dom-selectors.js';
import { CONSTANTS } from '../config/constants.js';
import { ReviewRenderer } from './review-renderer.js';
import { ResultAIAssistant } from './result/ai-assistant.js';


export class ModalManager {
  static reviewModalAIPlan = new ResultAIAssistant();

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
  
  static showReviewModal(assessment) {
    const elements = this._getModalElements('review');
    if (!elements.modal) return;

    if (elements.title) {
        const refId = assessment.id.toString().slice(-6).toUpperCase();
        elements.title.textContent = `${assessment.name || 'Assessment'} (Ref: ${refId})`;
    }
    
    elements.content.innerHTML = '<div class="text-center text-gray-500">Loading details...</div>';
    elements.modal.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);

    const contentHtml = ReviewRenderer.render(assessment);
    elements.content.innerHTML = contentHtml;

    if (assessment.result && assessment.result.aiPlanStatus === 'success') {
      this.reviewModalAIPlan.parseAndSetSlides(assessment.result.aiGeneratedPlan);
      this.reviewModalAIPlan.attachSlideshowEvents();
    }

    this._setupReviewTabs(elements.content);

    const handleClose = () => {
      elements.modal.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
      elements.close.removeEventListener('click', handleClose);
    };
    
    elements.close.addEventListener('click', handleClose);
  }

  static _setupReviewTabs(container) {
    // THE FIX: Check viewport width. 1024px is Tailwind's default 'lg' breakpoint.
    if (window.innerWidth >= 1024) {
      // On large screens, ensure all panels are visible, defeating the tab logic.
      const tabPanels = container.querySelectorAll('.tab-panel');
      tabPanels.forEach(panel => panel.classList.remove('hidden'));
      return;
    }
    
    // The rest of this logic will now only run on screens smaller than 1024px.
    const tabs = container.querySelectorAll('[data-tab-target]');
    const tabPanels = container.querySelectorAll('.tab-panel');

    if (tabs.length === 0) return;

    // Set initial state for mobile (show first tab, hide others)
    tabs[0].classList.add('text-blue-600', 'border-blue-600');
    tabs[0].classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
    tabPanels.forEach((panel, index) => {
        if (index !== 0) {
            panel.classList.add('hidden');
        } else {
            panel.classList.remove('hidden');
        }
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('text-blue-600', 'border-blue-600');
                t.classList.add('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
            });
            tab.classList.add('text-blue-600', 'border-blue-600');
            tab.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
            
            const target = document.querySelector(tab.dataset.tabTarget);
            
            tabPanels.forEach(panel => {
                panel.classList.add('hidden');
            });
            
            if (target) {
                target.classList.remove('hidden');
            }
        });
    });
  }

  static _getModalElements(type) {
    const selectors = DOM_SELECTORS.modals[type];
    const elements = {};
    for (const [key, selector] of Object.entries(selectors)) {
      elements[key] = document.querySelector(selector);
    }
    return elements;
  }
}