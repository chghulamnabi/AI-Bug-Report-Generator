import type { GeneratedReport } from './types';

export const generateJiraMarkup = (reportData: GeneratedReport): string => {
    const steps = reportData.stepsToReproduce.map((step) => `# ${step}`).join('\n');

    return `
h2. Summary
${reportData.summary}

h2. Steps to Reproduce
${steps}

h2. Expected Behavior
${reportData.expectedBehavior}

h2. Actual Behavior
${reportData.actualBehavior}

h2. Impact
${reportData.impact}

h2. Environment
*Browser:* ${reportData.environment.browser}
*OS:* ${reportData.environment.os}
*Device:* ${reportData.environment.device}

h2. Suggested Fix
${reportData.suggestedFix || 'N/A'}
    `.trim();
};
