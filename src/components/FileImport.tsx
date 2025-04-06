'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface FormField {
  name: string;
  type: string;
  required: boolean;
}

interface FormData {
  name: string;
  description?: string;
  type: string;
  fields: FormField[];
  factoryId: string;
}

interface FormResponse {
  formId: string;
  data: Record<string, any>;
}

export function FileImport() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const router = useRouter();

  const inferFieldType = (value: any): string => {
    if (!value || value === '') return 'text';
    if (!isNaN(Date.parse(value))) return 'date';
    if (!isNaN(value) && value.toString().trim() !== '') return 'number';
    return 'text';
  };

  const createFieldFromHeader = (header: string, sampleValue: any): FormField => {
    return {
      name: header,
      type: inferFieldType(sampleValue),
      required: true
    };
  };

  const createFormFromHeaders = (headers: string[], data: any[]): FormData => {
    const fields = headers.map(header => {
      const sampleValue = data[0]?.[header];
      return createFieldFromHeader(header, sampleValue);
    });

    return {
      name: formName || 'Imported Form',
      description: formDescription || 'Form created from imported file',
      type: 'IMPORTED',
      fields, // This will be stringified by the API
      factoryId: session?.user?.factoryId || '' // Access factoryId directly from session.user
    };
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExt || '')) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload a CSV or Excel file.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      let headers: string[] = [];
      let data: any[] = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const result = Papa.parse(text, { header: true });
        headers = result.meta.fields || [];
        data = result.data.filter(row => 
          Object.keys(row as Record<string, unknown>).length > 0 && 
          !Object.values(row as Record<string, unknown>).every(v => v === '')
        );
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        if (jsonData.length > 0) {
          headers = Object.keys(jsonData[0] as Record<string, unknown>);
          data = jsonData;
        }
      }

      if (headers.length === 0) {
        throw new Error('No headers found in file');
      }

      if (data.length === 0) {
        throw new Error('No data rows found in file');
      }

      // Update state for preview
      setHeaders(headers);
      setData(data);
      setFormName(file.name.split('.')[0].replace(/[-_]/g, ' '));
      setFormDescription(`Form imported from ${file.name} with ${data.length} entries`);
      setImportStep('preview');
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Error processing file',
        description: error instanceof Error ? error.message : 'Failed to process file',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearFileSelection = () => {
    setHeaders([]);
    setData([]);
    setFormName('');
    setFormDescription('');
    setImportStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveForm = async () => {
    setIsSaving(true);
    try {
      // Check if user has a factory assigned
      if (!session?.user?.factoryId) {
        throw new Error('No factory assigned to user. Please contact your administrator.');
      }

      // Create form
      const formData = createFormFromHeaders(headers, data);
      
      // Try to create the form, handle unique constraint error
      let form;
      try {
        const formResponse = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!formResponse.ok) {
          const errorData = await formResponse.json().catch(() => ({}));
          // Check if it's a unique constraint error
          if (errorData.code === 'P2002') {
            // Add timestamp to make form name unique and try again
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const uniqueFormData = {
              ...formData,
              name: `${formData.name} (${timestamp})`
            };
            
            const retryResponse = await fetch('/api/forms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(uniqueFormData)
            });
            
            if (!retryResponse.ok) {
              throw new Error('Failed to create form with unique name');
            }
            
            form = await retryResponse.json();
          } else {
            throw new Error(errorData.message || 'Failed to create form');
          }
        } else {
          form = await formResponse.json();
        }
      } catch (error) {
        console.error('Error creating form:', error);
        throw error;
      }

      // Create responses in bulk
      const responses = data.map(row => ({
        formId: form.id,
        data: row
      }));

      const responsesResponse = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses })
      });

      if (!responsesResponse.ok) {
        throw new Error('Failed to create responses');
      }

      toast({
        title: 'Success',
        description: `Form created with ${data.length} responses`,
      });

      setImportStep('success');
      setTimeout(() => {
        router.push(`/forms/${form.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save form and responses',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import Form from File</CardTitle>
        <CardDescription>
          Upload a CSV or Excel file to create a new form. The column headers will become form fields, and each row will be saved as a response.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {importStep === 'upload' && (
          <div 
            className={`border-2 border-dashed rounded-lg p-8 ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'} transition-colors`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="p-4 rounded-full bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium">Drag & drop your file here</h3>
                <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
                id="file-upload"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isProcessing}
                variant="outline"
                className="mt-2"
              >
                Select File
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: CSV, Excel (.xlsx, .xls)
              </p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm font-medium">Processing your file...</p>
          </div>
        )}

        {importStep === 'preview' && data.length > 0 && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Name
                </label>
                <Input 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  className="max-w-sm" 
                  placeholder="Enter form name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input 
                  value={formDescription} 
                  onChange={(e) => setFormDescription(e.target.value)} 
                  className="max-w-sm" 
                  placeholder="Enter description"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Data Preview</h3>
              <p className="text-sm text-gray-500 mb-4">
                Below is a preview of the data that will be imported. {data.length} rows found.
                Each column header will become a form field.
              </p>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map((header) => (
                          <TableHead key={header} className="bg-muted">{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.slice(0, 5).map((row, index) => (
                        <TableRow key={index}>
                          {headers.map((header) => (
                            <TableCell key={`${index}-${header}`}>
                              {String(row[header] || '')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {data.length > 5 && (
                  <div className="py-2 px-4 border-t bg-muted text-center text-sm text-gray-500">
                    Showing first 5 of {data.length} rows
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {importStep === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="p-4 rounded-full bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Import successful!</h3>
            <p className="text-sm text-gray-500 text-center">
              Your form has been created with {data.length} responses.
              <br />Redirecting to view the form...
            </p>
          </div>
        )}
      </CardContent>

      {importStep === 'preview' && (
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={clearFileSelection}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={saveForm}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Saving...
              </>
            ) : (
              'Create Form & Save Responses'
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 