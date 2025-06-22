/**
 * Assessment logic and result generation service
 */
import { stateManager } from '../managers/state-manager.js';
import { DataService } from './data-service.js';

export class AssessmentService {
  static generateResult() {
    const { currentAnswers, assessmentData } = stateManager.getState();
    
    if (!assessmentData || !currentAnswers) {
      return null;
    }
    
    // Check for uncertainty
    const uncertaintyCheck = this._checkUncertainty(currentAnswers);
    if (uncertaintyCheck.hasUncertainty) {
      return {
        insufficientInfo: true,
        insufficientInfoMessage: uncertaintyCheck.message,
        uncertainAreas: uncertaintyCheck.areas
      };
    }
    
    // Generate standard result
    return this._generateStandardResult(currentAnswers, assessmentData);
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
    
    const hasUncertainty = totalUncertaintyWeight > 2; // Threshold for insufficient info
    
    return {
      hasUncertainty,
      areas: uncertainAreas,
      weight: totalUncertaintyWeight,
      message: hasUncertainty 
        ? "The assessment cannot be reliably generated because critical information is missing or uncertain. To create an accurate technology and resource plan, please gather more details on the following topics before re-running the assessment:"
        : null
    };
  }

  static _generateStandardResult(answers, assessmentData) {
    const result = {
      summary: "Based on your responses, here's our assessment:",
      techProfile: {},
      roles: {},
      eta: { min: 3, max: 6 },
      feasibility: { risk: "Medium", confidence: "Medium" },
      warnings: [],
      avoidTech: [],
      successFactors: [],
      scope_title: "Project"
    };
    
    // Apply effects from selected options
    for (const [questionId, answer] of Object.entries(answers)) {
      const selectedOption = DataService.getOptionByValue(questionId, answer);
      if (selectedOption?.effects) {
        this._applyEffects(result, selectedOption.effects);
      }
    }
    
    // Apply conditional rules
    this._applyRules(result, answers, assessmentData);
    
    return result;
  }

  static _applyEffects(result, effects) {
    // Apply tech profile
    if (effects.techProfile) {
      Object.assign(result.techProfile, effects.techProfile);
    }
    
    // Apply roles
    if (effects.roles) {
      Object.assign(result.roles, effects.roles);
    }
    
    // Apply ETA adjustments
    if (effects.eta) {
      if (effects.eta.addMin) result.eta.min += effects.eta.addMin;
      if (effects.eta.addMax) result.eta.max += effects.eta.addMax;
    }
    
    if (effects.eta_multiplier) {
      result.eta.min = Math.ceil(result.eta.min * effects.eta_multiplier);
      result.eta.max = Math.ceil(result.eta.max * effects.eta_multiplier);
    }
    
    // Apply feasibility
    if (effects.feasibility) {
      Object.assign(result.feasibility, effects.feasibility);
    }
    
    // Apply scope title
    if (effects.scope_title) {
      result.scope_title = effects.scope_title;
    }
    
    // Collect arrays
    if (effects.warnings) {
      result.warnings.push(...(Array.isArray(effects.warnings) ? effects.warnings : [effects.warnings]));
    }
    
    if (effects.avoidTech) {
      result.avoidTech.push(...(Array.isArray(effects.avoidTech) ? effects.avoidTech : [effects.avoidTech]));
    }
    
    if (effects.successFactors) {
      result.successFactors.push(...(Array.isArray(effects.successFactors) ? effects.successFactors : [effects.successFactors]));
    }
  }

  static _applyRules(result, answers, assessmentData) {
    if (!assessmentData.rules) return;
    
    for (const rule of assessmentData.rules) {
      if (this._checkRuleConditions(rule.conditions, answers)) {
        this._applyEffects(result, rule.effects);
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
