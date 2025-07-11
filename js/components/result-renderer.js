/**
 * Result display and formatting orchestrator
 */
import { DOM_SELECTORS } from '../config/dom-selectors.js';
import { CONSTANTS } from '../config/constants.js';
import { ResultHeader } from './result/header.js';
import { ResultWarnings } from './result/warnings.js';
import { ResultFeasibility } from './result/feasibility.js';
import { ResultTechProfile } from './result/tech-profile.js';
import { ResultTeam } from './result/team.js';
import { ResultAIPlan } from './result/ai-plan.js';

export class ResultRenderer {
  constructor() {
    this.elements = {
      insufficientWarning: document.querySelector(DOM_SELECTORS.results.insufficientWarning),
      standardContainer: document.querySelector(DOM_SELECTORS.results.standardContainer)
    };
    this.aiPlan = new ResultAIPlan();
  }

  render(result) {
    if (!result) {
      this._renderError();
      return;
    }

    if (result.insufficientInfo) {
      this._renderInsufficientInfo(result);
    } else {
      this.elements.standardContainer.innerHTML = this._generateStandardResultHTML(result);
      this.aiPlan.attachSlideshowEvents();
    }
  }

  renderLoading() {
    this.elements.standardContainer?.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
    this.elements.insufficientWarning?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
    
    if (this.elements.standardContainer) {
        this.elements.standardContainer.innerHTML = `
            <div class="text-center p-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">Generating Your Custom Project Plan...</h3>
                <p class="text-gray-600 mb-6 max-w-2xl mx-auto">Our AI is analyzing your responses to create a detailed strategic roadmap. This may take a moment.</p>
                <div class="flex justify-center items-center">
                    <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            </div>
        `;
    }
  }

  _renderInsufficientInfo(result) {
    this.elements.standardContainer?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
    this.elements.insufficientWarning?.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
    
    if (this.elements.insufficientWarning) {
      this.elements.insufficientWarning.innerHTML = `
      <div class="py-2">
        <div class="bg-yellow-50 border-l-4 border-yellow-400 shadow-xl rounded-r-lg p-6 max-w-3xl mx-auto">
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
      </div>
      `;
    }
  }

  _renderError() {
    if (this.elements.standardContainer) {
      this.elements.standardContainer.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-red-800">Error</h3>
          <p class="text-red-700">Unable to generate assessment result. Please try again.</p>
        </div>
      `;
    }
  }

  _generateStandardResultHTML(result) {
    const headerCardHtml = ResultHeader.render(result);
    const warningsHtml = ResultWarnings.render(result);
    const feasibilityHtml = ResultFeasibility.render(result);
    const techProfileHtml = ResultTechProfile.render(result);
    const teamHtml = ResultTeam.render(result);
    const aiPlanHtml = this.aiPlan.render(result);

    const hasSideContent = (result.warnings && result.warnings.length > 0) || (result.avoidTech && result.avoidTech.length > 0);

    let mainContentHtml;

    if (hasSideContent) {
      mainContentHtml = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div class="lg:col-span-2 space-y-8">
            ${feasibilityHtml}
            ${techProfileHtml}
          </div>
          <div class="lg:col-span-1 space-y-8">
            ${warningsHtml}
          </div>
        </div>
      `;
    } else {
      mainContentHtml = `
        <div class="space-y-8">
          ${feasibilityHtml}
          ${techProfileHtml}
        </div>
      `;
    }

    return `
        <div class="space-y-8">
            ${headerCardHtml}
            ${mainContentHtml}
            ${teamHtml}
            ${aiPlanHtml}
        </div>
    `;
  }
}