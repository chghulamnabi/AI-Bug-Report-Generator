
import React, { useState, useCallback, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Packer, Document, Paragraph, TextRun, HeadingLevel, ImageRun, AlignmentType } from 'docx';

import type { BugReportInput, GeneratedReport, Screenshot } from './types';
import { generateBugReport } from './services/geminiService';
import BugForm from './components/BugForm';
import ReportDisplay from './components/ReportDisplay';
import BugIcon from './components/icons/BugIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import DownloadIcon from './components/icons/DownloadIcon';
import PlusCircleIcon from './components/icons/PlusCircleIcon';
import UploadIcon from './components/icons/UploadIcon';
import TrashIcon from './components/icons/TrashIcon';
import FileTextIcon from './components/icons/FileTextIcon';


const App: React.FC = () => {
  const [projectName, setProjectName] = useState('');
  const [buildNumber, setBuildNumber] = useState('');
  const [companyLogo, setCompanyLogo] = useState<Screenshot | null>(null);

  const [bugInputs, setBugInputs] = useState<BugReportInput[]>([{
    id: Date.now(),
    title: '',
    url: '',
    steps: '',
    expected: '',
    actual: '',
    severity: 'Medium',
  }]);
  const [screenshots, setScreenshots] = useState<{ [key: number]: Screenshot | null }>({});
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [jiraConfig, setJiraConfig] = useState({
    url: '',
    email: '',
    apiToken: '',
    projectKey: ''
  });
  const [jiraIssueStatus, setJiraIssueStatus] = useState<{ [key: number]: { status: 'idle' | 'loading' | 'success' | 'error'; message?: string; issueUrl?: string } }>({});


  const reportContainerRef = useRef<HTMLDivDivElement>(null);

  const handleFileChange = useCallback((id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setError('File size exceeds 4MB. Please upload a smaller image.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setScreenshots(prev => ({
          ...prev,
          [id]: {
            base64: dataUrl.split(',')[1],
            mimeType: file.type,
            name: file.name,
            dataUrl: dataUrl
          }
        }));
      };
      reader.onerror = () => setError("Failed to read the file.");
      reader.readAsDataURL(file);
    }
  }, []);

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) { // 1MB limit for logo
        setError('Logo size exceeds 1MB. Please upload a smaller image.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setCompanyLogo({
          base64: dataUrl.split(',')[1],
          mimeType: file.type,
          name: file.name,
          dataUrl: dataUrl
        });
      };
      reader.onerror = () => setError("Failed to read the logo file.");
      reader.readAsDataURL(file);
    }
  }, []);

  const handleInputChange = useCallback((id: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBugInputs(prev => prev.map(bug => bug.id === id ? { ...bug, [name]: value } : bug));
  }, []);

  const handleJiraConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setJiraConfig(prev => ({ ...prev, [name]: value }));
  };
  
  const addBugForm = () => {
    setBugInputs(prev => [...prev, {
      id: Date.now(),
      title: '',
      url: '',
      steps: '',
      expected: '',
      actual: '',
      severity: 'Medium',
    }]);
  };
  
  const removeBugForm = (id: number) => {
    setBugInputs(prev => prev.filter(bug => bug.id !== id));
    setScreenshots(prev => {
        const newState = {...prev};
        delete newState[id];
        return newState;
    });
  };

  const removeScreenshot = useCallback((id: number) => {
    setScreenshots(prev => {
        const newState = {...prev};
        delete newState[id];
        return newState;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGeneratedReports([]);
    setJiraIssueStatus({});

    try {
      const reportPromises = bugInputs.map(bug => {
        const { id, ...bugData } = bug;
        const screenshot = screenshots[id];
        return generateBugReport(bugData, screenshot).then(report => ({ ...report, originalId: id }));
      });
      const reports = await Promise.all(reportPromises);
      setGeneratedReports(reports);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the report.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJiraCreate = async (report: GeneratedReport) => {
    const { url, email, apiToken, projectKey } = jiraConfig;
    if (!url || !email || !apiToken || !projectKey) {
        setJiraIssueStatus(prev => ({ ...prev, [report.originalId]: { status: 'error', message: 'Jira config is missing.' } }));
        return;
    }

    setJiraIssueStatus(prev => ({ ...prev, [report.originalId]: { status: 'loading' } }));
    
    // In a real application, this should be a call to a secure backend proxy
    // to avoid exposing API tokens and handling CORS.
    // For this prototype, we'll simulate the behavior and show an informative error.
    setTimeout(() => {
        setError("Creating Jira issues directly from the browser is insecure and often blocked by CORS. This action must be handled by a backend proxy service. This is a simulated failure.");
        setJiraIssueStatus(prev => ({ ...prev, [report.originalId]: { status: 'error', message: 'Backend proxy required' } }));
    }, 1000);
  };
  
  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  };

  const handleDownloadPdf = async () => {
    const container = reportContainerRef.current;
    if (!container) return;

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: window.getComputedStyle(document.body).backgroundColor === 'rgb(17, 24, 39)' ? '#111827' : '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('bug-reports.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };
  
  const handleDownloadDocx = async () => {
    if (generatedReports.length === 0) return;

    const sections: any[] = [];
    
    if (companyLogo) {
      try {
        const logoBuffer = base64ToUint8Array(companyLogo.base64);
        sections.push(new Paragraph({
          // FIX: Changed 'data' to 'buffer' for ImageRun to match the expected property for the docx library version.
          children: [ new ImageRun({ buffer: logoBuffer, transformation: { width: 100, height: 100 } }) ],
          alignment: AlignmentType.RIGHT,
        }));
      } catch (e) { console.error("Error processing company logo for DOCX:", e); }
    }

    if (projectName) sections.push(new Paragraph({ children: [new TextRun({ text: projectName, bold: true, size: 32 })], heading: HeadingLevel.HEADING_1 }));
    if (buildNumber) sections.push(new Paragraph({ children: [new TextRun({ text: `Build: ${buildNumber}`, size: 24, italics: true })], heading: HeadingLevel.HEADING_2 }));

    generatedReports.forEach((report, index) => {
      sections.push(
        new Paragraph({ text: `#${index + 1}: ${report.suggestedTitle}`, heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
        new Paragraph({ children: [new TextRun({ text: 'Severity: ', bold: true }), new TextRun(report.severity)] }),
        new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
        new Paragraph(report.summary),
        new Paragraph({ text: 'Steps to Reproduce', heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
        ...report.stepsToReproduce.map(step => new Paragraph({ text: step, bullet: { level: 0 } })),
        new Paragraph({ text: 'Expected Behavior', heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
        new Paragraph(report.expectedBehavior),
        new Paragraph({ text: 'Actual Behavior', heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
        new Paragraph(report.actualBehavior),
        new Paragraph({ text: 'Impact', heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
        new Paragraph(report.impact),
        new Paragraph({ text: 'Environment', heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
        new Paragraph({ text: `Browser: ${report.environment.browser}`, bullet: { level: 0 } }),
        new Paragraph({ text: `OS: ${report.environment.os}`, bullet: { level: 0 } }),
        new Paragraph({ text: `Device: ${report.environment.device}`, bullet: { level: 0 } })
      );
      if (report.suggestedFix) {
        sections.push(
          new Paragraph({ text: 'Suggested Fix', heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
          new Paragraph(report.suggestedFix)
        );
      }
      const screenshot = screenshots[report.originalId];
      if (screenshot) {
        try {
          const imageBuffer = base64ToUint8Array(screenshot.base64);
          sections.push(
            new Paragraph({ text: 'Screenshot', heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
            // FIX: Changed 'data' to 'buffer' for ImageRun to match the expected property for the docx library version.
            new Paragraph({ children: [ new ImageRun({ buffer: imageBuffer, transformation: { width: 400, height: 300 } }) ] })
          );
        } catch(e) { console.error("Error processing screenshot for DOCX:", e); }
      }
    });

    const doc = new Document({ sections: [{ children: sections }] });

    try {
      const blob = await Packer.toBlob(doc);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'bug-reports.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating DOCX:', error);
      setError('Failed to generate DOCX file.');
    }
  };


  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans text-gray-900 dark:text-gray-100">
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800 dark:text-white flex items-center justify-center gap-3">
          <BugIcon className="w-10 h-10 text-primary-500" />
          <span>AI Bug Report Generator</span>
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Describe a bug, add a screenshot, and let AI create a detailed, developer-ready report for you.
        </p>
      </header>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* --- LEFT COLUMN --- */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Project Details</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                    <input type="text" id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g., 'Project Phoenix'" className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 transition"/>
                  </div>
                  <div>
                    <label htmlFor="buildNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Build Number</label>
                    <input type="text" id="buildNumber" value={buildNumber} onChange={(e) => setBuildNumber(e.target.value)} placeholder="e.g., 'v2.1.3'" className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 transition"/>
                  </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Logo (Optional)</label>
                    {companyLogo ? (
                         <div className="flex items-center justify-between p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                            <span className="text-sm truncate text-gray-600 dark:text-gray-300">{companyLogo.name}</span>
                            <button type="button" onClick={() => setCompanyLogo(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-xs font-semibold ml-4">REMOVE</button>
                        </div>
                    ) : (
                    <label htmlFor="company-logo-upload" className="relative cursor-pointer w-full flex items-center justify-center px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                        <UploadIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2"/>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Upload Logo</span>
                        <input id="company-logo-upload" type="file" className="sr-only" onChange={handleLogoChange} accept="image/png, image/jpeg" />
                    </label>
                    )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Jira Integration (Optional)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input name="url" value={jiraConfig.url} onChange={handleJiraConfigChange} placeholder="Jira URL (e.g., your-company.atlassian.net)" className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"/>
                      <input name="email" value={jiraConfig.email} onChange={handleJiraConfigChange} placeholder="Jira Email" className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"/>
                      <input name="apiToken" type="password" value={jiraConfig.apiToken} onChange={handleJiraConfigChange} placeholder="API Token" className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"/>
                      <input name="projectKey" value={jiraConfig.projectKey} onChange={handleJiraConfigChange} placeholder="Project Key (e.g., PROJ)" className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"/>
                  </div>
              </div>
              
              {bugInputs.map((bug, index) => (
                <BugForm
                  key={bug.id}
                  bugInput={bug}
                  screenshot={screenshots[bug.id]}
                  isLoading={isLoading}
                  onInputChange={(e) => handleInputChange(bug.id, e)}
                  onFileChange={(e) => handleFileChange(bug.id, e)}
                  onRemoveScreenshot={() => removeScreenshot(bug.id)}
                  onRemoveBug={() => removeBugForm(bug.id)}
                  index={index}
                  isRemovable={bugInputs.length > 1}
                />
              ))}
              
              <div className="flex justify-between items-center gap-4">
                 <button type="button" onClick={addBugForm} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/50 rounded-md transition disabled:opacity-50">
                   <PlusCircleIcon className="w-5 h-5"/> Add Another Bug
                 </button>
                 <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-primary-600 rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-primary-500 transition disabled:bg-primary-400 disabled:cursor-not-allowed">
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : <SparklesIcon className="w-5 h-5" />}
                  <span>{isLoading ? 'Generating...' : 'Generate Report'}</span>
                </button>
              </div>
            </div>

            {/* --- RIGHT COLUMN --- */}
            <div className="lg:sticky top-8">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Generated Report</h2>
                 {generatedReports.length > 0 && (
                  <div className="flex items-center gap-2">
                      <button type="button" onClick={handleDownloadPdf} title="Download as PDF" className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition">
                          <DownloadIcon className="w-4 h-4" /> PDF
                      </button>
                      <button type="button" onClick={handleDownloadDocx} title="Download as DOCX" className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition">
                          <FileTextIcon className="w-4 h-4" /> DOCX
                      </button>
                  </div>
                 )}
              </div>
              <div ref={reportContainerRef} className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <ReportDisplay
                  reports={generatedReports}
                  isLoading={isLoading}
                  bugCount={bugInputs.length}
                  projectName={projectName}
                  buildNumber={buildNumber}
                  companyLogo={companyLogo}
                  onJiraCreate={handleJiraCreate}
                  jiraIssueStatus={jiraIssueStatus}
                  isJiraConfigured={!!(jiraConfig.url && jiraConfig.email && jiraConfig.apiToken && jiraConfig.projectKey)}
                />
              </div>
            </div>
        </div>
      </form>
    </main>
  );
};

export default App;
