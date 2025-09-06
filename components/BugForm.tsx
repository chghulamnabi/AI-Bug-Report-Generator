import React from 'react';
import type { BugReportInput, Screenshot, Severity } from '../types';
import UploadIcon from './icons/UploadIcon';
import TrashIcon from './icons/TrashIcon';

interface BugFormProps {
  bugInput: BugReportInput;
  screenshot: Screenshot | null;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveScreenshot: () => void;
  onRemoveBug: () => void;
  index: number;
  isRemovable: boolean;
}

const severityLevels: Severity[] = ['Low', 'Medium', 'High', 'Critical'];

const InputField: React.FC<{ name: keyof Omit<BugReportInput, 'id' | 'severity'>, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string, type?: string, required?: boolean }> = ({ name, label, value, onChange, placeholder, type = "text", required = true }) => (
  <div>
    <label htmlFor={`${name}-${label}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <input
      type={type}
      id={`${name}-${label}`}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 transition"
    />
  </div>
);

const TextareaField: React.FC<{ name: keyof Omit<BugReportInput, 'id' | 'severity'>, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder: string, rows?: number }> = ({ name, label, value, onChange, placeholder, rows = 4 }) => (
  <div>
    <label htmlFor={`${name}-${label}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <textarea
      id={`${name}-${label}`}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
      rows={rows}
      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 transition"
    />
  </div>
);

const BugForm: React.FC<BugFormProps> = ({ bugInput, screenshot, onInputChange, onFileChange, onRemoveScreenshot, onRemoveBug, index, isRemovable }) => {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Bug #{index + 1}</h2>
        {isRemovable && (
          <button type="button" onClick={onRemoveBug} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition">
            <TrashIcon className="w-5 h-5"/>
          </button>
        )}
      </div>
      
      <InputField
        name="title"
        label="Bug Title"
        value={bugInput.title}
        onChange={onInputChange}
        placeholder="e.g., 'Save button is not working on profile page'"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          name="url"
          label="URL / Location"
          value={bugInput.url}
          onChange={onInputChange}
          placeholder="e.g., 'https://example.com/profile'"
        />
        <div>
          <label htmlFor={`severity-${bugInput.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
          <select
              id={`severity-${bugInput.id}`}
              name="severity"
              value={bugInput.severity}
              onChange={onInputChange}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 transition"
          >
              {severityLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
              ))}
          </select>
        </div>
      </div>
      <TextareaField
        name="steps"
        label="Steps to Reproduce"
        value={bugInput.steps}
        onChange={onInputChange}
        placeholder="1. Go to the profile page&#x0a;2. Click on the 'Edit' button&#x0a;3. Change the name and click 'Save'"
      />
      <TextareaField
        name="expected"
        label="Expected Result"
        value={bugInput.expected}
        onChange={onInputChange}
        placeholder="The profile name should be updated and a success message should appear."
        rows={2}
      />
      <TextareaField
        name="actual"
        label="Actual Result"
        value={bugInput.actual}
        onChange={onInputChange}
        placeholder="The page reloads, but the name is not updated."
        rows={2}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Screenshot (Optional)</label>
        {screenshot ? (
          <div className="flex items-center justify-between p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
            <span className="text-sm truncate text-gray-600 dark:text-gray-300">{screenshot.name}</span>
            <button type="button" onClick={onRemoveScreenshot} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-xs font-semibold ml-4">REMOVE</button>
          </div>
        ) : (
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400"/>
              <div className="flex text-sm text-gray-600 dark:text-gray-400">
                <label htmlFor={`screenshot-${bugInput.id}`} className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 dark:ring-offset-gray-800 focus-within:ring-primary-500">
                  <span>Upload a file</span>
                  <input id={`screenshot-${bugInput.id}`} name="screenshot" type="file" className="sr-only" onChange={onFileChange} accept="image/png, image/jpeg, image/gif, image/webp" />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF, WEBP up to 4MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BugForm;