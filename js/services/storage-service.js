/**
 * Local storage operations service
 */
import { CONSTANTS } from '../config/constants.js';

export class StorageService {
  static loadAssessmentData() {
    try {
      const stored = localStorage.getItem(CONSTANTS.STORAGE_KEYS.ASSESSMENT_DATA);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading assessment data:', error);
      return null;
    }
  }

  static saveAssessmentData(data) {
    try {
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.ASSESSMENT_DATA, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving assessment data:', error);
      return false;
    }
  }

  static loadSavedAssessments() {
    try {
      const stored = localStorage.getItem(CONSTANTS.STORAGE_KEYS.SAVED_ASSESSMENTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading saved assessments:', error);
      return [];
    }
  }

  static saveSavedAssessments(assessments) {
    try {
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.SAVED_ASSESSMENTS, JSON.stringify(assessments));
      return true;
    } catch (error) {
      console.error('Error saving assessments:', error);
      return false;
    }
  }

  static saveAssessment(assessment) {
    const assessments = this.loadSavedAssessments();
    const existingIndex = assessments.findIndex(a => a.id === assessment.id);
    
    if (existingIndex >= 0) {
      assessments[existingIndex] = assessment;
    } else {
      assessments.unshift(assessment);
    }
    
    return this.saveSavedAssessments(assessments);
  }

  static deleteAssessment(id) {
    const assessments = this.loadSavedAssessments();
    const filtered = assessments.filter(a => a.id !== id);
    return this.saveSavedAssessments(filtered);
  }
}
