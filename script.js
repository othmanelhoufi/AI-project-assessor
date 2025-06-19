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
                <div class="p-8 text-center">
                    <div class="text-red-600 text-6xl mb-4">⚠️</div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">Error Loading Assessment</h3>
                    <p class="text-gray-600 mb-4">${error.message}</p>
                    <p class="text-sm text-gray-500">Please refresh the page to try again.</p>
                </div>
            `;
        }
    }

    // --- NAVIGATION ---
    function setupNavigation() {
        Object.entries(navLinks).forEach(([pageId, link]) => {
            link.addEventListener('click', () => {
                if (pageId === 'assessment') {
                    // When clicking "New Assessment", always start fresh
                    startNewAssessment();
                }
                showPage(pageId);
            });
        });
    }

    function showPage(pageId) {
        Object.values(pages).forEach(page => page.classList.add('hidden'));
        pages[pageId].classList.remove('hidden');
        
        Object.values(navLinks).forEach(link => {
            link.classList.remove('text-blue-600', 'bg-blue-50');
            link.classList.add('text-gray-600', 'hover:text-blue-600', 'hover:bg-gray-50');
        });
        
        navLinks[pageId].classList.remove('text-gray-600', 'hover:text-blue-600', 'hover:bg-gray-50');
        navLinks[pageId].classList.add('text-blue-600', 'bg-blue-50');

        if (pageId === 'history') {
            loadAssessmentHistory();
        }
    }

    // --- ASSESSMENT WIZARD ---
    function addEventListeners() {
        startAssessmentBtn.addEventListener('click', startAssessment);
        nextBtn.addEventListener('click', nextQuestion);
        prevBtn.addEventListener('click', prevQuestion);
        startOverBtn.addEventListener('click', async () => {
            const confirmed = await showConfirm(
                'Are you sure you want to start over? All current progress will be lost.',
                'Start Over',
                '🔄',
                'Start Over',
                'bg-orange-600 hover:bg-orange-700'
            );
            if (confirmed) {
                startNewAssessment();
            }
        });
        saveAssessmentBtn.addEventListener('click', saveCurrentAssessment);
    }

    function startNewAssessment() {
        // COMPLETE STATE RESET
        currentCategoryIndex = 0;
        currentAnswers = {};
        currentResult = null;
        editingId = null;
        
        // Reset UI to start screen
        showWizardStart();
    }

    function showWizardStart() {
        wizardStart.classList.remove('hidden');
        progressBarContainer.classList.add('hidden');
        questionContainer.classList.add('hidden');
        wizardNav.classList.add('hidden');
        resultContainer.classList.add('hidden');
    }

    function startAssessment() {
        wizardStart.classList.add('hidden');
        progressBarContainer.classList.remove('hidden');
        questionContainer.classList.remove('hidden');
        wizardNav.classList.remove('hidden');
        currentCategoryIndex = 0;
        showCurrentCategory();
    }

    function startAssessmentWithAnswers(existingAnswers, assessmentId) {
        // For editing existing assessments
        editingId = assessmentId;
        currentAnswers = {...existingAnswers};
        currentResult = null;
        
        // Start the wizard with existing answers
        wizardStart.classList.add('hidden');
        progressBarContainer.classList.remove('hidden');
        questionContainer.classList.remove('hidden');
        wizardNav.classList.remove('hidden');
        resultContainer.classList.add('hidden');
        
        currentCategoryIndex = 0;
        showCurrentCategory();
    }

    function showCurrentCategory() {
        if (currentCategoryIndex >= assessmentData.categories.length) {
            generateResults();
            return;
        }

        const category = assessmentData.categories[currentCategoryIndex];
        updateProgress();
        renderCategory(category);
        updateNavigation();
    }

    function updateProgress() {
        const totalCategories = assessmentData.categories.length;
        const progress = Math.round((currentCategoryIndex / totalCategories) * 100);
        const currentCategory = assessmentData.categories[currentCategoryIndex];
        
        progressBar.style.width = progress + '%';
        progressText.textContent = currentCategory ? currentCategory.name : 'Complete';
        progressPercentage.textContent = progress + '%';
    }

    function renderCategory(category) {
        const categoryHtml = `
            <div class="space-y-8">
                <div class="text-center">
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">${category.name}</h2>
                    <div class="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
                </div>
                ${category.questions.map(question => `
                    <div class="space-y-4">
                        <h3 class="text-lg font-medium text-gray-900">${question.text}</h3>
                        <div class="space-y-3">
                            ${question.options.map(option => `
                                <label class="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${currentAnswers[question.id] === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}">
                                    <input type="radio" name="${question.id}" value="${option.value}" class="mt-1 text-blue-600 focus:ring-blue-500" ${currentAnswers[question.id] === option.value ? 'checked' : ''}>
                                    <div class="ml-3">
                                        <div class="font-medium text-gray-900">${option.label}</div>
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        questionContainer.innerHTML = categoryHtml;
        
        // Add event listeners for radio buttons
        category.questions.forEach(question => {
            const radios = document.querySelectorAll(`input[name="${question.id}"]`);
            radios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    currentAnswers[question.id] = e.target.value;
                    updateNavigation();
                    
                    // Update visual feedback
                    const labels = document.querySelectorAll(`input[name="${question.id}"]`).forEach(r => {
                        const label = r.closest('label');
                        if (r.checked) {
                            label.classList.add('border-blue-500', 'bg-blue-50');
                            label.classList.remove('border-gray-200');
                        } else {
                            label.classList.remove('border-blue-500', 'bg-blue-50');
                            label.classList.add('border-gray-200');
                        }
                    });
                });
            });
        });
    }

    function updateNavigation() {
        const currentCategory = assessmentData.categories[currentCategoryIndex];
        const allQuestionsAnswered = currentCategory.questions.every(q => currentAnswers[q.id]);
        
        prevBtn.disabled = currentCategoryIndex === 0;
        nextBtn.disabled = !allQuestionsAnswered;
        
        if (currentCategoryIndex === assessmentData.categories.length - 1) {
            nextBtn.textContent = 'Generate Results →';
        } else {
            nextBtn.textContent = 'Next →';
        }
    }

    function nextQuestion() {
        currentCategoryIndex++;
        showCurrentCategory();
    }

    function prevQuestion() {
        if (currentCategoryIndex > 0) {
            currentCategoryIndex--;
            showCurrentCategory();
        }
    }

    // --- RESULT GENERATION ---
    function generateResults() {
        try {
            const result = calculateResults(currentAnswers);
            currentResult = result;
            showResults(result);
        } catch (error) {
            console.error('Error generating results:', error);
            showAlert('An error occurred while generating results. Please try again.', 'Error', '⚠️');
        }
    }

    function calculateResults(answers) {
        let result = {
            id: editingId || generateId(),
            timestamp: new Date().toISOString(),
            answers: {...answers},
            techProfile: {},
            roles: {},
            summary: '',
            warnings: [],
            feasibility: { risk: 'Medium', confidence: 'Medium', summary: '' },
            eta: { min: 2, max: 6 },
            scope_title: 'Standard Project',
            uncertainties: []
        };

        let etaMultiplier = 1.0;
        let etaAddMin = 0;
        let etaAddMax = 0;

        // Check for uncertainties first
        Object.entries(answers).forEach(([questionId, answerValue]) => {
            const question = allQuestions.find(q => q.id === questionId);
            if (question) {
                const option = question.options.find(o => o.value === answerValue);
                if (option && option.is_uncertain) {
                    result.uncertainties.push({
                        question: question.text,
                        category: question.category,
                        weight: option.uncertainty_weight || 1
                    });
                }
            }
        });

        // Calculate uncertainty score
        const totalUncertaintyWeight = result.uncertainties.reduce((sum, u) => sum + u.weight, 0);

        // If too much uncertainty, return insufficient info result
        if (totalUncertaintyWeight >= 5) {
            result.insufficient_info = true;
            return result;
        }

        // Apply direct effects from answers
        Object.entries(answers).forEach(([questionId, answerValue]) => {
            const question = allQuestions.find(q => q.id === questionId);
            if (question) {
                const option = question.options.find(o => o.value === answerValue);
                if (option && option.effects) {
                    const effects = option.effects;
                    
                    // Apply tech profile effects
                    if (effects.techProfile) {
                        Object.assign(result.techProfile, effects.techProfile);
                    }
                    
                    // Apply role effects
                    if (effects.roles) {
                        Object.assign(result.roles, effects.roles);
                    }
                    
                    // Apply warnings
                    if (effects.warnings) {
                        result.warnings.push(...effects.warnings);
                    }
                    
                    // Apply feasibility
                    if (effects.feasibility) {
                        Object.assign(result.feasibility, effects.feasibility);
                    }
                    
                    // Apply ETA adjustments
                    if (effects.eta_multiplier) {
                        etaMultiplier *= effects.eta_multiplier;
                    }
                    if (effects.eta && effects.eta.addMin) {
                        etaAddMin += effects.eta.addMin;
                    }
                    if (effects.eta && effects.eta.addMax) {
                        etaAddMax += effects.eta.addMax;
                    }
                    
                    // Apply summary
                    if (effects.summary) {
                        result.summary = effects.summary;
                    }
                    
                    // Apply scope title
                    if (effects.scope_title) {
                        result.scope_title = effects.scope_title;
                    }
                }
            }
        });

        // Apply conditional rules
        if (assessmentData.rules) {
            assessmentData.rules.forEach(rule => {
                const conditionsMet = Object.entries(rule.conditions).every(([questionId, expectedValues]) => {
                    return expectedValues.includes(answers[questionId]);
                });
                
                if (conditionsMet && rule.effects) {
                    const effects = rule.effects;
                    
                    // Apply the same effect logic as direct effects
                    if (effects.techProfile) {
                        Object.assign(result.techProfile, effects.techProfile);
                    }
                    if (effects.roles) {
                        Object.assign(result.roles, effects.roles);
                    }
                    if (effects.warnings) {
                        result.warnings.push(...effects.warnings);
                    }
                    if (effects.feasibility) {
                        Object.assign(result.feasibility, effects.feasibility);
                    }
                    if (effects.eta_multiplier) {
                        etaMultiplier *= effects.eta_multiplier;
                    }
                    if (effects.eta && effects.eta.addMin) {
                        etaAddMin += effects.eta.addMin;
                    }
                    if (effects.eta && effects.eta.addMax) {
                        etaAddMax += effects.eta.addMax;
                    }
                    if (effects.summary) {
                        result.summary = effects.summary;
                    }
                    if (effects.scope_title) {
                        result.scope_title = effects.scope_title;
                    }
                }
            });
        }

        // Calculate final ETA
        result.eta.min = Math.round((result.eta.min * etaMultiplier) + etaAddMin);
        result.eta.max = Math.round((result.eta.max * etaMultiplier) + etaAddMax);

        // Ensure reasonable bounds
        result.eta.min = Math.max(1, result.eta.min);
        result.eta.max = Math.max(result.eta.min, result.eta.max);

        return result;
    }

    function showResults(resultData) {
        questionContainer.classList.add('hidden');
        wizardNav.classList.add('hidden');
        progressBarContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');

        document.getElementById('resultTimestamp').textContent = 
            `Generated on ${new Date(resultData.timestamp).toLocaleDateString()}`;

        if (resultData.insufficient_info) {
            insufficientInfoWarning.classList.remove('hidden');
            standardResultContainer.classList.add('hidden');
            
            const uncertainHtml = resultData.uncertainties.map(u => 
                `<div class="flex items-start py-2">
                    <span class="text-orange-500 mr-2">•</span>
                    <div>
                        <strong>${u.category}:</strong> ${u.question}
                    </div>
                </div>`
            ).join('');
            
            document.getElementById('uncertaintyList').innerHTML = uncertainHtml;
        } else {
            insufficientInfoWarning.classList.add('hidden');
            standardResultContainer.classList.remove('hidden');
            
            let resultHtml = '';

            // Add summary
            if (resultData.summary) {
                resultHtml += `
                    <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 class="font-semibold text-blue-900 mb-2">📋 Executive Summary</h4>
                        <p class="text-blue-800">${resultData.summary}</p>
                    </div>
                `;
            }

            // Add feasibility assessment
            if (resultData.feasibility && resultData.feasibility.summary) {
                const riskColor = {
                    'Low': 'green',
                    'Medium': 'yellow',
                    'High': 'orange',
                    'Very High': 'red'
                }[resultData.feasibility.risk] || 'gray';

                resultHtml += `
                    <div class="mb-6 p-4 bg-${riskColor}-50 border border-${riskColor}-200 rounded-lg">
                        <h4 class="font-semibold text-${riskColor}-900 mb-2">⚖️ Feasibility Assessment</h4>
                        <div class="flex items-center mb-2">
                            <span class="text-sm font-medium text-${riskColor}-700 mr-4">Risk Level: ${resultData.feasibility.risk}</span>
                            <span class="text-sm font-medium text-${riskColor}-700">Confidence: ${resultData.feasibility.confidence}</span>
                        </div>
                        <p class="text-${riskColor}-800">${resultData.feasibility.summary}</p>
                    </div>
                `;
            }

            // Add warnings
            if (resultData.warnings && resultData.warnings.length > 0) {
                resultHtml += `
                    <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 class="font-semibold text-red-900 mb-2">⚠️ Critical Warnings</h4>
                        <ul class="list-disc list-inside text-red-800 space-y-1">
                            ${resultData.warnings.map(warning => `<li>${warning}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            // Add technology profile
            if (Object.keys(resultData.techProfile).length > 0) {
                resultHtml += `
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold text-gray-900 mb-3">🔧 Technology Profile</h4>
                        <div class="bg-white border rounded-lg overflow-hidden">
                            <table class="w-full">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Aspect</th>
                                        <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Recommendation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Object.entries(resultData.techProfile).map(([key, value]) => `
                                        <tr class="border-t border-gray-200">
                                            <td class="px-4 py-3 text-sm font-medium text-gray-900">${formatAspectName(key)}</td>
                                            <td class="px-4 py-3 text-sm text-gray-700">${value}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            // Add team roles
            if (Object.keys(resultData.roles).length > 0) {
                resultHtml += `
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold text-gray-900 mb-3">👥 Required Team Roles</h4>
                        <div class="grid gap-4">
                            ${Object.entries(resultData.roles).map(([roleKey, role]) => `
                                <div class="bg-white border rounded-lg p-4">
                                    <h5 class="font-medium text-gray-900 mb-2">${role.title || formatAspectName(roleKey)}</h5>
                                    ${role.allocation ? `<p class="text-sm text-gray-600 mb-1"><strong>Allocation:</strong> ${role.allocation}</p>` : ''}
                                    ${role.priority ? `<p class="text-sm text-gray-600 mb-1"><strong>Priority:</strong> ${role.priority}</p>` : ''}
                                    ${role.experience ? `<p class="text-sm text-gray-600 mb-1"><strong>Experience:</strong> ${role.experience}</p>` : ''}
                                    ${role.knowledge ? `<p class="text-sm text-gray-600 mb-1"><strong>Knowledge:</strong> ${role.knowledge}</p>` : ''}
                                    ${role.criticalSkills ? `<p class="text-sm text-gray-600"><strong>Critical Skills:</strong> ${Array.isArray(role.criticalSkills) ? role.criticalSkills.join(', ') : role.criticalSkills}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Add timeline estimate
            resultHtml += `
                <div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 class="text-lg font-semibold text-gray-900 mb-2">⏱️ Timeline Estimate</h4>
                    <div class="text-lg font-bold text-blue-600">
                        ${resultData.eta.min}-${resultData.eta.max} months
                    </div>
                    <p class="text-sm text-gray-600 mt-1">
                        Total Duration (${resultData.scope_title})
                    </p>
                </div>
            `;

            document.getElementById('resultContent').innerHTML = resultHtml;
        }
    }

    // --- ASSESSMENT HISTORY ---
    async function saveCurrentAssessment() {
        if (!currentResult) return;

        try {
            const name = await promptForAssessmentName();
            if (!name) return;

            const assessments = getAssessmentsFromLocalStorage();
            const assessment = {
                ...currentResult,
                name: name,
                date: new Date().toLocaleDateString()
            };

            if (editingId) {
                const index = assessments.findIndex(a => a.id === editingId);
                if (index !== -1) {
                    assessments[index] = assessment;
                } else {
                    assessments.push(assessment);
                }
            } else {
                assessments.push(assessment);
            }

            saveAssessmentsToLocalStorage(assessments);
            await showAlert('Assessment saved successfully!', 'Success', '✅');
            editingId = null;
        } catch (error) {
            console.error('Error saving assessment:', error);
            await showAlert('Failed to save assessment. Please try again.', 'Error', '⚠️');
        }
    }

    function loadAssessmentHistory() {
        const assessments = getAssessmentsFromLocalStorage();
        
        if (assessments.length === 0) {
            historyContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">📋</div>
                    <p class="text-gray-500 text-lg">Complete an assessment and save it to see it here.</p>
                </div>
            `;
            return;
        }

        const historyHtml = assessments.reverse().map(item => {
            // Extract key information for display
            const riskColor = {
                'Low': 'text-green-600',
                'Medium': 'text-yellow-600',
                'High': 'text-orange-600',
                'Very High': 'text-red-600'
            }[item.feasibility?.risk] || 'text-gray-600';

            const confidenceColor = {
                'Very High': 'text-green-600',
                'High': 'text-green-600',
                'Medium': 'text-yellow-600',
                'Low': 'text-orange-600',
                'Very Low': 'text-red-600'
            }[item.feasibility?.confidence] || 'text-gray-600';

            return `
                <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-semibold text-gray-900">${item.name}</h3>
                            <p class="text-sm text-gray-500">Updated: ${item.date}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="loadAssessment('${item.id}')" class="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                                📝 Edit
                            </button>
                            <button onclick="deleteAssessment('${item.id}')" class="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors text-sm">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="text-sm font-medium text-gray-700">Feasibility Risk</div>
                            <div class="text-lg font-semibold ${riskColor}">${item.feasibility?.risk || 'Not assessed'}</div>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="text-sm font-medium text-gray-700">Confidence Level</div>
                            <div class="text-lg font-semibold ${confidenceColor}">${item.feasibility?.confidence || 'Not assessed'}</div>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="text-sm font-medium text-gray-700">Timeline</div>
                            <div class="text-lg font-semibold text-blue-600">${item.eta?.min || 'N/A'}-${item.eta?.max || 'N/A'} months</div>
                        </div>
                    </div>

                    ${item.insufficient_info ? `
                        <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                            <div class="text-orange-800 font-medium">⚠️ Insufficient Information</div>
                            <div class="text-orange-700 text-sm">This assessment needs more information to generate reliable recommendations.</div>
                        </div>
                    ` : ''}

                    ${item.warnings && item.warnings.length > 0 ? `
                        <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <div class="text-red-800 font-medium mb-2">🚨 Critical Warnings (${item.warnings.length})</div>
                            <div class="text-red-700 text-sm space-y-1">
                                ${item.warnings.slice(0, 2).map(warning => `<div>• ${warning}</div>`).join('')}
                                ${item.warnings.length > 2 ? `<div class="text-red-600 text-xs">+ ${item.warnings.length - 2} more warning(s)</div>` : ''}
                            </div>
                        </div>
                    ` : ''}

                    ${item.summary ? `
                        <div class="text-gray-700 text-sm">
                            <strong>Summary:</strong> ${item.summary.length > 200 ? item.summary.substring(0, 200) + '...' : item.summary}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        historyContainer.innerHTML = historyHtml;
    }

    // Make functions globally available for onclick handlers
    window.loadAssessment = function(id) {
        const assessments = getAssessmentsFromLocalStorage();
        const assessment = assessments.find(a => a.id === id);
        
        if (assessment) {
            // Switch to assessment page and start editing
            showPage('assessment');
            startAssessmentWithAnswers(assessment.answers, id);
        }
    };

    window.deleteAssessment = async function(id) {
        const confirmed = await showConfirm(
            'Are you sure you want to delete this assessment? This action cannot be undone.',
            'Delete Assessment',
            '🗑️',
            'Delete',
            'bg-red-600 hover:bg-red-700'
        );
        
        if (confirmed) {
            const assessments = getAssessmentsFromLocalStorage();
            const filteredAssessments = assessments.filter(a => a.id !== id);
            saveAssessmentsToLocalStorage(filteredAssessments);
            loadAssessmentHistory();
        }
    };

    // Start the application
    main();
});
