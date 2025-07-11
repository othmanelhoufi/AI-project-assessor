/**
 * Assessment logic and result generation service.
 * This service now works with the refactored, modular data structure and integrates with Generative AI.
 */
import { stateManager } from '../managers/state-manager.js';
import { DataService } from './data-service.js';
import { ENV } from '../config/env.js'; // Import environment variables
import { buildAIPrompt } from '../config/prompt-template.js'; // Import the new prompt builder

export class AssessmentService {
  /**
   * Generates the final assessment result, now including an AI-powered strategic plan.
   * @returns {Promise<object|null>} The assessment result object or null on error.
   */
  static async generateResult() {
    const { currentAnswers, assessmentData } = stateManager.getState();
    
    if (!assessmentData || !currentAnswers) {
      console.error("Cannot generate result: assessment data or answers are missing.");
      return null;
    }
    
    const uncertaintyCheck = this._checkUncertainty(currentAnswers);
    if (uncertaintyCheck.hasUncertainty) {
      return {
        insufficientInfo: true,
        insufficientInfoMessage: uncertaintyCheck.message,
        uncertainAreas: uncertaintyCheck.areas
      };
    }
    
    const initialResult = this._generateStandardResult(currentAnswers, assessmentData);
    
    const projectDescription = currentAnswers.project_description;
    if (projectDescription && projectDescription.trim().length >= 20) {
        try {
            const aiPlan = await this.generateAIPlan(projectDescription, currentAnswers, initialResult);
            initialResult.aiGeneratedPlan = aiPlan;
            initialResult.aiPlanStatus = 'success';
        } catch (error) {
            console.error("AI Plan Generation Failed:", error);
            initialResult.aiGeneratedPlan = "Failed to generate the AI-powered project plan. This may be due to a network issue or an API error. You can still use the standard assessment below.";
            initialResult.aiPlanStatus = 'error';
        }
    } else {
        initialResult.aiPlanStatus = 'skipped';
    }

    return initialResult;
  }

  /**
   * Generates a strategic plan by calling the Gemini API.
   * @param {string} description - The user's project description.
   * @param {object} answers - The user's answers to the questionnaire.
   * @param {object} initialResult - The initial rule-based assessment result.
   * @returns {Promise<string>} The AI-generated plan as a string.
   */
  static async generateAIPlan(description, answers, initialResult) {
    // The prompt is now built by the imported function
    const prompt = buildAIPrompt(description, answers, initialResult);

    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };
    const apiKey = ENV.GEMINI_API_KEY; 
    const modelName = ENV.GEMINI_MODEL_NAME;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    
    if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
        return result.candidates[0].content.parts[0].text;
    } else {
        console.error("Invalid response structure from AI API:", result);
        throw new Error("Received an invalid or empty response from the AI service.");
    }
  }

  static _checkUncertainty(answers) {
    const uncertainAreas = [];
    let totalUncertaintyWeight = 0;
    
    for (const [questionId, answer] of Object.entries(answers)) {
      const question = DataService.getQuestionById(questionId);
      if (!question) continue;
      
      const selectedOption = DataService.getOptionByValue(questionId, answer);
      if (selectedOption?.is_uncertain) {
        uncertainAreas.push(question.text);
        totalUncertaintyWeight += selectedOption.uncertainty_weight || 1;
      }
    }
    
    const hasUncertainty = totalUncertaintyWeight > 2;
    
    return {
      hasUncertainty,
      areas: uncertainAreas,
      message: hasUncertainty 
        ? "The assessment could not be fully generated due to missing or uncertain information in key areas."
        : null
    };
  }

  static _generateStandardResult(answers, assessmentData) {
    const result = {
      summary: "Based on your responses, here's our assessment:",
      techProfile: {},
      roles: {},
      eta: { min: 2, max: 4 },
      feasibility: { risk: "Medium", confidence: "Medium" },
      warnings: [],
      avoidTech: [],
      scope_title: "Project"
    };
    
    for (const [questionId, answer] of Object.entries(answers)) {
      const selectedOption = DataService.getOptionByValue(questionId, answer);
      if (selectedOption?.effects) {
        this._applyEffects(result, selectedOption.effects, assessmentData);
      }
    }
    
    this._applyRules(result, answers, assessmentData);
    
    return result;
  }

  static _applyEffects(result, effects, assessmentData) {
    if (effects.techProfileId) {
      const techProfile = assessmentData.technologies[effects.techProfileId];
      if (techProfile) {
        Object.assign(result.techProfile, techProfile);
      }
    }
    
    if (effects.roleIds) {
      effects.roleIds.forEach(roleId => {
        if (assessmentData.roles[roleId]) {
          result.roles[roleId] = { ...assessmentData.roles[roleId] };
        }
      });
    }
    
    if (effects.eta) {
      if (effects.eta.addMin) result.eta.min += effects.eta.addMin;
      if (effects.eta.addMax) result.eta.max += effects.eta.addMax;
    }
    if (effects.eta_multiplier) {
      result.eta.min = Math.ceil(result.eta.min * effects.eta_multiplier);
      result.eta.max = Math.ceil(result.eta.max * effects.eta_multiplier);
    }
    
    if (effects.feasibility) {
      Object.assign(result.feasibility, effects.feasibility);
    }
    
    if (effects.scope_title) {
      result.scope_title = effects.scope_title;
    }
    
    if (effects.warnings) {
      result.warnings.push(...(Array.isArray(effects.warnings) ? effects.warnings : [effects.warnings]));
    }
    if (effects.avoidTech) {
      result.avoidTech.push(...(Array.isArray(effects.avoidTech) ? effects.avoidTech : [effects.avoidTech]));
    }
  }

  static _applyRules(result, answers, assessmentData) {
    if (!assessmentData.rules) return;
    
    for (const rule of assessmentData.rules) {
      if (this._checkRuleConditions(rule.conditions, answers)) {
        this._applyEffects(result, rule.effects, assessmentData);
      }
    }
  }

  static _checkRuleConditions(conditions, answers) {
    for (const [questionId, expectedValues] of Object.entries(conditions)) {
      const userAnswer = answers[questionId];
      if (!userAnswer || !expectedValues.includes(userAnswer)) {
        return false;
      }
    }
    return true;
  }
}
