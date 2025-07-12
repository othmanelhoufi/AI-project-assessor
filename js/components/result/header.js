export class ResultHeader {
  static render(result) {
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
}