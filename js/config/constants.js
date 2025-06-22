/**
 * Application constants
 */
export const CONSTANTS = {
  STORAGE_KEYS: {
    ASSESSMENT_DATA: 'assessmentData',
    SAVED_ASSESSMENTS: 'savedAssessments'
  },
  CSS_CLASSES: {
    HIDDEN: 'hidden',
    ACTIVE: 'border-indigo-500 text-indigo-700',
    INACTIVE: 'border-gray-300 text-gray-500'
  },
  MODAL_DEFAULTS: {
    ALERT: {
      title: 'Information',
      icon: 'ℹ️'
    },
    CONFIRM: {
      title: 'Confirm Action',
      icon: '❓',
      okText: 'Confirm',
      okClass: 'bg-red-600 hover:bg-red-700'
    },
    INPUT: {
      title: 'Enter Information',
      placeholder: 'Enter text...'
    }
  },
  DATA_URL: 'assessment_data.json'
};
