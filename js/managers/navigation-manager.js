/**
 * Page navigation management
 */
import { DOM_SELECTORS } from '../config/dom-selectors.js';
import { CONSTANTS } from '../config/constants.js';

export class NavigationManager {
  constructor() {
    this.currentPage = 'assessment';
    this.pages = {};
    this.navLinks = {};
    this.wizardController = null; // NEW: Property to hold the controller
  }

  // REVISED: Accept the wizard controller as an argument
  init(wizardController) {
    this.wizardController = wizardController; // Store the controller instance

    // Get page elements
    for (const [key, selector] of Object.entries(DOM_SELECTORS.pages)) {
      this.pages[key] = document.querySelector(selector);
    }

    // Get navigation elements
    for (const [key, selector] of Object.entries(DOM_SELECTORS.navigation)) {
      this.navLinks[key] = document.querySelector(selector);
    }

    this._setupNavigation();
    this.showPage('assessment');
  }

  // REVISED: Add special logic for the "New Assessment" button
  _setupNavigation() {
    for (const [page, element] of Object.entries(this.navLinks)) {
      element?.addEventListener('click', (e) => {
        e.preventDefault();

        // NEW LOGIC: If clicking "New Assessment", reset the state first
        if (page === 'assessment' && this.wizardController) {
          this.wizardController.startOver();
        }
        
        this.showPage(page);
      });
    }
  }

  showPage(pageName) {
    // Hide all pages
    for (const page of Object.values(this.pages)) {
      page?.classList.add(CONSTANTS.CSS_CLASSES.HIDDEN);
    }

    // Show selected page
    this.pages[pageName]?.classList.remove(CONSTANTS.CSS_CLASSES.HIDDEN);

    // Update navigation
    this._updateNavigation(pageName);
    this.currentPage = pageName;

    // Update URL without page reload
    if (history.pushState) {
      const url = new URL(window.location);
      url.searchParams.set('page', pageName);
      history.pushState({ page: pageName }, '', url);
    }
  }

  _updateNavigation(activePage) {
    for (const [page, element] of Object.entries(this.navLinks)) {
      if (!element) continue;

      // Split the class strings into arrays
      const activeClasses = CONSTANTS.CSS_CLASSES.ACTIVE.split(' ');
      const inactiveClasses = CONSTANTS.CSS_CLASSES.INACTIVE.split(' ');

      if (page === activePage) {
        // Use the spread operator (...) to apply classes
        element.classList.remove(...inactiveClasses);
        element.classList.add(...activeClasses);
      } else {
        element.classList.remove(...activeClasses);
        element.classList.add(...inactiveClasses);
      }
    }
  }

  handlePopState(event) {
    const page = event.state?.page || 'assessment';
    this.showPage(page);
  }
}
