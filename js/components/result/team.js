import { Formatters } from '../../utils/formatters.js';

export class ResultTeam {
  static render(result) {
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
                <h4 class="font-semibold text-indigo-800 text-md">${role.title || Formatters.formatAspectName(roleKey)}</h4>
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
}