export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface BugReportInput {
  id: number;
  title: string;
  url: string;
  steps: string;
  expected: string;
  actual: string;
  severity: Severity;
}

export interface Screenshot {
  base64: string;
  mimeType: string;
  name: string;
  dataUrl: string;
}

export interface GeneratedReport {
  originalId: number;
  suggestedTitle: string;
  summary: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  impact: string;
  severity: Severity;
  environment: {
    browser: string;
    os: string;
    device: string;
  };
  suggestedFix?: string;
}