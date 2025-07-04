/**
 * Application constants
 */
export const CONSTANTS = {
  STORAGE_KEYS: {
    // Note: We no longer store assessment data in localStorage to ensure fresh loads.
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
  // The DATA_URL now points to the directory containing the new JSON files.
  DATA_URL: 'data/'
};
