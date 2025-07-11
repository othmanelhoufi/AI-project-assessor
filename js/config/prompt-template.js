/**
 * Prompt template for the AI-powered strategic plan generation.
 */
import { DataService } from '../services/data-service.js';

/**
 * Constructs a detailed prompt for the Gemini API.
 * @param {string} description - The user's project description.
 * @param {object} answers - The user's answers to the questionnaire.
 * @param {object} initialResult - The initial rule-based assessment result.
 * @returns {string} A comprehensive prompt string.
 */
export const buildAIPrompt = (description, answers, initialResult) => {
    let qaSummary = 'The user provided the following information through a questionnaire:\n';
    for (const [questionId, answerValue] of Object.entries(answers)) {
        if (questionId === 'project_description') continue;
        const question = DataService.getQuestionById(questionId);
        const option = DataService.getOptionByValue(questionId, answerValue);
        if (question && option) {
            qaSummary += `- Q: ${question.text}\n  A: ${option.label}\n`;
        }
    }

    const initialResultSummary = `
Based on the user's answers, a preliminary rule-based assessment was generated:
- **Feasibility:** Risk is ${initialResult.feasibility.risk}, Confidence is ${initialResult.feasibility.confidence}.
- **Timeline:** Estimated ${initialResult.eta.min}-${initialResult.eta.max} months for a ${initialResult.scope_title}.
- **Recommended Tech Profile:** ${JSON.stringify(initialResult.techProfile, null, 2)}
- **Required Team Roles:** ${Object.values(initialResult.roles).map(r => r.title).join(', ')}
- **Critical Warnings:**\n${initialResult.warnings.map(w => `  - ${w}`).join('\n')}
- **Technologies to Avoid:**\n${initialResult.avoidTech.map(t => `  - ${t}`).join('\n')}
    `;

    return `
You are an expert AI strategy consultant. Your task is to create a comprehensive, actionable project plan for a client based on the information they provided.

**Client's Project Description:**
---
${description}
---

**Questionnaire Summary:**
---
${qaSummary}
---

**Initial Rule-Based Assessment:**
---
${initialResultSummary}
---

**Your Task:**

Based on ALL the information above, generate a detailed and professional project plan. The plan should be structured in Markdown format with the following sections:

### 1. Executive Summary
- A high-level overview of the project, its goals, and the recommended approach. Synthesize the user's description and the assessment's findings into a coherent summary.

### 2. Strategic Recommendations
- Elaborate on the initial assessment. Why is the recommended technology a good fit? What are the key strategic considerations?
- Discuss the feasibility and risks in more detail, providing context for the warnings and suggesting mitigation strategies.

### 3. Phased Project Roadmap
- Create a clear, phased roadmap (e.g., Phase 1: Discovery & PoC, Phase 2: MVP Development, Phase 3: Production & Scale).
- For each phase, define:
  - **Objectives:** What are the goals of this phase?
  - **Key Activities:** List the main tasks (e.g., Data Collection, Model Training, API Development).
  - **Deliverables:** What will be produced (e.g., Feasibility Report, Deployed Model API)?
  - **Estimated Timeline:** A timeline for the phase (e.g., 2-4 weeks).

### 4. Team & Resource Plan
- Detail the roles identified in the initial assessment.
- For each role, describe their key responsibilities within this specific project context.
- Suggest an allocation percentage for each phase (e.g., ML Engineer: 50% in Phase 1, 100% in Phase 2).

### 5. Budgetary Considerations
- Provide a high-level budget breakdown. You don't have exact figures, so use categories and relative costs.
- Example categories: Personnel (by role), Cloud Infrastructure (compute, storage), Third-Party APIs/Data, Contingency (15-20%).
- Provide advice on how to manage the budget effectively.

### 6. Next Steps
- A clear, actionable list of the immediate next steps the client should take (e.g., "Schedule a data audit with your engineering team," "Finalize KPIs for success measurement").

**Tone:** Professional, authoritative, and helpful. Your goal is to provide a document that a consultant could confidently present to a client. Use clear headings, bullet points, and bold text to improve readability.
    `;
};
