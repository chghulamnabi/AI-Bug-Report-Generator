
import React, { useState, useEffect } from 'react';
import type { GeneratedReport } from '../types';
import ClipboardIcon from './icons/ClipboardIcon';

interface ReportDisplayProps {
  report: GeneratedReport | null;
  isLoading: boolean;
}

const ReportSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">{title}</h3>
    <div className="text-gray-600 dark:text-gray-300 space-y-1">{children}</div>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
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
    <div className="space-y-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
    </div>
  </div>
);

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, isLoading }) => {
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

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!report) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-10">
        <p>Your generated report will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{report.suggestedTitle}</h2>
        <button
          onClick={handleCopy}
          className="absolute top-0 right-0 flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition"
        >
          <ClipboardIcon className="w-4 h-4" />
          {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <ReportSection title="Summary">
        <p>{report.summary}</p>
      </ReportSection>

      <ReportSection title="Steps to Reproduce">
        <ol className="list-decimal list-inside space-y-1">
          {report.stepsToReproduce.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </ReportSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportSection title="Expected Behavior">
          <p>{report.expectedBehavior}</p>
        </ReportSection>
        <ReportSection title="Actual Behavior">
          <p>{report.actualBehavior}</p>
        </ReportSection>
      </div>
      
      <ReportSection title="Impact">
        <p>{report.impact}</p>
      </ReportSection>

      <ReportSection title="Environment">
        <ul className="list-disc list-inside">
          <li><strong>Browser:</strong> {report.environment.browser}</li>
          <li><strong>OS:</strong> {report.environment.os}</li>
          <li><strong>Device:</strong> {report.environment.device}</li>
        </ul>
      </ReportSection>

      {report.suggestedFix && (
        <ReportSection title="Suggested Fix">
          <p>{report.suggestedFix}</p>
        </ReportSection>
      )}
    </div>
  );
};

export default ReportDisplay;
