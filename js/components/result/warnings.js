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
        <div class="bg-white shadow-lg rounded-lg p-6 border-l-4 border-yellow-400">
          <h3 class="text-base md:text-lg font-semibold text-yellow-800 mb-4 flex items-center">
            <span class="text-2xl mr-3">⚠️</span>
            Important Warnings
          </h3>
          <ul class="space-y-3">
            ${result.warnings.map(warning => `
              <li class="flex items-start text-yellow-700 text-sm">
                <span class="font-bold mr-2 text-yellow-600">&bull;</span>
                <span>${warning}</span>
              </li>`).join('')}
          </ul>
        </div>
      `;
  }

  static _generateAvoidTechHTML(result) {
    if (!result.avoidTech || result.avoidTech.length === 0) return '';
    return `
        <div class="bg-white shadow-lg rounded-lg p-6 border-l-4 border-red-400">
          <h3 class="text-base md:text-lg font-semibold text-red-800 mb-4 flex items-center">
            <span class="text-2xl mr-3">🚫</span>
            Technologies to Avoid
          </h3>
          <ul class="space-y-3">
            ${result.avoidTech.map(tech => `
              <li class="flex items-start text-red-700 text-sm">
                <span class="font-bold mr-2 text-red-600">&bull;</span>
                <span>${tech}</span>
              </li>`).join('')}
          </ul>
        </div>
      `;
  }
}