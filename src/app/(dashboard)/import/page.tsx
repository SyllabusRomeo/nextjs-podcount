'use client';

import { FileImport } from "@/components/FileImport";

export default function ImportPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Import Data</h1>
        <p className="text-gray-600">
          Upload a CSV or Excel file to import data. The file should contain headers in the first row.
        </p>
      </div>
      <FileImport />
    </div>
  );
} 