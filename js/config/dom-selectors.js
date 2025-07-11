/**
 * Centralized DOM selectors configuration
 */
export const DOM_SELECTORS = {
  pages: {
    assessment: '#page-assessment',
    history: '#page-history',
    resources: '#page-resources'
  },
  navigation: {
    assessment: '#nav-assessment',
    history: '#nav-history',
    resources: '#nav-resources'
  },
  wizard: {
    container: '#wizardContainer',
    start: '#wizardStart',
    startBtn: '#startAssessmentBtn',
    progressContainer: '#progressBarContainer',
    questionContainer: '#questionContainer',
    navigation: '#wizardNav',
    resultContainer: '#assessmentResult'
  },
  progress: {
    bar: '#progressBar',
    text: '#progressText',
    percentage: '#progressPercentage'
  },
  buttons: {
    prev: '#prevBtn',
    next: '#nextBtn',
    startOverNav: '#startOverNavBtn',
    startOverResult: '#startOverResultBtn',
    saveAssessment: '#saveAssessmentBtn'
  },
  results: {
    insufficientWarning: '#insufficientInfoWarning',
    standardContainer: '#standardResult'
  },
  history: {
    container: '#historyContainer'
  },
  modals: {
    alert: {
      modal: '#alertModal',
      title: '#alertTitle',
      message: '#alertMessage',
      icon: '#alertIcon',
      ok: '#alertOk'
    },
    confirm: {
      modal: '#confirmModal',
      title: '#confirmTitle',
      message: '#confirmMessage',
      icon: '#confirmIcon',
      cancel: '#confirmCancel',
      ok: '#confirmOk'
    },
    input: {
      modal: '#inputModal',
      title: '#inputTitle',
      message: '#inputMessage',
      field: '#inputField',
      error: '#inputError',
      cancel: '#inputCancel',
      ok: '#inputOk'
    },
    review: {
      modal: '#reviewModal',
      title: '#reviewTitle',
      content: '#reviewContent',
      close: '#reviewClose',
      // closeBtn: '#reviewCloseBtn',
      // ADDED: Selector for the new export button
      // exportPdfBtn: '#reviewExportBtn'
    }
  }
};
