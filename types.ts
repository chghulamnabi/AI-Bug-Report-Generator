export interface BugReportInput {
  id: number;
  title: string;
  url: string;
  steps: string;
  expected: string;
  actual: string;
  os: string;
  browser: string;
  device: string;
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
  environment: {
    browser: string;
    os: string;
    device: string;
  };
  suggestedFix?: string;
}
