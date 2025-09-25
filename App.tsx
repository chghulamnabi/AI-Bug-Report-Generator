
import React, { useState, useCallback, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    os: '',
    browser: '',
    device: '',
  }]);
  const [screenshots, setScreenshots] = useState<{ [key: number]: Screenshot | null }>({});
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reportContainerRef = useRef<HTMLDivElement>(null);

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

  const handleInputChange = useCallback((id: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBugInputs(prev => prev.map(bug => bug.id === id ? { ...bug, [name]: value } : bug));
  }, []);
  
  const addBugForm = () => {
    setBugInputs(prev => [...prev, {
      id: Date.now(),
      title: '',
      url: '',
      steps: '',
      expected: '',
      actual: '',
      os: '',
      browser: '',
      device: '',
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

  const handleClearAll = () => {
    setProjectName('');
    setBuildNumber('');
    setCompanyLogo(null);
    setBugInputs([{
      id: Date.now(),
      title: '',
      url: '',
      steps: '',
      expected: '',
      actual: '',
      os: '',
      browser: '',
      device: '',
    }]);
    setScreenshots({});
    setGeneratedReports([]);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGeneratedReports([]);

    try {
      const reportPromises = bugInputs.map(bug => {
        const { id, ...bugData } = bug;
        const screenshot = screenshots[id] || null;
        return generateBugReport(bugData, screenshot).then(report => ({ ...report, originalId: id }));
      });
      const reports = await Promise.all(reportPromises);
      setGeneratedReports(reports);
    } catch (err) {
      console.error(err);
      setError('An error occurred while generating the report. Please check your inputs and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadPdf = async () => {
    const reportElement = reportContainerRef.current;
    if (!reportElement) return;
    
    // Hide buttons that shouldn't be in the PDF
    const buttons = reportElement.querySelectorAll('.hide-on-pdf');
    buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');

    // Briefly switch to light mode for PDF generation for better print compatibility
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    }

    const canvas = await html2canvas(reportElement, {
      scale: 2,
      windowWidth: reportElement.scrollWidth,
      windowHeight: reportElement.scrollHeight,
      backgroundColor: '#ffffff'
    });
    
    // Restore theme and buttons
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
    buttons.forEach(btn => (btn as HTMLElement).style.display = '');

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${projectName.replace(/\s/g, '_') || 'Bug'}_Report.pdf`);
  };

  const isFormValid = bugInputs.every(bug => bug.title && bug.steps && bug.expected && bug.actual);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-4">
            <BugIcon className="w-12 h-12 text-primary-500" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-indigo-400 text-transparent bg-clip-text">
              AI Bug Report Generator
            </h1>
          </div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Describe bug(s), and our AI will generate a detailed, professional report ready for your development team.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Project Details</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                    <input type="text" id="projectName" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g., 'Phoenix Project'" className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 transition" />
                 </div>
                 <div>
                    <label htmlFor="buildNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Build Number</label>
                    <input type="text" id="buildNumber" value={buildNumber} onChange={e => setBuildNumber(e.target.value)} placeholder="e.g., 'v2.1.4'" className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 transition" />
                 </div>
               </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Logo (Optional)</label>
                {companyLogo ? (
                  <div className="flex items-center justify-between p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                    <img src={companyLogo.dataUrl} alt="Company Logo" className="h-8 w-auto mr-4" />
                    <span className="text-sm truncate text-gray-600 dark:text-gray-300">{companyLogo.name}</span>
                    <button type="button" onClick={() => setCompanyLogo(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-xs font-semibold ml-4">REMOVE</button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-4 px-3 py-2 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                    <UploadIcon className="h-8 w-8 text-gray-400"/>
                    <label htmlFor="companyLogo" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 dark:ring-offset-gray-800 focus-within:ring-primary-500">
                      <span>Upload logo</span>
                      <input id="companyLogo" name="companyLogo" type="file" className="sr-only" onChange={handleLogoChange} accept="image/png, image/jpeg, image/svg+xml" />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Max 1MB</p>
                  </div>
                )}
               </div>
            </div>

            {bugInputs.map((bug, index) => (
                <BugForm
                    key={bug.id}
                    bugInput={bug}
                    screenshot={screenshots[bug.id] || null}
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
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={addBugForm}
                        className="flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-800 focus:ring-primary-500 transition-colors"
                    >
                        <PlusCircleIcon className="w-5 h-5"/>
                        Add Another Bug
                    </button>
                    <button
                        type="button"
                        onClick={handleClearAll}
                        className="flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-800 focus:ring-red-500 transition-colors"
                    >
                        <TrashIcon className="w-5 h-5"/>
                        Clear All
                    </button>
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !isFormValid}
                    className="flex justify-center items-center gap-2 py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-800 focus:ring-primary-500 disabled:bg-primary-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                {isLoading ? (
                    <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                    </>
                ) : `Generate Report (${bugInputs.length})`}
                </button>
            </div>
          </form>

          <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <SparklesIcon className="w-6 h-6 text-primary-500"/>
                <h2 className="text-2xl font-semibold">Generated Report</h2>
              </div>
              {generatedReports.length > 0 && (
                <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-primary-500 hover:bg-primary-600 text-white transition">
                  <DownloadIcon className="w-4 h-4" />
                  Download PDF
                </button>
              )}
            </div>
            {error && <div className="mb-4 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg" role="alert">{error}</div>}
            
            <div ref={reportContainerRef}>
              <ReportDisplay 
                reports={generatedReports} 
                isLoading={isLoading} 
                bugCount={bugInputs.length}
                projectName={projectName}
                buildNumber={buildNumber}
                companyLogo={companyLogo}
              />
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
        <p>Powered by Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
