export class ResultWarnings {
  static render(result) {
    const warningsHtml = this._generateWarningsHTML(result);
    const avoidTechHtml = this._generateAvoidTechHTML(result);

    if (!warningsHtml && !avoidTechHtml) {
      return '';
    }

    return `
      <div class="space-y-8">
        ${warningsHtml}
        ${avoidTechHtml}
      </div>
    `;
  }

  static _generateWarningsHTML(result) {
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

  static _generateAvoidTechHTML(result) {
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
}