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
      this.elements.insufficientWarning.innerHTML = `
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <span class="text-2xl">⚠️</span>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-semibold text-yellow-800">Insufficient Information</h3>
              <p class="mt-2 text-yellow-700">${result.insufficientInfoMessage}</p>
              ${result.uncertainAreas ? `
                <div class="mt-4">
                  <h4 class="font-medium text-yellow-800">Areas needing clarification:</h4>
                  <ul class="mt-2 list-disc list-inside text-yellow-700">
                    ${result.uncertainAreas.map(area => `<li>${area}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
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
      <div class="space-y-6">
        <!-- Summary -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 class="text-xl font-semibold text-blue-800 mb-3">📋 Assessment Summary</h3>
          <p class="text-blue-700">${result.summary}</p>
        </div>
    `;

    // Risk and Feasibility
    if (result.feasibility) {
      html += `
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">🎯 Project Feasibility</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span class="font-medium">Risk Level:</span>
              <span class="ml-2 px-2 py-1 rounded text-sm ${this._getRiskColor(result.feasibility.risk)}">${result.feasibility.risk}</span>
            </div>
            <div>
              <span class="font-medium">Confidence:</span>
              <span class="ml-2">${result.feasibility.confidence}</span>
            </div>
          </div>
          ${result.feasibility.summary ? `<p class="mt-3 text-gray-600">${result.feasibility.summary}</p>` : ''}
        </div>
      `;
    }

    // Technology Profile
    if (result.techProfile && Object.keys(result.techProfile).length > 0) {
      html += `
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">🔧 Technology Profile</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-2 font-medium text-gray-900">Aspect</th>
                  <th class="text-left py-2 font-medium text-gray-900">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(result.techProfile).map(([key, value]) => `
                  <tr class="border-b border-gray-100">
                    <td class="py-2 font-medium text-gray-700">${this._formatAspectName(key)}</td>
                    <td class="py-2 text-gray-600">${value}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // Timeline
    if (result.eta) {
      html += `
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">⏱️ Timeline Estimate</h3>
          <div class="text-center">
            <div class="text-3xl font-bold text-indigo-600">
              ${result.eta.min === result.eta.max ? `${result.eta.min}` : `${result.eta.min}-${result.eta.max}`}
            </div>
            <div class="text-gray-600">months</div>
            <div class="text-sm text-gray-500 mt-2">${result.scope_title || 'Project'} Duration</div>
          </div>
        </div>
      `;
    }

    // Team Composition
    if (result.roles && Object.keys(result.roles).length > 0) {
      html += `
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">👥 Required Team</h3>
          <div class="grid gap-4">
            ${Object.entries(result.roles).map(([roleKey, role]) => `
              <div class="border border-gray-200 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900">${role.title || this._formatAspectName(roleKey)}</h4>
                <div class="mt-2 space-y-1 text-sm text-gray-600">
                  ${role.allocation ? `<div><span class="font-medium">Allocation:</span> ${role.allocation}</div>` : ''}
                  ${role.priority ? `<div><span class="font-medium">Priority:</span> ${role.priority}</div>` : ''}
                  ${role.experience ? `<div><span class="font-medium">Experience:</span> ${role.experience}</div>` : ''}
                  ${role.knowledge ? `<div><span class="font-medium">Knowledge:</span> ${role.knowledge}</div>` : ''}
                  ${role.criticalSkills ? `<div><span class="font-medium">Critical Skills:</span> ${Array.isArray(role.criticalSkills) ? role.criticalSkills.join(', ') : role.criticalSkills}</div>` : ''}
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
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-yellow-800 mb-4">⚠️ Important Warnings</h3>
          <ul class="space-y-2">
            ${result.warnings.map(warning => `<li class="text-yellow-700">• ${warning}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // Technologies to Avoid
    if (result.avoidTech && result.avoidTech.length > 0) {
      html += `
        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-red-800 mb-4">🚫 Technologies to Avoid</h3>
          <ul class="space-y-2">
            ${result.avoidTech.map(tech => `<li class="text-red-700">• ${tech}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // Success Factors
    if (result.successFactors && result.successFactors.length > 0) {
      html += `
        <div class="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-green-800 mb-4">✅ Key Success Factors</h3>
          <ul class="space-y-2">
            ${result.successFactors.map(factor => `<li class="text-green-700">• ${factor}</li>`).join('')}
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

  _getRiskColor(risk) {
    switch (risk?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'very high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
