import { GoogleGenAI, Type } from "@google/genai";
import type { BugReportInput, GeneratedReport, Screenshot } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const reportSchema = {
  type: Type.OBJECT,
  properties: {
    suggestedTitle: { type: Type.STRING, description: 'A concise, improved title for the bug report.' },
    summary: { type: Type.STRING, description: 'A brief summary of the bug and its impact.' },
    stepsToReproduce: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'A numbered list of clear, simple steps to reproduce the bug.'
    },
    expectedBehavior: { type: Type.STRING, description: 'A clear description of what should have happened.' },
    actualBehavior: { type: Type.STRING, description: 'A clear description of what actually happened.' },
    impact: { type: Type.STRING, description: 'The potential impact of this bug (e.g., user experience, data loss, functionality blocked).' },
    environment: {
      type: Type.OBJECT,
      properties: {
        browser: { type: Type.STRING, description: 'Assumed browser (e.g., Chrome, Firefox). State "Not specified" if unknown.' },
        os: { type: Type.STRING, description: 'Assumed operating system (e.g., Windows, macOS). State "Not specified" if unknown.' },
        device: { type: Type.STRING, description: 'Assumed device type (e.g., Desktop, Mobile). State "Not specified" if unknown.' }
      },
      required: ['browser', 'os', 'device']
    },
    suggestedFix: { type: Type.STRING, description: 'A brief, high-level suggestion for how to fix the bug, if obvious.' }
  },
  required: ['suggestedTitle', 'summary', 'stepsToReproduce', 'expectedBehavior', 'actualBehavior', 'impact', 'environment']
};


const buildPrompt = (bugInput: Omit<BugReportInput, 'id'>, hasImage: boolean) => {
  const environmentHint = (bugInput.browser || bugInput.os || bugInput.device)
    ? `
The user has provided the following environment details. Use them in your report. If any detail is missing, try to infer it.
- Browser: ${bugInput.browser || 'Not provided'}
- OS: ${bugInput.os || 'Not provided'}
- Device: ${bugInput.device || 'Not provided'}
`
    : 'The user has not provided specific environment details. Please infer the Browser, OS, and Device from the context provided (including the screenshot if available).';
    
  return `
You are an expert QA engineer. Your task is to take the following user-provided information and generate a professional, well-structured bug report.
The report should be clear, concise, and easy for a developer to understand and act upon.

User Input:
- Title: ${bugInput.title}
- URL: ${bugInput.url}
- Steps to Reproduce:
${bugInput.steps}
- Expected Result: ${bugInput.expected}
- Actual Result: ${bugInput.actual}

${environmentHint}

${hasImage ? 'An image of the bug has been provided. Analyze the image for additional context like UI elements, error messages, or visual glitches.' : ''}

Please analyze this information and generate the bug report. Pay close attention to detail and infer potential impact and environmental factors where appropriate.
Format your response strictly as a JSON object that adheres to the provided schema. Do not include any markdown formatting or escape characters in the JSON output.
`;
};


export const generateBugReport = async (bugInput: Omit<BugReportInput, 'id'>, screenshot: Screenshot | null): Promise<Omit<GeneratedReport, 'originalId'>> => {
  const promptText = buildPrompt(bugInput, !!screenshot);
  
  const contents = screenshot
    ? { parts: [
        { inlineData: { mimeType: screenshot.mimeType, data: screenshot.base64 } },
        { text: promptText }
      ] }
    : promptText;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: reportSchema,
      temperature: 0.2,
    },
  });

  try {
    const jsonString = response.text;
    const reportData = JSON.parse(jsonString);
    return reportData as Omit<GeneratedReport, 'originalId'>;
  } catch (error) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("The AI returned an invalid response format.");
  }
};
