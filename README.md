# AI Project Assessment Tool

## 📋 Project Overview

The **AI Project Assessment Tool** is a sophisticated web application designed to help technology consultants make informed, fact-based decisions about AI project implementations. This tool combats the prevalent "generative AI solves everything" mentality by providing expert-level guidance on technology selection, project timelines, team requirements, and risk assessment.

### 🎯 Core Mission

- **Fact-based recommendations**: Move beyond AI hype to provide realistic technology assessments.
- **Expert guidance**: Deliver professional-grade insights on AI project feasibility.
- **Risk identification**: Highlight potential issues and knowledge gaps early in the planning process.
- **Resource planning**: Provide accurate estimates for team composition and project duration.

## 🏗 Architecture Overview

The application follows a highly modular, maintainable architecture with a clear separation of concerns. The rendering logic has been refactored into focused components, and external API calls are centralized for better management.

```
AI-Project-Assessment/
├── index.html                          # Main HTML structure
├── data/                               # Modular assessment data
│   ├── categories.json                 # Assessment questions and structure
│   ├── rules.json                      # Conditional logic and rules
│   ├── roles.json                      # Centralized team role definitions
│   └── technologies.json               # Centralized technology profiles
├── js/                                 # JavaScript modules
│   ├── config/                         # Configuration files
│   │   ├── dom-selectors.js            # Centralized DOM element selectors
│   │   └── constants.js                # Application constants and settings
│   ├── services/                       # Business logic and data management
│   │   ├── storage-service.js          # Local storage operations
│   │   ├── data-service.js             # Assessment data loading and processing
│   │   ├── api-service.js              # NEW: Centralized external API calls (e.g., Gemini)
│   │   └── assessment-service.js       # Core assessment logic
│   ├── components/                     # UI components and controllers
│   │   ├── modal-manager.js            # Modal dialog system
│   │   ├── progress-tracker.js         # Progress indication and tracking
│   │   ├── question-renderer.js        # Renders individual question cards
│   │   ├── review-renderer.js          # Renders the content for the review modal
│   │   ├── wizard-controller.js        # Main assessment flow orchestration
│   │   ├── result-renderer.js          # Orchestrates the display of result components
│   │   └── result/                     # Directory for focused result components
│   │       ├── ai-plan.js              # Renders the AI-generated strategic plan
│   │       ├── feasibility.js          # Renders feasibility and timeline estimates
│   │       ├── header.js               # Renders the main result header card
│   │       ├── team.js                 # Renders the required team section
│   │       ├── tech-profile.js         # Renders the technology profile table
│   │       └── warnings.js             # Renders warnings and technologies to avoid
│   ├── managers/                       # Application state and navigation
│   │   ├── state-manager.js            # Centralized state with a simple event bus
│   │   ├── navigation-manager.js       # Page-level navigation and URL management
│   │   └── history-manager.js          # Saved assessment management
│   ├── utils/                          # NEW: General-purpose utility functions
│   │   ├── formatters.js               # Data formatting functions
│   │   └── ui-helpers.js               # Functions for generating UI styles
│   └── main.js                         # Application entry point and initialization
└── README.md                           # Project documentation
```

## 📁 Detailed File Structure

### 📊 Data Layer (`data/`)

- **`categories.json`**: Defines the structure of the assessment, including sections and questions.
- **`rules.json`**: Contains all conditional rules that apply complex logic based on user answers.
- **`roles.json`**: A centralized dictionary of all possible team roles.
- **`technologies.json`**: A dedicated file for technology profiles and recommendations.

### 🔌 Services Layer (`js/services/`)

- **`storage-service.js`**: Manages local storage for saved assessment history.
- **`data-service.js`**: Fetches and combines data from the multiple JSON files to build the complete assessment model.
- **`api-service.js` (New)**: Centralizes all external API calls. Currently handles communication with the Gemini API for strategic plan generation.
- **`assessment-service.js` (Updated)**: The core assessment engine. It now uses the `ApiService` for AI-powered features.

### 🎨 Components Layer (`js/components/`)

This layer is now composed of smaller, more focused components with clear responsibilities.

