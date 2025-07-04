/**
 * Data loading and processing service.
 * This service is responsible for fetching all assessment-related data from the new modular JSON files.
 */
import { stateManager } from '../managers/state-manager.js';
import { CONSTANTS } from '../config/constants.js';

export class DataService {
  /**
   * Loads all necessary assessment data files (categories, rules, roles, technologies)
   * in parallel and populates the application's state.
   */
  static async loadAssessmentData() {
    try {
      // Fetch all data files concurrently for efficiency.
      const [categories, rules, roles, technologies] = await Promise.all([
        fetch(`${CONSTANTS.DATA_URL}categories.json`).then(res => res.json()),
        fetch(`${CONSTANTS.DATA_URL}rules.json`).then(res => res.json()),
        fetch(`${CONSTANTS.DATA_URL}roles.json`).then(res => res.json()),
        fetch(`${CONSTANTS.DATA_URL}technologies.json`).then(res => res.json())
      ]);
      
      // Combine all loaded data into a single object.
      const assessmentData = { categories, rules, roles, technologies };

      // Flatten the question structure for easy lookup.
      const allQuestions = this._flattenQuestions(assessmentData);
      
      // Update the central state with the new data.
      stateManager.updateState({
        assessmentData: assessmentData,
        allQuestions: allQuestions
      });
      
      return assessmentData;
    } catch (error) {
      console.error('Fatal Error: Could not load assessment data files.', error);
      // This is a critical error, the application cannot run without this data.
      throw new Error('Failed to load critical application data. Please check the network connection and the data files.');
    }
  }

  /**
   * Flattens the hierarchical category/question structure into a single array of questions.
   * Each question object is augmented with its category name for context.
   * @param {object} data - The combined assessment data.
   * @returns {Array} A flat array of question objects.
   */
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

  /**
   * Retrieves a question by its unique ID from the application state.
   * @param {string} id - The ID of the question to find.
   * @returns {object|null} The question object or null if not found.
   */
  static getQuestionById(id) {
    const allQuestions = stateManager.getState('allQuestions');
    return allQuestions.find(q => q.id === id) || null;
  }

  /**
   * Retrieves a specific option for a given question by the option's value.
   * @param {string} questionId - The ID of the question.
   * @param {string} value - The value of the option to find.
   * @returns {object|null} The option object or null if not found.
   */
  static getOptionByValue(questionId, value) {
    const question = this.getQuestionById(questionId);
    if (!question) return null;
    
    return question.options?.find(opt => opt.value === value) || null;
  }
}
