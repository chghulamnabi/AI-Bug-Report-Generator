import React, { useState, useEffect } from 'react';
import type { GeneratedReport, Screenshot, Severity } from '../types';
import ClipboardIcon from './icons/ClipboardIcon';
import JiraIcon from './icons/JiraIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import AlertTriangleIcon from './icons/AlertTriangleIcon';

interface ReportDisplayProps {
  reports: GeneratedReport[];
  isLoading: boolean;
  bugCount: number;
  projectName: string;
  buildNumber: string;
  companyLogo: Screenshot | null;
  onJiraCreate: (report: GeneratedReport) => void;
  jiraIssueStatus: { [key: number]: { status: 'idle' | 'loading' | 'success' | 'error'; message?: string; issueUrl?: string } };
  isJiraConfigured: boolean;
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

const SeverityBadge: React.FC<{ severity: Severity }> = ({ severity }) => {
    const severityClasses: Record<Severity, string> = {
        Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        High: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
        Critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return (
        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${severityClasses[severity] || severityClasses.Medium}`}>
            {severity}
        </span>
    );
};

const JiraButton: React.FC<{
    report: GeneratedReport,
    onJiraCreate: (report: GeneratedReport) => void;
    jiraStatus?: { status: string; message?: string, issueUrl?: string };
    isJiraConfigured: boolean;
}> = ({ report, onJiraCreate, jiraStatus, isJiraConfigured }) => {

    const status = jiraStatus?.status || 'idle';

    const baseClasses = 'action-button flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition';

    if (status === 'success' && jiraStatus?.issueUrl) {
        return (
            <a href={jiraStatus.issueUrl} target="_blank" rel="noopener noreferrer" className={`${baseClasses} bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800`}>
                <CheckCircleIcon className="w-4 h-4" />
                {jiraStatus.message}
            </a>
        );
    }

    const isDisabled = !isJiraConfigured || status === 'loading';
    const title = !isJiraConfigured ? 'Please configure Jira settings first' : (status === 'error' ? jiraStatus?.message : 'Create Jira Issue');

    return (
        <button
            onClick={() => onJiraCreate(report)}
            disabled={isDisabled}
            title={title}
            className={`${baseClasses} 
                ${status === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            {status === 'loading' && <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            {status === 'idle' && <JiraIcon className="w-4 h-4" />}
            {status === 'error' && <AlertTriangleIcon className="w-4 h-4" />}
            
            <span>
                {status === 'loading' && 'Creating...'}
                {status === 'idle' && 'Create in Jira'}
                {status === 'error' && 'Retry'}
            </span>
        </button>
    );
}

const SingleReport: React.FC<{ 
    report: GeneratedReport, 
    index: number,
    onJiraCreate: (report: GeneratedReport) => void;
    jiraStatus?: { status: string; message?: string, issueUrl?: string };
    isJiraConfigured: boolean;
}> = ({ report, index, onJiraCreate, jiraStatus, isJiraConfigured }) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    useEffect(() => {
        if (copyStatus === 'copied') {
        const timer = setTimeout(() => setCopyStatus('idle'), 2000);
        return () => clearTimeout(timer);
        }
    }, [copyStatus]);

    const generateReportText = (reportData: GeneratedReport): string => {
        return `
**Bug Report: ${reportData.suggestedTitle}**

**Severity:** ${reportData.severity}

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
            navigator.clipboard.writeText(generateReportText(report));
            setCopyStatus('copied');
        }
    };
    
    return (
        <article className="space-y-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg not-last:mb-6">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 break-words">
                      <span className="text-primary-500 mr-2">#{index + 1}</span>{report.suggestedTitle}
                    </h2>
                    <SeverityBadge severity={report.severity} />
                </div>
                <div className="flex items-center gap-2">
                    <JiraButton report={report} onJiraCreate={onJiraCreate} jiraStatus={jiraStatus} isJiraConfigured={isJiraConfigured} />
                    <button
                        onClick={handleCopy}
                        className="action-button flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition"
                        >
                        <ClipboardIcon className="w-4 h-4" />
                        {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
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

const ReportDisplay: React.FC<ReportDisplayProps> = ({ reports, isLoading, bugCount, projectName, buildNumber, companyLogo, onJiraCreate, jiraIssueStatus, isJiraConfigured }) => {

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
            onJiraCreate={onJiraCreate}
            jiraStatus={jiraIssueStatus[report.originalId]}
            isJiraConfigured={isJiraConfigured}
        />
      ))}
    </div>
  );
};

export default ReportDisplay;