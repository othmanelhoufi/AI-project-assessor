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
  }

  init() {
    // Initialize if needed
  }

  render(result) {
    if (!result) {
      this._renderError();
      return;
    }

    if (result.insufficientInfo) {
      this._renderInsufficientInfo(result);
    } else {
      this._renderStandardResult(result);
    }
  }

  _renderInsufficientInfo(result) {
    this.elements.standardContainer?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
    this.elements.insufficientWarning?.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
    
    if (this.elements.insufficientWarning) {
      // Ensure the overall container for this message allows it to take appropriate width
      // This might be styled by parent CSS for DOM_SELECTORS.results.insufficientWarning
      // We add py-2 for consistency with the standard results main container.
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

  _renderStandardResult(result) {
    this.elements.insufficientWarning?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
    this.elements.standardContainer?.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);
    
    if (this.elements.standardContainer) {
      this.elements.standardContainer.innerHTML = this._generateStandardResultHTML(result);
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
    let html = `
      <div class="space-y-8 p-4 md:p-6 lg:p-8"> <!-- Adjusted padding for overall container -->
        <!-- Header Card: Scope Title and Summary -->
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl rounded-xl p-6 md:p-8">
          <h2 class="text-xl md:text-2xl font-semibold text-indigo-200 mb-1">Assessment Report For:</h2>
          <p class="text-2xl md:text-3xl font-bold mb-3">${result.scope_title || 'Unnamed Project'}</p>
          <hr class="border-indigo-400/50 my-4">
          <h3 class="text-lg font-semibold text-indigo-200 mb-1">Key Summary:</h3>
          <p class="text-indigo-100 text-base">${result.summary || 'No summary provided.'}</p>
        </div>
    `;

    // Combined ETA and Feasibility Card
    if (result.eta || result.feasibility) {
      html += `
        <div class="bg-white shadow-xl rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-800 mb-1 flex items-center">
            <span class="mr-2">📊</span> Project Estimates & Feasibility
          </h3>
          <p class="text-sm text-gray-500 mb-6">Key projections for project timeline and viability.</p>
          <div class="space-y-6">`; // Changed from grid to space-y for vertical stacking of sub-cards

      // Feasibility Assessment Sub-Card (More Prominent)
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
                  <span class="font-medium text-gray-700">Confidence:</span>
                  <span class="text-gray-800 font-medium">${result.feasibility.confidence}</span>
                </div>
                ${result.feasibility.summary ? `<p class="mt-3 text-xs text-gray-600 pt-3 border-t border-indigo-200/50">${result.feasibility.summary}</p>` : ''}
              </div>
            </div>`;
      }

      // Timeline Estimate Sub-Card
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
    }

    // Technology Profile
    if (result.techProfile && Object.keys(result.techProfile).length > 0) {
      html += `
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
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">${value}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // Team Composition
    if (result.roles && Object.keys(result.roles).length > 0) {
      html += `
        <div class="bg-white shadow-xl rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-800 mb-1 flex items-center">
            <span class="mr-2">👥</span> Required Team
          </h3>
          <p class="text-sm text-gray-500 mb-4">Key roles and expertise needed for successful execution.</p>
          <div class="space-y-4">
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

    // Warnings
    if (result.warnings && result.warnings.length > 0) {
      html += `
        <div class="bg-yellow-50 border-l-4 border-yellow-400 shadow-xl rounded-r-lg p-6">
          <h3 class="text-xl font-semibold text-yellow-800 mb-1 flex items-center">
            <svg class="h-6 w-6 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.25 3.031-1.743 3.031H4.42c-1.493 0-2.493-1.701-1.743-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm0-3.75a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75z" clip-rule="evenodd"/></svg>
            Important Warnings
          </h3>
          <p class="text-sm text-yellow-600 mb-4 ml-8">Pay close attention to these potential issues.</p>
          <ul class="space-y-2 ml-8">
            ${result.warnings.map(warning => `
              <li class="flex items-start text-yellow-700">
                <svg class="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.25 3.031-1.743 3.031H4.42c-1.493 0-2.493-1.701-1.743-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm0-3.75a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75z" clip-rule="evenodd" /></svg>
                <span>${warning}</span>
              </li>`).join('')}
          </ul>
        </div>
      `;
    }

    // Technologies to Avoid
    if (result.avoidTech && result.avoidTech.length > 0) {
      html += `
        <div class="bg-red-50 border-l-4 border-red-400 shadow-xl rounded-r-lg p-6">
          <h3 class="text-xl font-semibold text-red-800 mb-1 flex items-center">
            <svg class="h-6 w-6 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 101.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
            Technologies to Avoid
          </h3>
          <p class="text-sm text-red-600 mb-4 ml-8">Consider alternatives for these technologies or approaches.</p>
          <ul class="space-y-2 ml-8">
            ${result.avoidTech.map(tech => `
              <li class="flex items-start text-red-700">
                <svg class="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 101.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
                <span>${tech}</span>
              </li>`).join('')}
          </ul>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  _formatAspectName(key) {
    return key.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
  }

  _getRiskBadgeClasses(risk) {
    switch (risk?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-700 border border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'very high': return 'bg-red-100 text-red-700 border border-red-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  }

  _getRiskColor(risk) { // Old method, can be removed if not used elsewhere, but safer to keep for now if other parts depend on it.
    switch (risk?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800'; // Kept original values in case this is still used
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'very high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
