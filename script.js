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
    const nextBtn = document.getElementById('nextBtn'); // Fixed typo
    const startOverBtn = document.getElementById('startOverBtn');
    const saveAssessmentBtn = document.getElementById('saveAssessmentBtn');
    const insufficientInfoWarning = document.getElementById('insufficientInfoWarning');
    const standardResultContainer = document.getElementById('standardResult');

    // --- UTILITY FUNCTIONS ---
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Function to safely get assessments from localStorage
    function getAssessmentsFromLocalStorage() {
        try {
            const data = localStorage.getItem('assessments');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error parsing assessments from localStorage:", e);
            // In case of corruption, clear it to prevent endless loops
            localStorage.removeItem('assessments');
            alert("Your stored assessments data was corrupted and has been cleared. Please try saving again.");
            return [];
        }
    }

    // Function to safely save assessments to localStorage
    function saveAssessmentsToLocalStorage(assessments) {
        try {
            localStorage.setItem('assessments', JSON.stringify(assessments));
        } catch (e) {
            console.error("Error saving assessments to localStorage:", e);
            alert("Failed to save assessment. Local storage might be full or you're in private browsing mode.");
        }
    }

    function formatAspectName(key) {
        // List of terms that should remain exactly as they are (acronyms, specific names)
        const specialTerms = [
            'XAI', 'MLOps', 'NLP', 'RAG', 'GPU', 'SLA', 'API', 'ETL', 'ELT', 'KPI',
            'PoC', 'MVP', 'SRE', 'PII', 'PHI', 'SOX', 'GDPR', 'HIPAA', 'CCPA'
        ];

        if (specialTerms.includes(key)) {
            return key;
        }

        // Convert camelCase to space-separated words
        // This regex looks for a lowercase letter followed by an uppercase letter and inserts a space
        let formattedKey = key.replace(/([a-z])([A-Z])/g, '$1 $2');

        // Capitalize the first letter of the result
        formattedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);

        return formattedKey;
    }

    function promptForAssessmentName() {
        let name = '';
        while (!name || name.trim() === '') {
            name = prompt('Please enter a name for this assessment:', 'AI Project Assessment');
            if (name === null) return null; // User cancelled
            if (name.trim() === '') {
                alert('Assessment name cannot be empty. Please try again.');
            }
        }
        return name.trim();
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
            wizardContainer.innerHTML = `<div class="p-8 text-center text-red-600">
                <h3 class="text-xl font-bold mb-2">Error loading assessment data</h3>
                <p>${error.message}</p>
            </div>`;
        }
    }

    // --- NAVIGATION ---
    function setupNavigation() {
        Object.keys(navLinks).forEach(key => {
            navLinks[key].addEventListener('click', (e) => {
                e.preventDefault();
                showPage(key);
            });
        });
    }

    function showPage(pageKey) {
        Object.values(pages).forEach(page => page.classList.add('hidden'));
        Object.values(navLinks).forEach(link => link.classList.remove('active'));
        pages[pageKey].classList.remove('hidden');
        navLinks[pageKey].classList.add('active');
        
        if(pageKey === 'history') renderHistory();
        if(pageKey === 'assessment') startNewAssessment();
    }

    // --- WIZARD LOGIC ---
    function startNewAssessment(prefillAnswers = {}, assessmentId = null) {
        currentAnswers = prefillAnswers;
        currentResult = null;
        editingId = assessmentId;
        currentCategoryIndex = 0;
        
        resultContainer.classList.add('hidden');
        wizardContainer.classList.remove('hidden');
        wizardStart.classList.remove('hidden');
        progressBarContainer.classList.add('hidden');
        questionContainer.classList.add('hidden');
        wizardNav.classList.add('hidden');
    }

    function beginWizard() {
        wizardStart.classList.add('hidden');
        progressBarContainer.classList.remove('hidden');
        questionContainer.classList.remove('hidden');
        wizardNav.classList.remove('hidden');
        renderCurrentCategory();
    }

    function renderCurrentCategory() {
        if (!assessmentData.categories || assessmentData.categories.length === 0) return;

        const category = assessmentData.categories[currentCategoryIndex];
        if (!category) return;

        let questionsHtml = '';
        category.questions.forEach(question => {
            let optionsHtml = '';
            question.options.forEach(opt => {
                const isSelected = currentAnswers[question.id] === opt.value;
                optionsHtml += `
                    <label class="flex items-start p-3 rounded-md border cursor-pointer transition-all hover:bg-slate-50 ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}">
                        <input type="radio" name="${question.id}" value="${opt.value}" class="mt-1 mr-3 text-indigo-600" ${isSelected ? 'checked' : ''}>
                        <span class="text-slate-700">${opt.label}</span>
                    </label>
                `;
            });

            questionsHtml += `
                <div class="mb-8">
                    <h3 class="text-xl font-semibold mb-4 text-slate-800">${question.text}</h3>
                    <div class="space-y-2">
                        ${optionsHtml}
                    </div>
                </div>
            `;
        });

        questionContainer.innerHTML = `
            <div class="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-slate-900">${category.name}</h2>
                </div>
                ${questionsHtml}
            </div>
        `;

        // Update progress
        const progress = ((currentCategoryIndex + 1) / assessmentData.categories.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `Step ${currentCategoryIndex + 1} of ${assessmentData.categories.length}`;
        progressPercentage.textContent = `${Math.round(progress)}%`;

        // Update navigation buttons
        prevBtn.disabled = currentCategoryIndex === 0;
        prevBtn.className = currentCategoryIndex === 0 
            ? 'bg-gray-200 text-gray-400 font-bold py-2 px-6 rounded-lg cursor-not-allowed'
            : 'bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-400 transition-all';

        const isLastCategory = currentCategoryIndex === assessmentData.categories.length - 1;
        nextBtn.textContent = isLastCategory ? 'Generate Assessment' : 'Next';
        
        // Add event listeners to radio buttons
        document.querySelectorAll(`input[type="radio"]`).forEach(radio => {
            radio.addEventListener('change', handleAnswerChange);
        });
    }

    function handleAnswerChange(event) {
        currentAnswers[event.target.name] = event.target.value;
    }

    function navigateWizard(direction) {
        if (direction === 'next') {
            if (currentCategoryIndex < assessmentData.categories.length - 1) {
                currentCategoryIndex++;
                renderCurrentCategory();
            } else {
                generateAssessment();
            }
        } else if (direction === 'prev' && currentCategoryIndex > 0) {
            currentCategoryIndex--;
            renderCurrentCategory();
        }
    }

    // --- RESULT CALCULATION ---
    function generateAssessment() {
        const result = calculateResult();
        currentResult = result;
        renderResult(result);
        
        // Hide wizard, show results
        wizardContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');
    }

    function calculateResult() {
        let resultData = {
            answers: {...currentAnswers},
            timestamp: new Date().toISOString(),
            techProfile: {},
            summary: '',
            warnings: [],
            roles: {},
            eta: { min: 3, max: 6 },
            eta_multiplier: 1.0,
            feasibility: { risk: 'Medium', confidence: 'Medium', summary: '' },
            scope_title: 'Project',
            avoidTech: [],
            uncertainties: [],
            alternatives: [],
            successFactors: [],
            commonPitfalls: [],
            riskFactors: [],
            complianceRequirements: [],
            infrastructureNeeds: [],
            budgetAllocation: {},
            deliverables: [],
            qualityGates: []
        };

        let uncertaintyScore = 0;
        let totalQuestions = allQuestions.length;

        // Process individual question effects
        allQuestions.forEach(question => {
            const answer = currentAnswers[question.id];
            if (!answer) return;

            const selectedOption = question.options.find(opt => opt.value === answer);
            if (!selectedOption || !selectedOption.effects) return;

            // Handle uncertainty
            if (selectedOption.is_uncertain) {
                const weight = selectedOption.uncertainty_weight || 1;
                uncertaintyScore += weight;
                resultData.uncertainties.push({
                    question: question.text,
                    category: question.category,
                    weight: weight
                });
            }

            // Merge effects
            mergeEffects(resultData, selectedOption.effects);
        });

        // Apply rules
        if (assessmentData.rules) {
            assessmentData.rules.forEach(rule => {
                if (ruleMatches(rule.conditions, currentAnswers)) {
                    mergeEffects(resultData, rule.effects);
                }
            });
        }

        // Calculate final ETA
        resultData.eta.min = Math.ceil(resultData.eta.min * resultData.eta_multiplier);
        resultData.eta.max = Math.ceil(resultData.eta.max * resultData.eta_multiplier);

        // Determine if there's insufficient information
        const uncertaintyThreshold = Math.ceil(totalQuestions * 0.3); // 30% threshold
        resultData.hasInsufficientInfo = uncertaintyScore >= uncertaintyThreshold;
        resultData.uncertaintyScore = uncertaintyScore;

        return resultData;
    }

    function mergeEffects(resultData, effects) {
        // Merge tech profile
        if (effects.techProfile) {
            Object.assign(resultData.techProfile, effects.techProfile);
        }

        // Handle arrays
        ['warnings', 'avoidTech', 'alternatives', 'successFactors', 'commonPitfalls', 
         'riskFactors', 'complianceRequirements', 'infrastructureNeeds', 'deliverables', 'qualityGates'].forEach(key => {
            if (effects[key]) {
                resultData[key] = [...(resultData[key] || []), ...(Array.isArray(effects[key]) ? effects[key] : [effects[key]])];
            }
        });

        // Handle objects
        ['roles', 'budgetAllocation'].forEach(key => {
            if (effects[key]) {
                resultData[key] = {...resultData[key], ...effects[key]};
            }
        });

        // Handle primitives
        ['summary', 'scope_title'].forEach(key => {
            if (effects[key]) {
                resultData[key] = effects[key];
            }
        });

        // Handle numbers and multipliers
        if (effects.eta_multiplier) {
            resultData.eta_multiplier *= effects.eta_multiplier;
        }

        if (effects.eta) {
            if (effects.eta.addMin) resultData.eta.min += effects.eta.addMin;
            if (effects.eta.addMax) resultData.eta.max += effects.eta.addMax;
        }

        // Handle feasibility
        if (effects.feasibility) {
            Object.assign(resultData.feasibility, effects.feasibility);
        }
    }

    function ruleMatches(conditions, answers) {
        return Object.entries(conditions).every(([questionId, expectedValues]) => {
            const userAnswer = answers[questionId];
            return expectedValues.includes(userAnswer);
        });
    }

    // --- RESULT RENDERING ---
    function renderResult(resultData) {
        if (resultData.hasInsufficientInfo) {
            renderInsufficientInfoWarning(resultData);
            standardResultContainer.classList.add('hidden');
            insufficientInfoWarning.classList.remove('hidden');
        } else {
            renderStandardResult(resultData);
            insufficientInfoWarning.classList.add('hidden');
            standardResultContainer.classList.remove('hidden');
        }
    }

    function renderInsufficientInfoWarning(resultData) {
        let uncertainHtml = '<ul class="list-disc list-inside space-y-2 mt-4">';
        resultData.uncertainties.forEach(unc => {
            uncertainHtml += `<li><strong>${unc.category}:</strong> ${unc.question}</li>`;
        });
        uncertainHtml += '</ul>';

        insufficientInfoWarning.innerHTML = `
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div class="flex items-start">
                    <svg class="h-6 w-6 text-amber-500 mt-1 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                        <h3 class="text-lg font-bold text-amber-800 mb-2">Insufficient Information for Reliable Assessment</h3>
                        <p class="text-amber-700 mb-4">
                            The assessment cannot be reliably generated because critical information is missing or uncertain. 
                            To create an accurate technology and resource plan, please gather more details on the following topics before re-running the assessment:
                        </p>
                        ${uncertainHtml}
                        <div class="mt-6 p-4 bg-amber-100 rounded-lg">
                            <p class="text-amber-800 font-medium">
                                <strong>Recommendation:</strong> Address these uncertainties with stakeholders and domain experts, 
                                then re-run the assessment for a comprehensive technology roadmap.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderStandardResult(resultData) {
        const feasibilityClass = {
            'Very Low': 'bg-red-100 text-red-800',
            'Low': 'bg-red-100 text-red-800',
            'Medium': 'bg-yellow-100 text-yellow-800',
            'High': 'bg-green-100 text-green-800',
            'Very High': 'bg-red-100 text-red-800'
        };

        const riskClass = {
            'Very Low': 'bg-green-100 text-green-800',
            'Low': 'bg-green-100 text-green-800',
            'Medium': 'bg-yellow-100 text-yellow-800',
            'High': 'bg-red-100 text-red-800',
            'Very High': 'bg-red-100 text-red-800'
        };

        let resultHtml = `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
                    <h2 class="text-2xl font-bold mb-2">AI Project Assessment Results</h2>
                    <p class="text-indigo-100">Generated on ${new Date(resultData.timestamp).toLocaleDateString()}</p>
                </div>
                
                <div class="p-6 space-y-8">
        `;

        // Executive Summary
        if (resultData.summary) {
            resultHtml += `
                <div class="bg-slate-50 p-6 rounded-lg">
                    <h3 class="text-xl font-bold mb-3 text-slate-800">Executive Summary</h3>
                    <p class="text-slate-700 leading-relaxed">${resultData.summary}</p>
                </div>
            `;
        }

        // Feasibility Assessment
        if (resultData.feasibility) {
            resultHtml += `
                <div class="border border-slate-200 rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-4 text-slate-800">Feasibility Assessment</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <span class="text-sm font-medium text-slate-600">Risk Level</span>
                            <div class="mt-1">
                                <span class="inline-flex px-3 py-1 text-sm font-medium rounded-full ${riskClass[resultData.feasibility.risk] || 'bg-gray-100 text-gray-800'}">
                                    ${resultData.feasibility.risk || 'Not Assessed'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <span class="text-sm font-medium text-slate-600">Confidence Level</span>
                            <div class="mt-1">
                                <span class="inline-flex px-3 py-1 text-sm font-medium rounded-full ${feasibilityClass[resultData.feasibility.confidence] || 'bg-gray-100 text-gray-800'}">
                                    ${resultData.feasibility.confidence || 'Not Assessed'}
                                </span>
                            </div>
                        </div>
                    </div>
                    ${resultData.feasibility.summary ? `<p class="text-slate-700">${resultData.feasibility.summary}</p>` : ''}
                </div>
            `;
        }

        // Critical Warnings
        if (resultData.warnings && resultData.warnings.length > 0) {
            resultHtml += `
                <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-4 text-red-800 flex items-center">
                        <svg class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Critical Warnings
                    </h3>
                    <ul class="space-y-2">
                        ${resultData.warnings.map(warning => `<li class="flex items-start"><span class="text-red-600 mr-2">•</span><span class="text-red-700">${warning}</span></li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Technology Profile
        if (Object.keys(resultData.techProfile).length > 0) {
            resultHtml += `
                <div class="border border-slate-200 rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-4 text-slate-800">Technology Profile</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-slate-200">
                            <thead>
                                <tr>
                                    <th class="px-4 py-2 text-left text-sm font-medium text-slate-600 uppercase tracking-wider bg-slate-50">Aspect</th>
                                    <th class="px-4 py-2 text-left text-sm font-medium text-slate-600 uppercase tracking-wider bg-slate-50">Recommendation</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-200">
                                ${Object.entries(resultData.techProfile).map(([key, value]) => `
                                    <tr>
                                        <td class="px-4 py-2 text-sm font-medium text-slate-800">${formatAspectName(key)}</td>
                                        <td class="px-4 py-2 text-sm text-slate-700">${value}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        // Team & Roles
        if (Object.keys(resultData.roles).length > 0) {
            let rolesHtml = '<div class="space-y-4">';
            Object.entries(resultData.roles).forEach(([roleKey, role]) => {
                const title = role.title || formatAspectName(roleKey.replace(/_/g, '')); // Use formatAspectName for role keys too
                rolesHtml += `
                    <div class="border border-slate-200 rounded-lg p-4">
                        <h4 class="font-bold text-slate-800 mb-2">${title}</h4>
                        ${role.allocation ? `<p class="text-sm text-slate-600 mb-1"><strong>Allocation:</strong> ${role.allocation}</p>` : ''}
                        ${role.priority ? `<p class="text-sm text-slate-600 mb-1"><strong>Priority:</strong> ${role.priority}</p>` : ''}
                        ${role.experience ? `<p class="text-sm text-slate-600 mb-1"><strong>Experience:</strong> ${role.experience}</p>` : ''}
                        ${role.knowledge ? `<p class="text-sm text-slate-600"><strong>Knowledge:</strong> ${role.knowledge}</p>` : ''}
                        ${role.criticalSkills ? `<p class="text-sm text-slate-600 mt-2"><strong>Critical Skills:</strong> ${Array.isArray(role.criticalSkills) ? role.criticalSkills.join(', ') : role.criticalSkills}</p>` : ''}
                    </div>
                `;
            });
            rolesHtml += '</div>';

            resultHtml += `
                <div class="border border-slate-200 rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-4 text-slate-800">Required Team & Expertise</h3>
                    ${rolesHtml}
                </div>
            `;
        }

        // Timeline
        resultHtml += `
            <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <h3 class="text-xl font-bold mb-3 text-indigo-800">Project Timeline</h3>
                <div class="text-center">
                    <div class="text-3xl font-bold text-indigo-600 mb-2">
                        ${resultData.eta.min}-${resultData.eta.max} months
                    </div>
                    <p class="text-indigo-700">Total Duration (${resultData.scope_title})</p>
                </div>
            </div>
        `;

        // Additional sections for enhanced features
        const additionalSections = [
            { key: 'successFactors', title: 'Success Factors', icon: '✓' },
            { key: 'commonPitfalls', title: 'Common Pitfalls to Avoid', icon: '⚠️' },
            { key: 'riskFactors', title: 'Risk Factors', icon: '⚡' },
            { key: 'alternatives', title: 'Alternative Approaches', icon: '🔄' },
            { key: 'infrastructureNeeds', title: 'Infrastructure Requirements', icon: '🏗️' },
            { key: 'complianceRequirements', title: 'Compliance Requirements', icon: '📋' },
            { key: 'deliverables', title: 'Key Deliverables', icon: '📦' },
            { key: 'qualityGates', title: 'Quality Gates', icon: '🔒' }
        ];

        additionalSections.forEach(section => {
            if (resultData[section.key] && resultData[section.key].length > 0) {
                resultHtml += `
                    <div class="border border-slate-200 rounded-lg p-6">
                        <h3 class="text-xl font-bold mb-4 text-slate-800 flex items-center">
                            <span class="mr-2">${section.icon}</span>
                            ${section.title}
                        </h3>
                        <ul class="space-y-2">
                            ${resultData[section.key].map(item => `<li class="flex items-start"><span class="text-slate-400 mr-2">•</span><span class="text-slate-700">${item}</span></li>`).join('')}
                        </ul>
                    </div>
                `;
            }
        });

        // Technologies to Avoid
        if (resultData.avoidTech && resultData.avoidTech.length > 0) {
            resultHtml += `
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-4 text-amber-800 flex items-center">
                        <span class="mr-2">🚫</span>
                        Technologies to Avoid
                    </h3>
                    <ul class="space-y-2">
                        ${resultData.avoidTech.map(tech => `<li class="flex items-start"><span class="text-amber-500 mr-2">•</span><span class="text-amber-700">${tech}</span></li>`).join('')}
                    </ul>
                </div>
            `;
        }

        resultHtml += '</div></div>';
        standardResultContainer.innerHTML = resultHtml;
    }

    // --- HISTORY MANAGEMENT ---
    function saveAssessment() {
        if (!currentResult) return;
        
        // Prompt for assessment name
        const assessmentName = promptForAssessmentName();
        if (!assessmentName) return; // User cancelled
        
        let assessments = getAssessmentsFromLocalStorage();
        const assessmentData = {
            id: editingId || generateId(),
            name: assessmentName,
            ...currentResult,
            date: new Date().toLocaleDateString()
        };

        if (editingId) {
            const index = assessments.findIndex(a => a.id === editingId);
            if (index !== -1) assessments[index] = assessmentData;
        } else {
            assessments.unshift(assessmentData);
        }

        saveAssessmentsToLocalStorage(assessments);
        alert(editingId ? 'Assessment updated successfully!' : 'Assessment saved successfully!');
        editingId = null;
    }

    function renderHistory() {
        const assessments = getAssessmentsFromLocalStorage();
        
        if (assessments.length === 0) {
            historyContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-slate-400 mb-4">
                        <svg class="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-slate-700 mb-2">No saved assessments</h3>
                    <p class="text-slate-500">Complete an assessment and save it to see it here.</p>
                </div>
            `;
            return;
        }

        historyContainer.innerHTML = assessments.map(item => `
            <div class="bg-white p-6 rounded-lg shadow border border-slate-200">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-slate-800">${item.name || 'Unnamed Assessment'}</h3>
                        <p class="text-sm text-slate-600">Updated: ${item.date}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="reviewAssessment('${item.id}')" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Review</button>
                        <button onclick="editAssessment('${item.id}')" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                        <button onclick="deleteAssessment('${item.id}')" class="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span class="font-medium text-slate-600">Risk Level:</span>
                        <span class="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            item.feasibility?.risk === 'High' || item.feasibility?.risk === 'Very High' 
                                ? 'bg-red-100 text-red-800' 
                                : item.feasibility?.risk === 'Medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                        }">
                            ${item.feasibility?.risk || 'Not Assessed'}
                        </span>
                    </div>
                    <div>
                        <span class="font-medium text-slate-600">Timeline:</span>
                        <span class="ml-2">${item.eta?.min || 'N/A'}-${item.eta?.max || 'N/A'} months</span>
                    </div>
                    <div>
                        <span class="font-medium text-slate-600">Tech Category:</span>
                        <span class="ml-2">${item.techProfile?.Category || 'Not Specified'}</span>
                    </div>
                </div>
                
                ${item.warnings && item.warnings.length > 0 ? `
                    <div class="mt-4 p-3 bg-red-50 rounded-md">
                        <h4 class="text-sm font-medium text-red-800 mb-1">Key Warnings:</h4>
                        <ul class="text-sm text-red-700 space-y-1">
                            ${item.warnings.slice(0, 2).map(warning => `<li>• ${warning}</li>`).join('')}
                            ${item.warnings.length > 2 ? `<li class="text-red-600">... and ${item.warnings.length - 2} more</li>` : ''}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // --- EVENT LISTENERS ---
    function addEventListeners() {
        startAssessmentBtn.addEventListener('click', beginWizard);
        prevBtn.addEventListener('click', () => navigateWizard('prev'));
        nextBtn.addEventListener('click', () => navigateWizard('next'));
        startOverBtn.addEventListener('click', () => {
            showPage('assessment');
            startNewAssessment();
        });
        saveAssessmentBtn.addEventListener('click', saveAssessment);
    }

    // Global functions for history management (exposed to window for onclick in dynamically generated HTML)
    window.editAssessment = function(id) {
        const assessments = getAssessmentsFromLocalStorage();
        const assessment = assessments.find(a => a.id === id);
        if (assessment) {
            showPage('assessment');
            startNewAssessment(assessment.answers, id);
        }
    };

    window.reviewAssessment = function(id) {
        const assessments = getAssessmentsFromLocalStorage();
        const assessment = assessments.find(a => a.id === id);
        if (assessment) {
            currentResult = assessment;
            renderResult(assessment);
            showPage('assessment');
            
            // Hide wizard, show results
            wizardContainer.classList.add('hidden');
            resultContainer.classList.remove('hidden');
        }
    };

    window.deleteAssessment = function(id) {
        let assessments = getAssessmentsFromLocalStorage();
        const assessmentToDelete = assessments.find(a => a.id === id);
        const assessmentName = assessmentToDelete ? assessmentToDelete.name || 'this assessment' : 'this assessment';
        
        if (confirm(`Are you sure you want to delete "${assessmentName}"? This action cannot be undone.`)) {
            const filtered = assessments.filter(a => a.id !== id);
            saveAssessmentsToLocalStorage(filtered);
            renderHistory(); // Re-render history to show changes
            alert('Assessment deleted successfully.');
        }
    };

    // Start the application
    main();
});
