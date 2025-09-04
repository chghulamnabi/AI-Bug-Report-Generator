
import React, { useState, useCallback } from 'react';
import type { BugReportInput, GeneratedReport, Screenshot } from './types';
import { generateBugReport } from './services/geminiService';
import BugForm from './components/BugForm';
import ReportDisplay from './components/ReportDisplay';
import BugIcon from './components/icons/BugIcon';
import SparklesIcon from './components/icons/SparklesIcon';

const App: React.FC = () => {
  const [bugInput, setBugInput] = useState<BugReportInput>({
    title: '',
    url: '',
    steps: '',
    expected: '',
    actual: '',
  });
  const [screenshot, setScreenshot] = useState<Screenshot | null>(null);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBugInput(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setError('File size exceeds 4MB. Please upload a smaller image.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot({
          base64: (reader.result as string).split(',')[1],
          mimeType: file.type,
          name: file.name
        });
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
      };
      reader.readAsDataURL(file);
    }
  }, []);
  
  const removeScreenshot = useCallback(() => {
    setScreenshot(null);
    // Also reset the file input visually
    const fileInput = document.getElementById('screenshot') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGeneratedReport(null);

    try {
      const report = await generateBugReport(bugInput, screenshot);
      setGeneratedReport(report);
    } catch (err) {
      console.error(err);
      setError('An error occurred while generating the report. Please check your inputs and try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
            Describe a bug, and our AI will generate a detailed, professional report ready for your development team.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <BugForm
            bugInput={bugInput}
            screenshot={screenshot}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onFileChange={handleFileChange}
            onRemoveScreenshot={removeScreenshot}
            onSubmit={handleSubmit}
          />

          <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <SparklesIcon className="w-6 h-6 text-primary-500"/>
              <h2 className="text-2xl font-semibold">Generated Report</h2>
            </div>
            {error && <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg" role="alert">{error}</div>}
            
            <ReportDisplay report={generatedReport} isLoading={isLoading} />
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
