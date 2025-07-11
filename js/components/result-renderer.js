/**
 * Result display and formatting component
 */
import { DOM_SELECTORS } from '../config/dom-selectors.js';
import { CONSTANTS } from '../config/constants.js';

export class ResultRenderer {
  constructor() {
    this.elements = {
      insufficientWarning: document.querySelector(DOM_SELECTORS.results.insufficientWarning),
      standardContainer: document.querySelector(DOM_SELECTORS.results.standardContainer)
    };
    // NEW: Properties to manage the slideshow state
    this.aiPlanSlides = [];
    this.currentAiPlanSlide = 0;
  }

  init() {
    // No initialization needed, but we ensure event listeners are added after rendering.
  }

  /**
   * REVISED: The main render method now calls a function to attach event listeners
   * for the new slideshow after the HTML has been added to the DOM.
   */
  render(result) {
    if (!result) {
      this._renderError();
      return;
    }

    if (result.insufficientInfo) {
      this._renderInsufficientInfo(result);
    } else {
      this.elements.standardContainer.innerHTML = this._generateStandardResultHTML(result);
      // NEW: Attach event listeners for the slideshow after rendering the content.
      this._attachSlideshowEvents();
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

  /**
   * REWRITTEN: The HTML structure is now dynamically generated based on whether
   * there are warnings or technologies to avoid, creating a more adaptive layout.
   */
  _generateStandardResultHTML(result) {
    const headerCardHtml = this._generateDynamicHeaderCard(result);
    const aiPlanHtml = this._generateAIPlanHTML(result);
    const warningsHtml = this._generateWarningsHTML(result);
    const avoidTechHtml = this._generateAvoidTechHTML(result);
    const feasibilityHtml = this._generateFeasibilityHTML(result);
    const techProfileHtml = this._generateTechProfileHTML(result);
    const teamHtml = this._generateTeamHTML(result);

    const hasSideContent = (result.warnings && result.warnings.length > 0) || (result.avoidTech && result.avoidTech.length > 0);

    let mainContentHtml;

    if (hasSideContent) {
      // If there are warnings, use the two-column layout
      mainContentHtml = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div class="lg:col-span-2 space-y-8">
            ${feasibilityHtml}
            ${techProfileHtml}
          </div>
          <div class="lg:col-span-1 space-y-8">
            ${warningsHtml}
            ${avoidTechHtml}
          </div>
        </div>
      `;
    } else {
      // If no warnings, use a single-column layout where each item is full-width
      mainContentHtml = `
        <div class="space-y-8">
          ${feasibilityHtml}
          ${techProfileHtml}
        </div>
      `;
    }

    const finalHtml = `
        <div class="space-y-8">
            <!-- 1. Header Card (Full Width) -->
            ${headerCardHtml}

            <!-- 2. Main Content (Dynamic Layout) -->
            ${mainContentHtml}

            <!-- 3. Required Team (Full Width) -->
            ${teamHtml}

            <!-- 4. AI Plan Slideshow (Full Width) -->
            ${aiPlanHtml}
        </div>
    `;
    
    return finalHtml;
  }

  _generateAIPlanHTML(result) {
    if (!result.aiPlanStatus) return '';

    // Handle skipped or error states first
    if (result.aiPlanStatus === 'error') {
      return `<div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert"><strong>Error:</strong><p>${result.aiGeneratedPlan}</p></div>`;
    }
    if (result.aiPlanStatus === 'skipped') {
      return `<div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert"><p>The AI plan was skipped because a project description was not provided. Please start over and fill in the description to use this feature.</p></div>`;
    }

    // Split the markdown content into slides using the H3 heading as a delimiter.
    this.aiPlanSlides = result.aiGeneratedPlan.split(/(?=###\s)/g).filter(s => s.trim() !== '');
    this.currentAiPlanSlide = 0;

    // If splitting fails or there's no content, show a fallback.
    if (this.aiPlanSlides.length === 0) {
      return `<div class="prose prose-blue max-w-none bg-gray-50 p-6 rounded-md border">${marked.parse(result.aiGeneratedPlan)}</div>`;
    }

    // Build the slideshow structure
    return `
        <div class="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800 mb-1 flex items-center">
            <span class="mr-3 text-2xl">🤖</span> AI-Generated Strategic Plan
          </h3>
          <p class="text-sm text-gray-500 mb-4">The following plan was generated by an AI assistant. Use the arrows to navigate through the sections.</p>
          
          <div id="ai-plan-slideshow" class="relative">
            <div id="ai-plan-slides-container" class="bg-gray-50 p-6 rounded-md border prose prose-blue max-w-none min-h-[300px] transition-opacity duration-300 ease-in-out">
              <!-- The first slide is rendered initially -->
              ${marked.parse(this.aiPlanSlides[0] || '')}
            </div>

            <!-- Navigation Controls -->
            <div class="flex justify-between items-center mt-4">
                <button id="ai-plan-prev-btn" class="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors rounded-lg flex items-center">
                    <svg class="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    Previous
                </button>
                <div id="ai-plan-counter" class="text-sm font-medium text-gray-600">
                    Section 1 of ${this.aiPlanSlides.length}
                </div>
                <button id="ai-plan-next-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center">
                    Next
                    <svg class="h-5 w-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
            </div>
          </div>
        </div>
    `;
  }

  _attachSlideshowEvents() {
    const slideshow = document.getElementById('ai-plan-slideshow');
    if (!slideshow) return;

    const prevBtn = document.getElementById('ai-plan-prev-btn');
    const nextBtn = document.getElementById('ai-plan-next-btn');

    prevBtn?.addEventListener('click', () => this._changeAiPlanSlide(-1));
    nextBtn?.addEventListener('click', () => this._changeAiPlanSlide(1));

    this._updateSlideshowControls(); // Set initial button states
  }

  _changeAiPlanSlide(direction) {
    const newIndex = this.currentAiPlanSlide + direction;
    if (newIndex >= 0 && newIndex < this.aiPlanSlides.length) {
      this.currentAiPlanSlide = newIndex;
      this._renderCurrentAiPlanSlide();
      this._updateSlideshowControls();
    }
  }

  _renderCurrentAiPlanSlide() {
    const container = document.getElementById('ai-plan-slides-container');
    if (!container) return;

    // Fade out
    container.style.opacity = '0';

    // Wait for the fade-out transition to finish, then update content and fade in.
    setTimeout(() => {
      container.innerHTML = marked.parse(this.aiPlanSlides[this.currentAiPlanSlide] || '');
      // Fade in
      container.style.opacity = '1';
    }, 150);
  }

  _updateSlideshowControls() {
    const prevBtn = document.getElementById('ai-plan-prev-btn');
    const nextBtn = document.getElementById('ai-plan-next-btn');
    const counter = document.getElementById('ai-plan-counter');

    if (prevBtn) {
      prevBtn.disabled = this.currentAiPlanSlide === 0;
    }
    if (nextBtn) {
      nextBtn.disabled = this.currentAiPlanSlide >= this.aiPlanSlides.length - 1;
    }
    if (counter) {
      counter.textContent = `Section ${this.currentAiPlanSlide + 1} of ${this.aiPlanSlides.length}`;
    }
  }

  _generateDynamicHeaderCard(result) {
    let cardText = '';
    let cardStyle = 'bg-gray-50 border border-gray-300 text-gray-700';
    let icon = '⚙️';

    const scopeTitle = result.scope_title || 'Project';
    const confidence = result.feasibility?.confidence?.toLowerCase();

    if (confidence === 'high' || confidence === 'very high') {
      cardText = `This ${scopeTitle} project looks promising and is likely highly feasible.`;
      cardStyle = 'bg-green-50 border border-green-300 text-green-800';
      icon = '✅';
    } else if (confidence === 'medium') {
      cardText = `This ${scopeTitle} project shows potential, but requires careful planning to ensure feasibility. Consider addressing highlighted warnings and risks.`;
      cardStyle = 'bg-yellow-50 border border-yellow-300 text-yellow-800';
      icon = '🤔';
    } else if (confidence === 'low' || confidence === 'very low') {
      cardText = `This ${scopeTitle} project faces significant feasibility challenges. Addressing the warnings and risks identified is crucial before proceeding.`;
      cardStyle = 'bg-red-50 border border-red-300 text-red-700';
      icon = '⚠️';
    } else {
      cardText = `Assessment summary for this ${scopeTitle} project. Review the details below.`;
    }

    return `
      <div class="${cardStyle} shadow-lg rounded-xl p-6 md:p-8">
        <div class="flex items-start">
          <span class="text-3xl mr-4">${icon}</span>
          <div>
            <h2 class="text-xl md:text-2xl font-semibold mb-2">Feasibility Outlook for ${scopeTitle}</h2>
            <p class="text-base">${cardText}</p>
          </div>
        </div>
      </div>`;
  }

  _generateWarningsHTML(result) {
    if (!result.warnings || result.warnings.length === 0) return '';
    return `
        <div class="bg-white shadow-xl rounded-lg p-6 border-t-4 border-yellow-400">
          <h3 class="text-xl font-semibold text-yellow-800 mb-4 flex items-center">
            <svg class="h-6 w-6 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.25 3.031-1.743 3.031H4.42c-1.493 0-2.493-1.701-1.743-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm0-3.75a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75z" clip-rule="evenodd"/></svg>
            Important Warnings
          </h3>
          <ul class="space-y-3">
            ${result.warnings.map(warning => `
              <li class="flex items-start text-yellow-700 text-sm">
                <svg class="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                <span>${warning}</span>
              </li>`).join('')}
          </ul>
        </div>
      `;
  }

  _generateAvoidTechHTML(result) {
    if (!result.avoidTech || result.avoidTech.length === 0) return '';
    return `
        <div class="bg-white shadow-xl rounded-lg p-6 border-t-4 border-red-400">
          <h3 class="text-xl font-semibold text-red-800 mb-4 flex items-center">
            <svg class="h-6 w-6 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 101.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
            Technologies to Avoid
          </h3>
          <ul class="space-y-3">
            ${result.avoidTech.map(tech => `
              <li class="flex items-start text-red-700 text-sm">
                <svg class="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 101.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
                <span>${tech}</span>
              </li>`).join('')}
          </ul>
        </div>
      `;
  }

  _generateFeasibilityHTML(result) {
    if (!result.eta && !result.feasibility) return '';
    let html = `
        <div class="bg-white shadow-xl rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-800 mb-1 flex items-center">
            <span class="mr-2">📊</span> Project Estimates & Feasibility
          </h3>
          <p class="text-sm text-gray-500 mb-6">Key projections for project timeline and viability.</p>
          <div class="space-y-6">`;

    if (result.feasibility) {
      html += `
            <div class="bg-indigo-50/60 border border-indigo-200 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-200">
              <h4 class="text-lg font-semibold text-indigo-800 mb-3 flex items-center">
                <span class="mr-2">🎯</span> Feasibility Assessment
              </h4>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between items-center">
                  <span class="font-medium text-gray-700">Risk Level:</span>
                  <span class="px-3 py-1 rounded-full text-xs font-bold ${this._getRiskBadgeClasses(result.feasibility.risk)}">${result.feasibility.risk}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-medium text-gray-700">Feasibility Confidence:</span>
                  <span class="px-3 py-1 rounded-full text-xs font-bold ${this._getConfidenceBadgeClasses(result.feasibility.confidence)}">${result.feasibility.confidence}</span>
                </div>
                ${result.feasibility.summary ? `<p class="mt-3 text-xs text-gray-600 pt-3 border-t border-indigo-200/50">${result.feasibility.summary}</p>` : ''}
              </div>
            </div>`;
    }

    if (result.eta) {
      html += `
            <div class="bg-gray-50/70 border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h4 class="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                <span class="mr-2">⏱️</span> Timeline Estimate
              </h4>
              <div class="text-center">
                <span class="text-3xl md:text-4xl font-bold text-indigo-600">${result.eta.min === result.eta.max ? `${result.eta.min}` : `${result.eta.min} - ${result.eta.max}`}</span>
                <span class="text-xl text-gray-500 ml-1">months</span>
                <p class="text-xs text-gray-500 mt-1">${result.scope_title || 'Project'} Duration</p>
              </div>
            </div>`;
    }
    html += `
          </div>
        </div>
      `;
    return html;
  }

  _generateTechProfileHTML(result) {
    if (!result.techProfile || Object.keys(result.techProfile).length === 0) return '';
    return `
        <div class="bg-white shadow-xl rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-800 mb-1 flex items-center">
            <span class="mr-2">🔧</span> Technology Profile
          </h3>
          <p class="text-sm text-gray-500 mb-4">Recommended technologies and platforms.</p>
          <div class="overflow-x-auto rounded-md border border-gray-200">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aspect</th>
                  <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommendation</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${Object.entries(result.techProfile).map(([key, value], index) => `
                  <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}">
                    <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">${this._formatAspectName(key)}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${value}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
  }

  _generateTeamHTML(result) {
    if (!result.roles || Object.keys(result.roles).length === 0) return '';
    return `
        <div class="bg-white shadow-xl rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-800 mb-1 flex items-center">
            <span class="mr-2">👥</span> Required Team
          </h3>
          <p class="text-sm text-gray-500 mb-4">Key roles and expertise needed for successful execution.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${Object.entries(result.roles).map(([roleKey, role]) => `
              <div class="bg-indigo-50/50 border border-indigo-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <h4 class="font-semibold text-indigo-800 text-md">${role.title || this._formatAspectName(roleKey)}</h4>
                <div class="mt-2 space-y-2 text-sm text-gray-700">
                  ${role.allocation ? `<div><strong class="text-gray-600">Allocation:</strong> ${role.allocation}</div>` : ''}
                  ${role.priority ? `<div><strong class="text-gray-600">Priority:</strong> ${role.priority}</div>` : ''}
                  ${role.experience ? `<div><strong class="text-gray-600">Experience:</strong> ${role.experience}</div>` : ''}
                  ${role.knowledge ? `<div><strong class="text-gray-600">Knowledge:</strong> ${role.knowledge}</div>` : ''}
                  ${role.criticalSkills ? `<div><strong class="text-gray-600">Critical Skills:</strong> ${Array.isArray(role.criticalSkills) ? role.criticalSkills.join(', ') : role.criticalSkills}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
  }

  _formatAspectName(key) {
    return  key.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
  }

  _getRiskBadgeClasses(risk) {
    switch (risk?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'high':
        return 'bg-red-100 text-red-700 border border-red-300';
      case 'very high':
        return 'bg-red-100 text-red-700 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  }

  _getConfidenceBadgeClasses(confidenceLevel) {
    switch (confidenceLevel?.toLowerCase()) {
      case 'very high':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'high':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'low':
        return 'bg-red-100 text-red-700 border border-red-300';
      case 'very low':
        return 'bg-red-100 text-red-700 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  }
}
