/**
 * Data loading and processing service
 */
import { StorageService } from './storage-service.js';
import { stateManager } from '../managers/state-manager.js';
import { CONSTANTS } from '../config/constants.js';

export class DataService {
  static async loadAssessmentData() {
    try {
      // Try to load from localStorage first
      let data = StorageService.loadAssessmentData();
      
      if (!data) {
        // Load from JSON file if not in localStorage
        const response = await fetch(CONSTANTS.DATA_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        data = await response.json();
        
        // Save to localStorage for future use
        StorageService.saveAssessmentData(data);
      }
      
      // Flatten questions and store in state
      const allQuestions = this._flattenQuestions(data);
      
      stateManager.updateState({
        assessmentData: data,
        allQuestions: allQuestions
      });
      
      return data;
    } catch (error) {
      console.error('Error loading assessment data:', error);
      throw error;
    }
  }

  static _flattenQuestions(data) {
    const questions = [];
    
    if (data.categories) {
      data.categories.forEach(category => {
        if (category.questions) {
          category.questions.forEach(question => {
            questions.push({
              ...question,
              categoryName: category.name
            });
          });
        }
      });
    }
    
    return questions;
  }

  static getQuestionById(id) {
    const allQuestions = stateManager.getState('allQuestions');
    return allQuestions.find(q => q.id === id);
  }

  static getOptionByValue(questionId, value) {
    const question = this.getQuestionById(questionId);
    if (!question) return null;
    
    return question.options?.find(opt => opt.value === value) || null;
  }
}