- **`wizard-controller.js`**: Orchestrates the main assessment flow. It uses `QuestionRenderer` to display questions.
- **`question-renderer.js` (New)**: Renders the HTML for a single question card in the wizard, decoupling presentation from control logic.
- **`result-renderer.js` (Updated)**: Acts as an orchestrator that uses the components in the `result/` directory to build the final results page.
- **`result/` (New)**: A directory containing individual components, each responsible for rendering a specific part of the assessment result (e.g., `feasibility.js`, `team.js`).
- **`modal-manager.js`**: Manages all modal dialogs. It now uses `ReviewRenderer` to populate the review modal's content.
- **`review-renderer.js` (New)**: Generates the HTML content for the detailed "Assessment Review" modal.
- **`progress-tracker.js`**: Tracks and displays user progress through the assessment sections.

### 🎛 Managers Layer (`js/managers/`)

- **`state-manager.js`**: Manages the application's central state. Now includes a simple event bus for decoupled inter-component communication.
- **`navigation-manager.js`**: Handles page navigation.
- **`history-manager.js`**: Manages the list of saved assessments and now uses the event bus to auto-refresh.

## 📊 Data Flow Architecture

The data flow has been updated to reflect the new `ApiService`.

### 1. **Data Loading**
`/data/*.json` → `DataService` → `StateManager` → UI Components

### 2. **User Interaction**
User Input → `WizardController` → `StateManager` → UI Updates

### 3. **Assessment Generation**
User Answers → `AssessmentService` → `ApiService` (for AI Plan) → Result Object → `ResultRenderer` → Display

### 4. **Persistence**
Assessment Data → `StorageService` → localStorage → `HistoryManager` → Display

## 🎯 Key Features

### Section-Based Assessment Flow
- **Grouped Questions**: Questions are organized by logical categories.
- **Visual Feedback**: Answered questions turn green, unanswered remain neutral.
- **Progress Tracking**: Section-based progress indication.
- **Validation**: Must complete all questions in a section before proceeding.

### Expert Decision Engine
- **Uncertainty Detection**: Identifies when critical information is missing.
- **Conditional Logic**: Applies complex rules based on answer combinations.
- **Technology Matching**: Maps requirements to appropriate AI technologies.
- **Risk Assessment**: Evaluates project feasibility and potential challenges.
- **AI-Powered Strategy**: Generates a detailed, multi-page strategic plan using a Generative AI backend.

### Persistent Assessment Management
- **Save/Resume**: Save assessments at any point and resume later.
- **History Tracking**: Maintain a history of completed assessments.
- **Export/Review**: Detailed review mode with PDF export functionality for sharing and analysis.

## 🔧 Technical Implementation

### State Management with Event Bus
The application uses a centralized state management pattern. A simple event bus (`on`, `emit`) has been added to the `StateManager` to allow for decoupled communication between components.

```javascript
// A component can save an assessment and emit an event
stateManager.emit('assessment-saved');

// Another component (e.g., HistoryManager) can listen for this event
stateManager.on('assessment-saved', () => this.refreshHistory());
```

### Modular Component Architecture

  - **Maintainability**: Each component has a single, well-defined responsibility (e.g., rendering a question, managing a modal).
  - **Testability**: Individual components can be easily unit tested in isolation.
  - **Scalability**: The clean, decoupled structure makes it easy to add new features without affecting existing code.

## 🚀 Getting Started

### Installation

1.  Clone or download the project files.
2.  Create a file named `js/config/env.js`.
3.  Inside `env.js`, add your Gemini API key:
    ```javascript
    export const ENV = {
      GEMINI_API_KEY: 'YOUR_API_KEY_HERE',
      GEMINI_MODEL_NAME: 'gemini-2.5-flash'
    };
    ```
4.  Open `index.html` in a modern web browser.

### Usage

1.  **Start Assessment**: Click "Start Assessment" to begin.
2.  **Answer Questions**: Complete all questions in each section.
3.  **Navigate**: Use "Previous/Next Section" to move between categories.
4.  **Review Results**: View detailed recommendations and the AI-generated strategic plan upon completion.
5.  **Save Work**: Use "Save Assessment" to preserve your analysis.
6.  **Manage History**: Access, review, edit, or delete saved assessments via the "Previous Assessments" tab.