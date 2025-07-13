import { getRiskBadgeClasses, getConfidenceBadgeClasses } from '../../utils/ui-helpers.js';

export class ResultFeasibility {
  static render(result) {
    if (!result.eta && !result.feasibility) return '';
    let html = `
        <div class="bg-white shadow-xl rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-800 mb-1 flex items-center">
            <span class="mr-2">📊</span> Project Estimates & Feasibility
          </h3>
          <p class="text-sm text-gray-500 mb-6">Key projections for project timeline and viability.</p>
          <div class="flex flex-col md:flex-row wide:flex-col gap-6">`;

    if (result.feasibility) {
      html += `
            <div class="flex-1 bg-indigo-50/60 border border-indigo-200 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-200">
              <h4 class="text-lg font-semibold text-indigo-800 mb-3 flex items-center">
                <span class="mr-2">🎯</span> Feasibility Assessment
              </h4>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between items-center">
                  <span class="font-medium text-gray-700">Risk Level:</span>
                  <span class="px-3 py-1 rounded-full text-xs font-bold ${getRiskBadgeClasses(result.feasibility.risk)}">${result.feasibility.risk}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-medium text-gray-700">Feasibility:</span>
                  <span class="px-3 py-1 rounded-full text-xs font-bold ${getConfidenceBadgeClasses(result.feasibility.confidence)}">${result.feasibility.confidence}</span>
                </div>
                ${result.feasibility.summary ? `<p class="mt-3 text-xs text-gray-600 pt-3 border-t border-indigo-200/50">${result.feasibility.summary}</p>` : ''}
              </div>
            </div>`;
    }

    if (result.eta) {
      html += `
            <div class="flex-1 bg-gray-50/70 border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
              <h4 class="text-lg font-semibold text-gray-700 flex items-center mb-3">
                <span class="mr-2">⏱️</span> Timeline Estimate
              </h4>
              <div class="flex-grow flex flex-col justify-center">
                <div class="text-center">
                  <div>
                    <span class="text-3xl md:text-4xl font-bold text-indigo-600">${result.eta.min === result.eta.max ? `${result.eta.min}` : `${result.eta.min} - ${result.eta.max}`}</span>
                    <span class="text-xl text-gray-500 ml-1">months</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">${result.scope_title || 'Project'} Duration</p>
                </div>
              </div>
            </div>`;
    }
    html += `
          </div>
        </div>
      `;
    return html;
  }
}