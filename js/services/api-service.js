import { ENV } from '../config/env.js';
import { buildAIPrompt } from '../config/prompt-template.js';

export class ApiService {
  static async generateStrategicPlan(description, answers, initialResult) {
    const { systemPrompt, userPrompt } = buildAIPrompt(description, answers, initialResult);

    const payload = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ]
    };
    
    const apiKey = ENV.GEMINI_API_KEY; 
    const modelName = ENV.GEMINI_MODEL_NAME;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    // Define the sections we expect in the response
    const requiredSections = [
      'executive_summary',
      'strategic_recommendations',
      'phased_project_roadmap',
      'team_and_resource_plan',
      'budgetary_considerations',
      'next_steps'
    ];
    
    // Retry logic
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
            const generatedText = result.candidates[0].content.parts[0].text;
            
            // Validate that all required sections are present
            const allSectionsPresent = requiredSections.every(section => 
              generatedText.includes(`<${section}>`) && generatedText.includes(`</${section}>`)
            );
            
            if (allSectionsPresent) {
              // Success! Return the complete plan.
              return generatedText;
            } else {
              console.warn(`Attempt ${attempt}: AI response was missing one or more required sections. Retrying...`);
              // Continue to the next iteration to retry
            }
        } else {
            console.error("Invalid response structure from AI API:", result);
            throw new Error("Received an invalid or empty response from the AI service.");
        }
      } catch (error) {
        console.error(`Error on attempt ${attempt} calling Gemini API:`, error);
        // If it's the last attempt, re-throw the error to be caught by the caller
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
    
    // If the loop completes without a valid response
    throw new Error(`Failed to generate a complete strategic plan after ${maxRetries} attempts.`);
  }
}