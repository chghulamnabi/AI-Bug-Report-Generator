import React, { useState, useEffect } from 'react';
import type { GeneratedReport, Screenshot } from '../types';
import ClipboardIcon from './icons/ClipboardIcon';
import JiraIcon from './icons/JiraIcon';

interface ReportDisplayProps {
  reports: GeneratedReport[];
  isLoading: boolean;
  bugCount: number;
  projectName: string;
  buildNumber: string;
  companyLogo: Screenshot | null;
  isJiraConfigured: boolean;
  onCreateJiraIssue: (report: GeneratedReport) => void;
  jiraSubmissionStatus: { [key: number]: { status: 'idle' | 'loading' | 'success' | 'error', message: string } };
}

const ReportSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">{title}</h3>
    <div className="text-gray-600 dark:text-gray-300 space-y-1">{children}</div>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse p-4 mb-4 border border-gray-200 dark:border-gray-700 rounded-lg">
    <div className="space-y-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
    </div>
    <div className="space-y-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
    </div>
    <div className="space-y-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-16 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
    </div>
  </div>
);

interface SingleReportProps {
    report: GeneratedReport;
    index: number;
    isJiraConfigured: boolean;
    onCreateJiraIssue: (report: GeneratedReport) => void;
    jiraStatus: { status: 'idle' | 'loading' | 'success' | 'error', message: string } | undefined;
}

const SingleReport: React.FC<SingleReportProps> = ({ report, index, isJiraConfigured, onCreateJiraIssue, jiraStatus }) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    useEffect(() => {
        if (copyStatus === 'copied') {
        const timer = setTimeout(() => setCopyStatus('idle'), 2000);
        return () => clearTimeout(timer);
        }
    }, [copyStatus]);

    const generatePlainTextForCopy = (reportData: GeneratedReport): string => {
        return `
**Bug Report: ${reportData.suggestedTitle}**

**Summary:**
${reportData.summary}

**Steps to Reproduce:**
${reportData.stepsToReproduce.map((step, index) => `${index + 1}. ${step}`).join('\n')}

**Expected Behavior:**
${reportData.expectedBehavior}

**Actual Behavior:**
${reportData.actualBehavior}

**Impact:**
${reportData.impact}

**Environment:**
- Browser: ${reportData.environment.browser}
- OS: ${reportData.environment.os}
- Device: ${reportData.environment.device}

**Suggested Fix:**
${reportData.suggestedFix || 'N/A'}
        `.trim();
    };

    const handleCopy = () => {
        if (report) {
            navigator.clipboard.writeText(generatePlainTextForCopy(report));
            setCopyStatus('copied');
        }
    };
    
    const jiraButtonLoading = jiraStatus?.status === 'loading';
    
    return (
        <article className="space-y-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg not-last:mb-6">
            <div className="relative">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 break-words pr-24">
                  <span className="text-primary-500 mr-2">#{index + 1}</span>{report.suggestedTitle}
                </h2>
                <div className="absolute top-0 right-0 flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        title="Copy report text"
                        className="copy-button hide-on-pdf p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition"
                        >
                        {copyStatus === 'copied' ? <span className="text-xs px-1">Copied!</span> : <ClipboardIcon className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => onCreateJiraIssue(report)}
                        disabled={!isJiraConfigured || jiraButtonLoading}
                        title={isJiraConfigured ? "Create Jira Issue" : "Please configure Jira settings first"}
                        className="hide-on-pdf flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {jiraButtonLoading ? (
                             <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <JiraIcon className="w-4 h-4" />
                        )}
                        <span>{jiraButtonLoading ? 'Creating...' : 'Jira'}</span>
                    </button>
                </div>
            </div>
            
            {jiraStatus && (jiraStatus.status === 'success' || jiraStatus.status === 'error') && (
              <div
                className={`p-3 rounded-md text-sm ${
                  jiraStatus.status === 'success'
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                }`}
              >
                <p dangerouslySetInnerHTML={{ __html: jiraStatus.message }} />
              </div>
            )}

            <ReportSection title="Summary"><p>{report.summary}</p></ReportSection>
            <ReportSection title="Steps to Reproduce">
                <ol className="list-decimal list-inside space-y-1">{report.stepsToReproduce.map((step, i) => <li key={i}>{step}</li>)}</ol>
            </ReportSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReportSection title="Expected Behavior"><p>{report.expectedBehavior}</p></ReportSection>
                <ReportSection title="Actual Behavior"><p>{report.actualBehavior}</p></ReportSection>
            </div>
            <ReportSection title="Impact"><p>{report.impact}</p></ReportSection>
            <ReportSection title="Environment">
                <ul className="list-disc list-inside">
                <li><strong>Browser:</strong> {report.environment.browser}</li>
                <li><strong>OS:</strong> {report.environment.os}</li>
                <li><strong>Device:</strong> {report.environment.device}</li>
                </ul>
            </ReportSection>
            {report.suggestedFix && <ReportSection title="Suggested Fix"><p>{report.suggestedFix}</p></ReportSection>}
        </article>
    )
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ reports, isLoading, bugCount, projectName, buildNumber, companyLogo, isJiraConfigured, onCreateJiraIssue, jiraSubmissionStatus }) => {

  if (isLoading) {
    return (
        <div>
            {Array.from({ length: bugCount }).map((_, i) => <LoadingSkeleton key={i} />)}
        </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-10">
        <p>Your generated report will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6 font-sans">
      {(projectName || buildNumber || companyLogo) && (
        <header className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
            <div>
                {projectName && <h1 className="text-3xl font-bold">{projectName}</h1>}
                {buildNumber && <p className="text-md text-gray-500 dark:text-gray-400">Build: {buildNumber}</p>}
            </div>
            {companyLogo && <img src={companyLogo.dataUrl} alt="Company Logo" className="max-h-12 w-auto"/>}
        </header>
      )}

      {reports.map((report, index) => (
        <SingleReport 
            key={report.originalId} 
            report={report} 
            index={index}
            isJiraConfigured={isJiraConfigured}
            onCreateJiraIssue={onCreateJiraIssue}
            jiraStatus={jiraSubmissionStatus[report.originalId]}
        />
      ))}
    </div>
  );
};

export default ReportDisplay;
