"use client";

import React, { useState } from 'react';

const ImportTradesPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFeedbackMessage(`Selected file: ${file.name}`);
    } else {
      setSelectedFile(null);
      setFeedbackMessage('');
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      // Placeholder for actual upload logic
      console.log('Attempting to upload:', selectedFile.name);
      setFeedbackMessage(`(Placeholder) Uploading ${selectedFile.name}...`);
      // In a real scenario, you'd call an API here.
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Import Trades from CSV</h1>
      
      <div className="mb-4">
        <label htmlFor="csvFileInput" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Choose CSV File:
        </label>
        <input 
          type="file" 
          id="csvFileInput"
          accept=".csv" 
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
        />
      </div>

      {feedbackMessage && (
        <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">{feedbackMessage}</p>
      )}

      <button 
        onClick={handleUpload} 
        disabled={!selectedFile}
        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Upload CSV
      </button>
    </div>
  );
};

export default ImportTradesPage;
