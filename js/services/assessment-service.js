/**
 * Assessment logic and result generation service.
 * This service now works with the refactored, modular data structure.
 */
import { stateManager } from '../managers/state-manager.js';
import { DataService } from './data-service.js';

export class AssessmentService {
  /**
   * Generates the final assessment result based on user answers.
   * @returns {object|null} The assessment result object or null on error.
   */
  static generateResult() {
    const { currentAnswers, assessmentData } = stateManager.getState();
    
    if (!assessmentData || !currentAnswers) {
      console.error("Cannot generate result: assessment data or answers are missing.");
      return null;
    }
    
    // First, check if there's too much uncertainty to provide a reliable result.
    const uncertaintyCheck = this._checkUncertainty(currentAnswers);
    if (uncertaintyCheck.hasUncertainty) {
      return {
        insufficientInfo: true,
        insufficientInfoMessage: uncertaintyCheck.message,
        uncertainAreas: uncertaintyCheck.areas
      };
    }
    
    // If uncertainty is low, proceed with generating the standard result.
    return this._generateStandardResult(currentAnswers, assessmentData);
  }

  /**
   * Checks for uncertainty based on user's answers.
   * @param {object} answers - The user's current answers.
   * @returns {object} An object indicating if there is high uncertainty.
   */
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
    
    const hasUncertainty = totalUncertaintyWeight > 2; // Threshold for showing the warning
    
    return {
      hasUncertainty,
      areas: uncertainAreas,
      message: hasUncertainty 
        ? "The assessment cannot be reliably generated because critical information is missing or uncertain. To create an accurate technology and resource plan, please gather more details on the following topics before re-running the assessment:"
        : null
    };
  }

  /**
   * Generates the standard, detailed assessment result.
   * @param {object} answers - The user's current answers.
   * @param {object} assessmentData - The complete set of assessment data (categories, rules, etc.).
   * @returns {object} The detailed result object.
   */
  static _generateStandardResult(answers, assessmentData) {
    // Initialize the result object with default values.
    // UPDATED: Lowered the base timeline estimate for more realistic projections.
    const result = {
      summary: "Based on your responses, here's our assessment:",
      techProfile: {},
      roles: {},
      eta: { min: 2, max: 4 }, // Base timeline estimate is now 2-4 months.
      feasibility: { risk: "Medium", confidence: "Medium" },
      warnings: [],
      avoidTech: [],
      scope_title: "Project"
    };
    
    // 1. Apply effects from the options selected by the user.
    for (const [questionId, answer] of Object.entries(answers)) {
      const selectedOption = DataService.getOptionByValue(questionId, answer);
      if (selectedOption?.effects) {
        this._applyEffects(result, selectedOption.effects, assessmentData);
      }
    }
    
    // 2. Apply effects from conditional rules that match the user's answers.
    this._applyRules(result, answers, assessmentData);
    
    return result;
  }

  /**
   * Applies effects from an option or rule to the result object.
   * @param {object} result - The result object to modify.
   * @param {object} effects - The effects to apply.
   * @param {object} assessmentData - The complete assessment data for lookups.
   */
  static _applyEffects(result, effects, assessmentData) {
    // REFACTORED: Look up technology profiles by ID.
    if (effects.techProfileId) {
      const techProfile = assessmentData.technologies[effects.techProfileId];
      if (techProfile) {
        Object.assign(result.techProfile, techProfile);
      }
    }
    
    // REFACTORED: Look up roles by ID and add them to the result.
    if (effects.roleIds) {
      effects.roleIds.forEach(roleId => {
        if (assessmentData.roles[roleId]) {
          result.roles[roleId] = { ...assessmentData.roles[roleId] };
        }
      });
    }
    
    // Adjust ETA (timeline).
    if (effects.eta) {
      if (effects.eta.addMin) result.eta.min += effects.eta.addMin;
      if (effects.eta.addMax) result.eta.max += effects.eta.addMax;
    }
    if (effects.eta_multiplier) {
      result.eta.min = Math.ceil(result.eta.min * effects.eta_multiplier);
      result.eta.max = Math.ceil(result.eta.max * effects.eta_multiplier);
    }
    
    // Update feasibility.
    if (effects.feasibility) {
      Object.assign(result.feasibility, effects.feasibility);
    }
    
    // Update scope title.
    if (effects.scope_title) {
      result.scope_title = effects.scope_title;
    }
    
    // Collect warnings and technologies to avoid.
    if (effects.warnings) {
      result.warnings.push(...(Array.isArray(effects.warnings) ? effects.warnings : [effects.warnings]));
    }
    if (effects.avoidTech) {
      result.avoidTech.push(...(Array.isArray(effects.avoidTech) ? effects.avoidTech : [effects.avoidTech]));
    }
  }

  /**
   * Checks all conditional rules and applies their effects if conditions are met.
   * @param {object} result - The result object to modify.
   * @param {object} answers - The user's current answers.
   * @param {object} assessmentData - The complete assessment data.
   */
  static _applyRules(result, answers, assessmentData) {
    if (!assessmentData.rules) return;
    
    for (const rule of assessmentData.rules) {
      if (this._checkRuleConditions(rule.conditions, answers)) {
        this._applyEffects(result, rule.effects, assessmentData);
      }
    }
  }

  /**
   * Checks if a user's answers satisfy the conditions of a single rule.
   * @param {object} conditions - The conditions of the rule.
   * @param {object} answers - The user's answers.
   * @returns {boolean} True if all conditions are met, false otherwise.
   */
  static _checkRuleConditions(conditions, answers) {
    for (const [questionId, expectedValues] of Object.entries(conditions)) {
      const userAnswer = answers[questionId];
      // If the user hasn't answered a required question, or their answer is not in the expected list, the condition fails.
      if (!userAnswer || !expectedValues.includes(userAnswer)) {
        return false;
      }
    }
    // If all conditions were met, return true.
    return true;
  }
}
