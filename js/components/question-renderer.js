/**
 * Renders individual question cards for the assessment wizard.
 */
export class QuestionRenderer {
  /**
   * Generates the HTML for a single question card.
   * @param {object} question - The question object from the assessment data.
   * @param {string|null} answer - The current answer for this question, if any.
   * @returns {string} The HTML string for the question card.
   */
  static render(question, answer) {
    let isAnswered = answer !== undefined && answer !== null && answer !== '';
    if (question.type === 'textarea') {
      isAnswered = answer && answer.trim().length > 0;
    }

    const cardBorderColor = isAnswered ? 'border-green-400' : 'border-gray-300';
    const cardBgColor = isAnswered ? 'bg-green-50' : 'bg-white';

    if (question.type === 'textarea') {
      return this._renderTextarea(question, answer, cardBorderColor, cardBgColor);
    }
    
    return this._renderRadio(question, answer, cardBorderColor, cardBgColor);
  }

  static _renderTextarea(question, answer, borderColor, bgColor) {
    const currentLength = answer?.length || 0;
    const minLength = 300;
    const lengthColor = currentLength >= minLength ? 'text-green-600' : 'text-red-600';

    return `
      <div id="question-card-${question.id}" class="bg-white rounded-lg shadow-sm border ${borderColor} ${bgColor} p-6 transition-colors duration-300">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">${question.text}</h3>
        <textarea
            id="textarea-${question.id}"
            class="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="${question.placeholder || ''}"
            oninput="window.assessmentApp.setAnswer('${question.id}', this.value)"
        >${answer || ''}</textarea>
        <div class="text-right text-sm mt-2 ${lengthColor}" id="char-count-${question.id}">
            ${currentLength} / ${minLength} characters minimum
        </div>
      </div>
    `;
  }

  static _renderRadio(question, answer, borderColor, bgColor) {
    return `
      <div id="question-card-${question.id}" class="bg-white rounded-lg shadow-sm border ${borderColor} ${bgColor} p-6 transition-colors duration-300">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">${question.text}</h3>
        <div class="space-y-3">
          ${question.options.map(option => {
            const isChecked = answer === option.value;
            return `
              <label class="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                isChecked ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-gray-200'
              }">
                <input 
                  type="radio" 
                  name="answer-${question.id}" 
                  value="${option.value}" 
                  class="mt-1 mr-3 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  ${isChecked ? 'checked' : ''}
                  onchange="window.assessmentApp.setAnswer('${question.id}', '${option.value}')"
                >
                <div>
                  <span class="font-medium text-gray-900">${option.label}</span>
                  ${option.is_uncertain ? '<p class="text-sm text-yellow-700 mt-1">⚠️ This choice indicates uncertainty and may require follow-up.</p>' : ''}
                </div>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
}