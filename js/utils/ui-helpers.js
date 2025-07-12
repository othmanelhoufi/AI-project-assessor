/**
 * Utility functions for assisting with UI rendering and styling.
 */

/**
 * Returns Tailwind CSS classes for a risk level badge.
 * @param {string} risk - The risk level ('Low', 'Medium', 'High', 'Very High').
 * @returns {string} The CSS classes for the badge.
 */
export function getRiskBadgeClasses(risk) {
  const riskLower = risk?.toLowerCase();
  if (riskLower === 'low') return 'bg-green-100 text-green-800';
  if (riskLower === 'medium') return 'bg-yellow-100 text-yellow-800';
  if (riskLower === 'high' || riskLower === 'very high') return 'bg-red-100 text-red-700';
  return 'bg-gray-200 text-gray-800';
}

/**
 * Returns Tailwind CSS classes for a confidence level badge.
 * @param {string} confidence - The confidence level ('Low', 'Medium', 'High', 'Very High').
 * @returns {string} The CSS classes for the badge.
 */
export function getConfidenceBadgeClasses(confidence) {
  const confidenceLower = confidence?.toLowerCase();
  if (confidenceLower === 'very high' || confidenceLower === 'high') return 'bg-green-100 text-green-800';
  if (confidenceLower === 'medium') return 'bg-yellow-100 text-yellow-800';
  if (confidenceLower === 'low' || confidenceLower === 'very low') return 'bg-red-100 text-red-700';
  return 'bg-gray-200 text-gray-800';
}