import { ENV } from '../config/env.js';
import { buildAIPrompt, buildAIFeasibilityPrompt } from '../config/prompt-template.js';

export class ApiService {

  /**
    * NEW: Generates a feasibility explanation for high-risk projects.
  */
  static async generateFeasibilityExplanation(description, answers, initialResult) {
    const { systemPrompt, userPrompt } = buildAIFeasibilityPrompt(description, answers, initialResult);
    
    const genAI = new window.GoogleGenerativeAI(ENV.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: ENV.GEMINI_MODEL_NAME,
      systemInstruction: { parts: [{ text: systemPrompt }] },
    });

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      });
      const response = result.response;
      if (!response) {
        throw new Error("Received an invalid or empty response from the AI service.");
      }
      return response.text();
    } catch (error) {
      console.error("Error calling Gemini API for Feasibility Explanation:", error);
      throw error;
    }
  }

  static async generateStrategicPlan(description, answers, initialResult) {
    const { systemPrompt, userPrompt } = buildAIPrompt(description, answers, initialResult);

    // Initialize the official Google AI SDK
    const genAI = new window.GoogleGenerativeAI(ENV.GEMINI_API_KEY);

    // CORRECTED: System instructions are now passed during model initialization[14].
    const model = genAI.getGenerativeModel({
      model: ENV.GEMINI_MODEL_NAME,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
    });

    // Define the sections we expect in the response
    const requiredSections = [
      'executive_summary',
      'strategic_recommendations',
      'phased_project_roadmap',
      'team_and_resource_plan',
      'budgetary_considerations',
      'next_steps'
    ];

    // Retry logic remains important
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // CORRECTED: The generateContent call is now cleaner, with all
        // configuration nested correctly[6][17].
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            // maxOutputTokens: 65000,
            // thinkingConfig is nested within generationConfig
            thinkingConfig: {
              thinkingBudget: 0,
            }
          },
        });

        const response = result.response;

        if (response) {
          const rawText = response.text();

        //   console.log("--- Raw Gemini API Response (Attempt " + attempt + ") ---");
        //   console.log(rawText);
        //   console.log("-------------------------------------------------");

          const startIndex = rawText.indexOf('<master_plan>');
          const endIndex = rawText.lastIndexOf('</master_plan>');

          let cleanedText = "";
          if (startIndex !== -1 && endIndex !== -1) {
            cleanedText = rawText.substring(startIndex, endIndex + '</master_plan>'.length);
          } else {
            console.warn(`Attempt ${attempt}: AI response was missing the <master_plan> container tags. Retrying...`);
            continue;
          }

          const allSectionsPresent = requiredSections.every(section =>
            cleanedText.includes(`<${section}>`) && cleanedText.includes(`</${section}>`)
          );

          if (allSectionsPresent) {
            return cleanedText;
          } else {
            console.warn(`Attempt ${attempt}: AI response was missing one or more required sub-sections after cleaning. Retrying...`);
          }
        } else {
          console.error("Invalid response structure from AI API:", response);
          throw new Error("Received an invalid or empty response from the AI service.");
        }
      } catch (error) {
        console.error(`Error on attempt ${attempt} calling Gemini API:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }

    throw new Error(`Failed to generate a complete strategic plan after ${maxRetries} attempts.`);
  }
}
