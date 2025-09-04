
export interface BugReportInput {
  title: string;
  url: string;
  steps: string;
  expected: string;
  actual: string;
}

export interface Screenshot {
  base64: string;
  mimeType: string;
  name: string;
}

export interface GeneratedReport {
  suggestedTitle: string;
  summary: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  impact: string;
  environment: {
    browser: string;
    os: string;
    device: string;
  };
  suggestedFix?: string;
}
