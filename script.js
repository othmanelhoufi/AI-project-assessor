document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let assessmentData = {};
    let allQuestions = [];
    let currentCategoryIndex = 0;
    let currentAnswers = {};
    let currentResult = null;
    let editingId = null;

    // --- DOM SELECTORS ---
    const pages = {
        assessment: document.getElementById('page-assessment'),
        history: document.getElementById('page-history'),
        resources: document.getElementById('page-resources')
    };

    const navLinks = {
        assessment: document.getElementById('nav-assessment'),
        history: document.getElementById('nav-history'),
        resources: document.getElementById('nav-resources')
    };

    const wizardContainer = document.getElementById('wizardContainer');
    const wizardStart = document.getElementById('wizardStart');
    const startAssessmentBtn = document.getElementById('startAssessmentBtn');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const questionContainer = document.getElementById('questionContainer');
    const wizardNav = document.getElementById('wizardNav');
    const resultContainer = document.getElementById('assessmentResult');
    const historyContainer = document.getElementById('historyContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressPercentage = document.getElementById('progressPercentage');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const startOverBtn = document.getElementById('startOverBtn');
    const saveAssessmentBtn = document.getElementById('saveAssessmentBtn');
    const insufficientInfoWarning = document.getElementById('insufficientInfoWarning');
    const standardResultContainer = document.getElementById('standardResult');

    // --- CUSTOM MODAL FUNCTIONS ---
    function showAlert(message, title = 'Information', icon = 'ℹ️') {
        return new Promise((resolve) => {
            const modal = document.getElementById('alertModal');
            const titleEl = document.getElementById('alertTitle');
            const messageEl = document.getElementById('alertMessage');
            const iconEl = document.getElementById('alertIcon');
            const okBtn = document.getElementById('alertOk');

            titleEl.textContent = title;
            messageEl.textContent = message;
            iconEl.textContent = icon;
            modal.classList.remove('hidden');

            const handleClose = () => {
                modal.classList.add('hidden');
                okBtn.removeEventListener('click', handleClose);
                resolve();
            };

            okBtn.addEventListener('click', handleClose);
        });
    }

    function showConfirm(message, title = 'Confirm Action', icon = '❓', okText = 'Confirm', okClass = 'bg-red-600 hover:bg-red-700') {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const titleEl = document.getElementById('confirmTitle');
            const messageEl = document.getElementById('confirmMessage');
            const iconEl = document.getElementById('confirmIcon');
            const cancelBtn = document.getElementById('confirmCancel');
            const okBtn = document.getElementById('confirmOk');

            titleEl.textContent = title;
            messageEl.textContent = message;
            iconEl.textContent = icon;
            okBtn.textContent = okText;
            okBtn.className = `px-4 py-2 text-white rounded-lg transition-colors ${okClass}`;
            modal.classList.remove('hidden');

            const handleClose = (result) => {
                modal.classList.add('hidden');
                cancelBtn.removeEventListener('click', handleCancel);
                okBtn.removeEventListener('click', handleOk);
                resolve(result);
            };

            const handleCancel = () => handleClose(false);
            const handleOk = () => handleClose(true);

            cancelBtn.addEventListener('click', handleCancel);
            okBtn.addEventListener('click', handleOk);
        });
    }

    function showPrompt(message, title = 'Enter Information', placeholder = 'Enter text...', defaultValue = '') {
        return new Promise((resolve) => {
            const modal = document.getElementById('inputModal');
            const titleEl = document.getElementById('inputTitle');
            const messageEl = document.getElementById('inputMessage');
            const inputField = document.getElementById('inputField');
            const errorEl = document.getElementById('inputError');
            const cancelBtn = document.getElementById('inputCancel');
            const okBtn = document.getElementById('inputOk');

            titleEl.textContent = title;
            messageEl.textContent = message;
            inputField.placeholder = placeholder;
            inputField.value = defaultValue;
            errorEl.classList.add('hidden');
            modal.classList.remove('hidden');
            inputField.focus();

            const handleClose = (result) => {
                modal.classList.add('hidden');
                cancelBtn.removeEventListener('click', handleCancel);
                okBtn.removeEventListener('click', handleOk);
                inputField.removeEventListener('keydown', handleKeydown);
                resolve(result);
            };

            const handleCancel = () => handleClose(null);
            const handleOk = () => {
                const value = inputField.value.trim();
                if (!value) {
                    errorEl.classList.remove('hidden');
                    inputField.focus();
                    return;
                }
                handleClose(value);
            };

            const handleKeydown = (e) => {
                if (e.key === 'Enter') {
                    handleOk();
                } else if (e.key === 'Escape') {
                    handleCancel();
                }
            };

            cancelBtn.addEventListener('click', handleCancel);
            okBtn.addEventListener('click', handleOk);
            inputField.addEventListener('keydown', handleKeydown);
        });
    }

    // --- REVIEW MODAL FUNCTIONS ---
    function showReviewModal(assessment) {
        const modal = document.getElementById('reviewModal');
        const titleEl = document.getElementById('reviewTitle');
        const contentEl = document.getElementById('reviewContent');
        const closeBtn = document.getElementById('reviewClose');
        const closeBtnBottom = document.getElementById('reviewCloseBtn');

        titleEl.textContent = `Assessment Review: ${assessment.name}`;
        contentEl.innerHTML = generateReviewContent(assessment);
        modal.classList.remove('hidden');

        const handleClose = () => {
            modal.classList.add('hidden');
            closeBtn.removeEventListener('click', handleClose);
            closeBtnBottom.removeEventListener('click', handleClose);
        };

        closeBtn.addEventListener('click', handleClose);
        closeBtnBottom.addEventListener('click', handleClose);
    }

    function generateReviewContent(assessment) {
        const { answers, result } = assessment;
        
        // Generate questions and answers section
        let questionsHtml = '<div class="mb-8"><h3 class="text-lg font-semibold text-gray-900 mb-4">📋 Assessment Questions & Answers</h3>';
        
        // Group questions by category
        const categorizedQuestions = {};
        allQuestions.forEach(q => {
            if (!categorizedQuestions[q.category]) {
                categorizedQuestions[q.category] = [];
            }
            categorizedQuestions[q.category].push(q);
        });

        Object.entries(categorizedQuestions).forEach(([category, questions]) => {
            questionsHtml += `<div class="mb-6">
                <h4 class="text-md font-medium text-blue-900 mb-3 border-b border-blue-200 pb-1">${category}</h4>`;
            
            questions.forEach(question => {
                const answer = answers[question.id];
                if (answer) {
                    const selectedOption = question.options.find(opt => opt.value === answer);
                    const isUncertain = selectedOption?.is_uncertain;
                    
                    questionsHtml += `
                        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p class="font-medium text-gray-800 mb-2">${question.text}</p>
                            <p class="text-gray-700 ${isUncertain ? 'text-orange-600 font-medium' : ''}">
                                ${isUncertain ? '⚠️ ' : '✓ '}${selectedOption ? selectedOption.label : answer}
                            </p>
                        </div>`;
                }
            });
            
            questionsHtml += '</div>';
        });
        
        questionsHtml += '</div>';

        // Generate assessment result section
        const resultHtml = generateAssessmentResultHtml(result);

        return questionsHtml + resultHtml;
    }

    function generateAssessmentResultHtml(resultData) {
        if (!resultData) {
            return '<div class="bg-red-50 border border-red-200 rounded-lg p-4"><p class="text-red-800">No assessment result available.</p></div>';
        }

        // Handle insufficient information case
        if (resultData.hasInsufficientInfo) {
            return `
                <div class="mb-8">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">🔍 Assessment Result</h3>
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <div class="flex items-start space-x-3">
                            <span class="text-2xl">⚠️</span>
                            <div>
                                <h4 class="text-lg font-semibold text-yellow-800 mb-2">Insufficient Information</h4>
                                <p class="text-yellow-700 mb-4">${resultData.insufficientInfoMessage}</p>
                                ${resultData.uncertainAreas ? `
                                    <div class="mb-4">
                                        <h5 class="font-medium text-yellow-800 mb-2">Areas needing clarification:</h5>
                                        <ul class="list-disc list-inside text-yellow-700">
                                            ${resultData.uncertainAreas.map(area => `<li>${area}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Standard result display
        let html = `
            <div class="mb-8">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">🔍 Assessment Result</h3>
                <div class="space-y-6">
        `;

        // Summary
        if (resultData.summary) {
            html += `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 class="font-semibold text-blue-900 mb-2">Executive Summary</h4>
                    <p class="text-blue-800">${resultData.summary}</p>
                </div>
            `;
        }

        // Feasibility Assessment
        if (resultData.feasibility) {
            const riskColor = {
                'Low': 'green',
                'Medium': 'yellow', 
                'High': 'orange',
                'Very High': 'red'
            }[resultData.feasibility.risk] || 'gray';

            html += `
                <div class="bg-${riskColor}-50 border border-${riskColor}-200 rounded-lg p-4">
                    <h4 class="font-semibold text-${riskColor}-900 mb-2">Feasibility Assessment</h4>
                    <div class="space-y-2">
                        <p><span class="font-medium">Risk Level:</span> <span class="text-${riskColor}-800">${resultData.feasibility.risk}</span></p>
                        <p><span class="font-medium">Confidence:</span> <span class="text-${riskColor}-800">${resultData.feasibility.confidence}</span></p>
                        ${resultData.feasibility.summary ? `<p class="text-${riskColor}-800">${resultData.feasibility.summary}</p>` : ''}
                    </div>
                </div>
            `;
        }

        // Technology Profile
        if (resultData.techProfile && Object.keys(resultData.techProfile).length > 0) {
            html += `
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 class="font-semibold text-gray-900 mb-3">🛠️ Technology Recommendations</h4>
                    <div class="overflow-x-auto">
                        <table class="min-w-full">
                            <thead>
                                <tr class="border-b border-gray-300">
                                    <th class="text-left py-2 px-3 font-medium text-gray-900">Aspect</th>
                                    <th class="text-left py-2 px-3 font-medium text-gray-900">Recommendation</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
            `;

            Object.entries(resultData.techProfile).forEach(([key, value]) => {
                if (value && value.toString().trim()) {
                    html += `
                        <tr>
                            <td class="py-2 px-3 font-medium text-gray-700">${formatAspectName(key)}</td>
                            <td class="py-2 px-3 text-gray-600">${value}</td>
                        </tr>
                    `;
                }
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        // Timeline & Budget
        if (resultData.eta) {
            html += `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="font-semibold text-green-900 mb-2">⏱️ Timeline Estimate</h4>
                    <p class="text-green-800">
                        <span class="font-medium">Total Duration (${resultData.scope_title || 'Project'}):</span> 
                        ${resultData.eta.min === resultData.eta.max ? 
                            `${resultData.eta.min} months` : 
                            `${resultData.eta.min}-${resultData.eta.max} months`
                        }
                    </p>
                </div>
            `;
        }

        // Team & Roles
        if (resultData.roles && Object.keys(resultData.roles).length > 0) {
            html += `
                <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 class="font-semibold text-purple-900 mb-3">👥 Required Team & Expertise</h4>
                    <div class="space-y-3">
            `;

            Object.entries(resultData.roles).forEach(([roleKey, role]) => {
                if (role && typeof role === 'object') {
                    html += `
                        <div class="bg-white rounded p-3 border border-purple-100">
                            <h5 class="font-medium text-purple-900 mb-2">${role.title || formatAspectName(roleKey)}</h5>
                            <div class="text-sm text-purple-800 space-y-1">
                                ${role.allocation ? `<p><span class="font-medium">Allocation:</span> ${role.allocation}</p>` : ''}
                                ${role.priority ? `<p><span class="font-medium">Priority:</span> ${role.priority}</p>` : ''}
                                ${role.experience ? `<p><span class="font-medium">Experience:</span> ${role.experience}</p>` : ''}
                                ${role.knowledge ? `<p><span class="font-medium">Knowledge:</span> ${role.knowledge}</p>` : ''}
                                ${role.criticalSkills ? `<p><span class="font-medium">Critical Skills:</span> ${Array.isArray(role.criticalSkills) ? role.criticalSkills.join(', ') : role.criticalSkills}</p>` : ''}
                            </div>
                        </div>
                    `;
                }
            });

            html += `
                    </div>
                </div>
            `;
        }

        // Warnings
        if (resultData.warnings && resultData.warnings.length > 0) {
            html += `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 class="font-semibold text-red-900 mb-2">⚠️ Critical Warnings</h4>
                    <ul class="list-disc list-inside text-red-800 space-y-1">
                        ${resultData.warnings.map(warning => `<li>${warning}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Technologies to Avoid
        if (resultData.avoidTech && resultData.avoidTech.length > 0) {
            html += `
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 class="font-semibold text-orange-900 mb-2">🚫 Technologies to Avoid</h4>
                    <ul class="list-disc list-inside text-orange-800 space-y-1">
                        ${resultData.avoidTech.map(tech => `<li>${tech}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Success Factors
        if (resultData.successFactors && resultData.successFactors.length > 0) {
            html += `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="font-semibold text-green-900 mb-2">✅ Success Factors</h4>
                    <ul class="list-disc list-inside text-green-800 space-y-1">
                        ${resultData.successFactors.map(factor => `<li>${factor}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    // --- UTILITY FUNCTIONS ---
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function getAssessmentsFromLocalStorage() {
        try {
            const data = localStorage.getItem('assessments');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error parsing assessments from localStorage:", e);
            localStorage.removeItem('assessments');
            showAlert("Your stored assessments data was corrupted and has been cleared. Please try saving again.", "Storage Error", "⚠️");
            return [];
        }
    }

    function saveAssessmentsToLocalStorage(assessments) {
        try {
            localStorage.setItem('assessments', JSON.stringify(assessments));
        } catch (e) {
            console.error("Error saving assessments to localStorage:", e);
            showAlert("Failed to save assessment. Local storage might be full or you're in private browsing mode.", "Save Error", "⚠️");
        }
    }

    function formatAspectName(key) {
        const specialTerms = [
            'XAI', 'MLOps', 'NLP', 'RAG', 'GPU', 'SLA', 'API', 'ETL', 'ELT', 'KPI', 'PoC', 'MVP', 'SRE', 'PII', 'PHI', 'SOX', 'GDPR', 'HIPAA', 'CCPA'
        ];

        if (specialTerms.includes(key)) {
            return key;
        }

        let formattedKey = key.replace(/([a-z])([A-Z])/g, '$1 $2');
        formattedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
        return formattedKey;
    }

    async function promptForAssessmentName() {
        const name = await showPrompt(
            'Please enter a name for this assessment:',
            'Save Assessment',
            'AI Project Assessment',
            'AI Project Assessment'
        );
        return name;
    }

    // --- INITIALIZATION ---
    async function main() {
        setupNavigation();
        await loadAssessmentData();
        addEventListeners();
        showPage('assessment');
        startNewAssessment();
    }

    async function loadAssessmentData() {
        try {
            const response = await fetch('assessment_data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            assessmentData = await response.json();
            allQuestions = assessmentData.categories.flatMap(cat => 
                cat.questions.map(q => ({...q, category: cat.name}))
            );
        } catch (error) {
            wizardContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-red-600 text-xl mb-4">Failed to load assessment data</div>
                    <div class="text-gray-600 mb-4">${error.message}</div>
                    <button onclick="location.reload()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    }

    function addEventListeners() {
        startAssessmentBtn?.addEventListener('click', startNewAssessment);
        startOverBtn?.addEventListener('click', () => {
            showConfirm(
                'Are you sure you want to start a new assessment? All current progress will be lost.',
                'Start New Assessment',
                '🔄'
            ).then(confirmed => {
                if (confirmed) startNewAssessment();
            });
        });

        saveAssessmentBtn?.addEventListener('click', saveCurrentAssessment);
        prevBtn?.addEventListener('click', goToPreviousQuestion);
        nextBtn?.addEventListener('click', goToNextQuestion);
    }

    // --- NAVIGATION ---
    function setupNavigation() {
        Object.entries(navLinks).forEach(([page, link]) => {
            link?.addEventListener('click', (e) => {
                e.preventDefault();
                showPage(page);
            });
        });
    }

    function showPage(pageName) {
        Object.values(pages).forEach(page => page?.classList.add('hidden'));
        pages[pageName]?.classList.remove('hidden');
        
        Object.values(navLinks).forEach(link => link?.classList.remove('border-blue-500', 'text-blue-600'));
        navLinks[pageName]?.classList.add('border-blue-500', 'text-blue-600');
        
        if (pageName === 'history') {
            renderAssessmentHistory();
        }
    }

    // --- ASSESSMENT FLOW ---
    function startNewAssessment() {
        currentCategoryIndex = 0;
        currentAnswers = {};
        currentResult = null;
        editingId = null;
        
        wizardStart?.classList.add('hidden');
        progressBarContainer?.classList.remove('hidden');
        questionContainer?.classList.remove('hidden');
        wizardNav?.classList.remove('hidden');
        resultContainer?.classList.add('hidden');
        
        renderCurrentQuestion();
        updateProgress();
    }

    function renderCurrentQuestion() {
        if (currentCategoryIndex >= assessmentData.categories.length) {
            completeAssessment();
            return;
        }

        const category = assessmentData.categories[currentCategoryIndex];
        const questions = category.questions;
        
        let html = `
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-900 mb-2">${category.name}</h2>
                <div class="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div class="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                         style="width: ${((currentCategoryIndex + 1) / assessmentData.categories.length) * 100}%"></div>
                </div>
            </div>
        `;

        questions.forEach((question, index) => {
            const isAnswered = currentAnswers[question.id];
            html += createQuestionHtml(question, index, isAnswered);
        });

        questionContainer.innerHTML = html;
        addQuestionEventListeners();
        updateNavigationButtons();
    }

    function createQuestionHtml(question, index, isAnswered) {
        return `
            <div class="mb-8 p-6 border border-gray-200 rounded-lg ${isAnswered ? 'bg-green-50 border-green-200' : 'bg-white'}">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span class="w-8 h-8 rounded-full ${isAnswered ? 'bg-green-500' : 'bg-gray-300'} text-white flex items-center justify-center text-sm font-bold mr-3">
                        ${isAnswered ? '✓' : index + 1}
                    </span>
                    ${question.text}
                </h3>
                <div class="space-y-3">
                    ${question.options.map(option => `
                        <label class="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors ${
                            currentAnswers[question.id] === option.value ? 'bg-blue-50 border-blue-300' : ''
                        } ${option.is_uncertain ? 'border-orange-200 bg-orange-50' : ''}">
                            <input type="radio" 
                                   name="${question.id}" 
                                   value="${option.value}" 
                                   class="mt-1 text-blue-600 focus:ring-blue-500"
                                   ${currentAnswers[question.id] === option.value ? 'checked' : ''}>
                            <span class="text-gray-700 ${option.is_uncertain ? 'text-orange-700 font-medium' : ''}">
                                ${option.is_uncertain ? '⚠️ ' : ''}${option.label}
                            </span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function addQuestionEventListeners() {
        const radioInputs = questionContainer.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                currentAnswers[e.target.name] = e.target.value;
                renderCurrentQuestion();
            });
        });
    }

    function updateProgress() {
        const totalQuestions = allQuestions.length;
        const answeredQuestions = Object.keys(currentAnswers).length;
        const percentage = Math.round((answeredQuestions / totalQuestions) * 100);
        
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${answeredQuestions} of ${totalQuestions} questions answered`;
        progressPercentage.textContent = `${percentage}%`;
    }

    function updateNavigationButtons() {
        const category = assessmentData.categories[currentCategoryIndex];
        const allCategoryQuestionsAnswered = category.questions.every(q => currentAnswers[q.id]);
        
        prevBtn.disabled = currentCategoryIndex === 0;
        nextBtn.disabled = !allCategoryQuestionsAnswered;
        
        nextBtn.textContent = currentCategoryIndex === assessmentData.categories.length - 1 ? 'Complete Assessment' : 'Next Section';
    }

    function goToPreviousQuestion() {
        if (currentCategoryIndex > 0) {
            currentCategoryIndex--;
            renderCurrentQuestion();
            updateProgress();
        }
    }

    function goToNextQuestion() {
        if (currentCategoryIndex < assessmentData.categories.length - 1) {
            currentCategoryIndex++;
            renderCurrentQuestion();
            updateProgress();
        } else {
            completeAssessment();
        }
    }

    function completeAssessment() {
        currentResult = generateAssessmentResult(currentAnswers);
        
        questionContainer.classList.add('hidden');
        wizardNav.classList.add('hidden');
        progressBarContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');
        
        displayResult(currentResult);
    }

    // --- RESULT GENERATION ---
    function generateAssessmentResult(answers) {
        let uncertaintyScore = 0;
        let totalQuestions = 0;
        const uncertainAreas = [];

        allQuestions.forEach(question => {
            const answer = answers[question.id];
            totalQuestions++;
            
            if (answer) {
                const selectedOption = question.options.find(opt => opt.value === answer);
                if (selectedOption?.is_uncertain) {
                    uncertaintyScore += selectedOption.uncertainty_weight || 1;
                    uncertainAreas.push(`${question.category}: ${question.text}`);
                }
            } else {
                uncertaintyScore += 1;
                uncertainAreas.push(`${question.category}: ${question.text} (not answered)`);
            }
        });

        // If uncertainty is too high, return insufficient info result
        if (uncertaintyScore >= 5) {
            return {
                hasInsufficientInfo: true,
                uncertaintyScore,
                uncertainAreas,
                insufficientInfoMessage: "The assessment cannot be reliably generated because critical information is missing or uncertain. To create an accurate technology and resource plan, please gather more details on the following topics before re-running the assessment:"
            };
        }

        // Generate normal assessment result
        let result = {
            techProfile: {},
            roles: {},
            warnings: [],
            avoidTech: [],
            successFactors: [],
            feasibility: { risk: 'Medium', confidence: 'Medium' },
            eta: { min: 3, max: 6 },
            scope_title: 'Project',
            summary: ''
        };

        // Apply effects from selected options
        Object.entries(answers).forEach(([questionId, answerValue]) => {
            const question = allQuestions.find(q => q.id === questionId);
            if (!question) return;

            const selectedOption = question.options.find(opt => opt.value === answerValue);
            if (!selectedOption?.effects) return;

            const effects = selectedOption.effects;

            // Merge tech profile
            if (effects.techProfile) {
                Object.assign(result.techProfile, effects.techProfile);
            }

            // Merge roles
            if (effects.roles) {
                Object.assign(result.roles, effects.roles);
            }

            // Add warnings
            if (effects.warnings) {
                result.warnings.push(...effects.warnings);
            }

            // Add avoid tech
            if (effects.avoidTech) {
                result.avoidTech.push(...effects.avoidTech);
            }

            // Add success factors
            if (effects.successFactors) {
                result.successFactors.push(...effects.successFactors);
            }

            // Update feasibility
            if (effects.feasibility) {
                if (effects.feasibility.risk) result.feasibility.risk = effects.feasibility.risk;
                if (effects.feasibility.confidence) result.feasibility.confidence = effects.feasibility.confidence;
                if (effects.feasibility.summary) result.feasibility.summary = effects.feasibility.summary;
            }

            // Update ETA
            if (effects.eta) {
                if (effects.eta.addMin) result.eta.min += effects.eta.addMin;
                if (effects.eta.addMax) result.eta.max += effects.eta.addMax;
            }

            if (effects.eta_multiplier) {
                result.eta.min = Math.ceil(result.eta.min * effects.eta_multiplier);
                result.eta.max = Math.ceil(result.eta.max * effects.eta_multiplier);
            }

            // Update scope title
            if (effects.scope_title) {
                result.scope_title = effects.scope_title;
            }

            // Update summary
            if (effects.summary) {
                result.summary = effects.summary;
            }
        });

        // Apply rules
        if (assessmentData.rules) {
            assessmentData.rules.forEach(rule => {
                if (checkRuleConditions(rule.conditions, answers)) {
                    const effects = rule.effects;
                    
                    if (effects.techProfile) {
                        Object.assign(result.techProfile, effects.techProfile);
                    }
                    if (effects.roles) {
                        Object.assign(result.roles, effects.roles);
                    }
                    if (effects.warnings) {
                        result.warnings.push(...effects.warnings);
                    }
                    if (effects.avoidTech) {
                        result.avoidTech.push(...effects.avoidTech);
                    }
                    if (effects.successFactors) {
                        result.successFactors.push(...effects.successFactors);
                    }
                    if (effects.feasibility) {
                        Object.assign(result.feasibility, effects.feasibility);
                    }
                    if (effects.eta) {
                        if (effects.eta.addMin) result.eta.min += effects.eta.addMin;
                        if (effects.eta.addMax) result.eta.max += effects.eta.addMax;
                    }
                    if (effects.alternatives) {
                        result.alternatives = effects.alternatives;
                    }
                }
            });
        }

        return result;
    }

    function checkRuleConditions(conditions, answers) {
        return Object.entries(conditions).every(([questionId, expectedValues]) => {
            const userAnswer = answers[questionId];
            return userAnswer && expectedValues.includes(userAnswer);
        });
    }

    function displayResult(resultData) {
        if (resultData.hasInsufficientInfo) {
            insufficientInfoWarning.classList.remove('hidden');
            standardResultContainer.classList.add('hidden');
            
            const uncertainAreasContainer = document.getElementById('uncertainAreas');
            if (uncertainAreasContainer && resultData.uncertainAreas) {
                uncertainAreasContainer.innerHTML = resultData.uncertainAreas
                    .map(area => `<li class="text-yellow-700">${area}</li>`)
                    .join('');
            }
        } else {
            insufficientInfoWarning.classList.add('hidden');
            standardResultContainer.classList.remove('hidden');
            standardResultContainer.innerHTML = generateAssessmentResultHtml(resultData);
        }
    }

    // --- ASSESSMENT MANAGEMENT ---
    async function saveCurrentAssessment() {
        if (!currentResult) {
            await showAlert('No assessment result to save. Please complete the assessment first.', 'Nothing to Save', '⚠️');
            return;
        }

        const name = await promptForAssessmentName();
        if (!name) return;

        const assessment = {
            id: editingId || generateId(),
            name: name.trim(),
            date: new Date().toLocaleString(),
            answers: { ...currentAnswers },
            result: { ...currentResult }
        };

        const assessments = getAssessmentsFromLocalStorage();
        
        if (editingId) {
            const index = assessments.findIndex(a => a.id === editingId);
            if (index >= 0) {
                assessments[index] = assessment;
            } else {
                assessments.push(assessment);
            }
            editingId = null;
        } else {
            assessments.push(assessment);
        }

        saveAssessmentsToLocalStorage(assessments);
        await showAlert('Assessment saved successfully!', 'Saved', '✅');
    }

    function renderAssessmentHistory() {
        const assessments = getAssessmentsFromLocalStorage();
        
        if (assessments.length === 0) {
            historyContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-gray-500 text-lg mb-4">No saved assessments</div>
                    <p class="text-gray-400">Complete an assessment and save it to see it here.</p>
                </div>
            `;
            return;
        }

        const html = assessments.map(assessment => `
            <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">${assessment.name}</h3>
                        <p class="text-sm text-gray-500">Updated: ${assessment.date}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button class="review-btn bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors" 
                                data-id="${assessment.id}">
                            Review
                        </button>
                        <button class="edit-btn bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors" 
                                data-id="${assessment.id}">
                            Edit
                        </button>
                        <button class="delete-btn bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors" 
                                data-id="${assessment.id}">
                            Delete
                        </button>
                    </div>
                </div>
                <div class="text-sm text-gray-600">
                    ${assessment.result?.summary ? assessment.result.summary.substring(0, 150) + '...' : 'Assessment completed'}
                </div>
                ${assessment.result?.feasibility ? `
                    <div class="mt-2 text-xs">
                        <span class="inline-block px-2 py-1 rounded-full text-white ${
                            assessment.result.feasibility.risk === 'Low' ? 'bg-green-500' :
                            assessment.result.feasibility.risk === 'Medium' ? 'bg-yellow-500' :
                            assessment.result.feasibility.risk === 'High' ? 'bg-orange-500' :
                            'bg-red-500'
                        }">
                            Risk: ${assessment.result.feasibility.risk}
                        </span>
                    </div>
                ` : ''}
            </div>
        `).join('');

        historyContainer.innerHTML = html;

        // Add event listeners for buttons
        document.querySelectorAll('.review-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const assessment = assessments.find(a => a.id === id);
                if (assessment) {
                    showReviewModal(assessment);
                }
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                editAssessment(id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                deleteAssessment(id);
            });
        });
    }

    async function editAssessment(id) {
        const assessments = getAssessmentsFromLocalStorage();
        const assessment = assessments.find(a => a.id === id);
        
        if (!assessment) {
            await showAlert('Assessment not found.', 'Error', '❌');
            return;
        }

        const confirmed = await showConfirm(
            `Edit assessment "${assessment.name}"? This will load the assessment data into the editor.`,
            'Edit Assessment',
            '✏️',
            'Edit',
            'bg-green-600 hover:bg-green-700'
        );
        
        if (confirmed) {
            editingId = id;
            currentAnswers = { ...assessment.answers };
            currentResult = null;
            showPage('assessment');
            startNewAssessment();
        }
    }

    async function deleteAssessment(id) {
        const assessments = getAssessmentsFromLocalStorage();
        const assessment = assessments.find(a => a.id === id);
        
        if (!assessment) return;

        const confirmed = await showConfirm(
            `Delete assessment "${assessment.name}"? This action cannot be undone.`,
            'Delete Assessment',
            '🗑️',
            'Delete'
        );
        
        if (confirmed) {
            const updatedAssessments = assessments.filter(a => a.id !== id);
            saveAssessmentsToLocalStorage(updatedAssessments);
            renderAssessmentHistory();
            await showAlert('Assessment deleted successfully.', 'Deleted', '✅');
        }
    }

    // --- START APPLICATION ---
    main().catch(console.error);
});
