/**
 * Assessment logic and result generation service.
 */
import { stateManager } from '../managers/state-manager.js';
import { DataService } from './data-service.js';
import { ApiService } from './api-service.js'; // Import the ApiService

export class AssessmentService {
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
    
    // Only proceed with AI generation if a description is provided
    if (projectDescription && projectDescription.trim().length >= 20) {
        const confidence = initialResult.feasibility?.confidence?.toLowerCase();

        // **NEW LOGIC**: Decide which AI function to call based on feasibility confidence.
        if (confidence === 'low' || confidence === 'very low') {
            try {
                const explanation = await ApiService.generateFeasibilityExplanation(projectDescription, currentAnswers, initialResult);
                initialResult.aiGeneratedPlan = explanation;
                initialResult.aiPlanStatus = 'success';
                initialResult.aiPlanType = 'feasibility_explanation'; // Set the new type
            } catch (error) {
                console.error("AI Feasibility Explanation Failed:", error);
                initialResult.aiGeneratedPlan = "Failed to generate the AI-powered feasibility explanation. This may be due to a network issue or an API error. You can still use the standard assessment below.";
                initialResult.aiPlanStatus = 'error';
            }
        } else {
            try {
                const aiPlan = await ApiService.generateStrategicPlan(projectDescription, currentAnswers, initialResult);
                initialResult.aiGeneratedPlan = aiPlan;
                initialResult.aiPlanStatus = 'success';
                initialResult.aiPlanType = 'strategic_plan'; // The standard type
            } catch (error) {
                console.error("AI Plan Generation Failed:", error);
                initialResult.aiGeneratedPlan = "Failed to generate the AI-powered project plan. This may be due to a network issue or an API error. You can still use the standard assessment below.";
                initialResult.aiPlanStatus = 'error';
            }
        }

    } else {
        initialResult.aiPlanStatus = 'skipped';
    }

    return initialResult;
  }
  
  // The rest of the file remains the same...
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