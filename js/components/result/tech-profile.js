import { Formatters } from '../../utils/formatters.js';

export class ResultTechProfile {
  static render(result) {
    if (!result.techProfile || Object.keys(result.techProfile).length === 0) return '';

    const { Category, summary, ...otherProfileItems } = result.techProfile;
    const priorityItems = { ...(Category && { Category }), ...(summary && { summary }) };

    const priorityHtml = Object.entries(priorityItems).map(([key, value], index) => `
        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}">
          <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">${Formatters.formatAspectName(key)}</td>
          <td class="px-4 py-3 text-sm text-gray-600">${value}</td>
        </tr>
      `).join('');

    const otherHtml = Object.entries(otherProfileItems).map(([key, value], index) => `
        <tr class="${(index + Object.keys(priorityItems).length) % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}">
          <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">${Formatters.formatAspectName(key)}</td>
          <td class="px-4 py-3 text-sm text-gray-600">${value}</td>
        </tr>
      `).join('');

    return `
        <div class="bg-white shadow-xl rounded-lg p-6">
          <h3 class="text-lg md:text-xl font-semibold text-gray-800 mb-1 flex items-center">
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
                ${priorityHtml}
                ${otherHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
  }
}