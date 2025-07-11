import { ENV } from '../config/env.js';
import { buildAIPrompt } from '../config/prompt-template.js';

export class ApiService {
  static async generateStrategicPlan(description, answers, initialResult) {
    const prompt = buildAIPrompt(description, answers, initialResult);

    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };
    const apiKey = ENV.GEMINI_API_KEY; 
    const modelName = ENV.GEMINI_MODEL_NAME;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
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
          return result.candidates[0].content.parts[0].text;
      } else {
          console.error("Invalid response structure from AI API:", result);
          throw new Error("Received an invalid or empty response from the AI service.");
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error; // Re-throw the error to be caught by the assessment service
    }
  }
}