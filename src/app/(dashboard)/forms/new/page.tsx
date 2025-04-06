"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type CustomField = {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
};

export default function CreateFormPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formType, setFormType] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isAddingField, setIsAddingField] = useState(false);
  const [factories, setFactories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newField, setNewField] = useState<CustomField>({
    id: "",
    name: "",
    label: "",
    type: "text",
    required: false,
    options: [],
  });
  const [optionInput, setOptionInput] = useState("");

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
    }
  }, [error]);

  // Fetch factories
  useEffect(() => {
    const fetchFactories = async () => {
      try {
        const response = await fetch('/api/factories');
        if (!response.ok) {
          throw new Error('Failed to fetch factories');
        }
        const data = await response.json();
        setFactories(data);
      } catch (error) {
        console.error('Error fetching factories:', error);
        setError("Failed to load factories. Please try again later.");
      }
    };

    if (session?.user) {
      fetchFactories();
    }
  }, [session]);

  const handleAddOption = () => {
    if (optionInput.trim() !== "" && newField.options) {
      setNewField({
        ...newField,
        options: [...newField.options, optionInput.trim()],
      });
      setOptionInput("");
    }
  };

  const handleRemoveOption = (option: string) => {
    if (newField.options) {
      setNewField({
        ...newField,
        options: newField.options.filter((opt) => opt !== option),
      });
    }
  };

  const handleAddField = () => {
    if (newField.name && newField.label) {
      const fieldId = `custom-${Date.now()}`;
      setCustomFields([
        ...customFields,
        { ...newField, id: fieldId, name: newField.name.toLowerCase().replace(/\s+/g, "_") },
      ]);
      setNewField({
        id: "",
        name: "",
        label: "",
        type: "text",
        required: false,
        options: [],
      });
      setIsAddingField(false);
    }
  };

  const handleRemoveField = (id: string) => {
    setCustomFields(customFields.filter((field) => field.id !== id));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const formName = formData.get("formName") as string;
      const formDescription = formData.get("formDescription") as string;
      const factoryId = formData.get("factory") as string;
      
      if (!formName || !factoryId || !formType) {
        throw new Error("Please fill in all required fields");
      }
      
      // Build field structure based on checked boxes and custom fields
      const form = e.target as HTMLFormElement;
      const standardFields: any[] = [];
      
      // Farmer Information Fields
      if (form.farmerId?.checked) {
        standardFields.push({ name: "farmer_id", label: "Farmer ID", type: "text", required: true });
      }
      if (form.farmerName?.checked) {
        standardFields.push({ name: "farmer_name", label: "Farmer Name", type: "text", required: true });
      }
      if (form.nationalId?.checked) {
        standardFields.push({ name: "national_id", label: "National ID Number", type: "text", required: false });
      }
      if (form.phoneNumber?.checked) {
        standardFields.push({ name: "phone_number", label: "Phone Number", type: "tel", required: false });
      }
      if (form.operationalArea?.checked) {
        standardFields.push({ name: "operational_area", label: "Operational Area", type: "text", required: true });
      }
      if (form.community?.checked) {
        standardFields.push({ name: "community", label: "Community", type: "text", required: true });
      }
      if (form.location?.checked) {
        standardFields.push({ name: "location", label: "Location", type: "location", required: false });
      }
      
      // Cocoa Pod Counting Fields
      if (form.smallCherelles?.checked) {
        standardFields.push({ name: "small_cherelles", label: "Small Cherelles (S)", type: "number", required: true, min: 0 });
      }
      if (form.medium?.checked) {
        standardFields.push({ name: "medium", label: "Medium (M)", type: "number", required: true, min: 0 });
      }
      if (form.large?.checked) {
        standardFields.push({ name: "large", label: "Large (L)", type: "number", required: true, min: 0 });
      }
      if (form.maturedUnripe?.checked) {
        standardFields.push({ name: "matured_unriped", label: "Matured Unriped (MUR)", type: "number", required: true, min: 0 });
      }
      if (form.maturedRipe?.checked) {
        standardFields.push({ name: "matured_riped", label: "Matured Riped (MR)", type: "number", required: true, min: 0 });
      }
      if (form.diseased?.checked) {
        standardFields.push({ name: "diseased", label: "Diseased (D)", type: "number", required: true, min: 0 });
      }
      if (form.countDate?.checked) {
        standardFields.push({ name: "count_date", label: "Count Date", type: "date", required: true });
      }
      if (form.notes?.checked) {
        standardFields.push({ name: "notes", label: "Additional Notes", type: "text", required: false });
      }
      
      // Add custom fields
      const allFields = [
        ...standardFields,
        ...customFields.map(field => ({
          name: field.name,
          label: field.label,
          type: field.type,
          required: field.required,
          options: field.options
        }))
      ];
      
      // Create fields object with sections
      const formFields = {
        sections: [
          {
            title: "Form Fields",
            fields: allFields
          }
        ]
      };
      
      // Send to API
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          type: formType,
          factoryId: factoryId,
          fields: formFields
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create form');
      }
      
      const result = await response.json();
      
      // Redirect to the form view page
      router.push(`/forms/${result.id}`);
    } catch (error) {
      console.error('Error creating form:', error);
      setError(error instanceof Error ? error.message : 'Failed to create form');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create New Form</h1>
        <p className="text-gray-600 mt-1">
          Choose a form type to get started with creating a new form.
        </p>
      </div>

      {!formType ? (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-medium text-gray-900 mb-6">
            Select Form Type
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              className="border-2 border-green-200 rounded-lg p-6 hover:border-green-500 cursor-pointer transition-colors"
              onClick={() => setFormType("ORGANIC")}
            >
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Organic</h3>
              <p className="mt-2 text-sm text-gray-500">
                Create a form for collecting data about organic cocoa production.
              </p>
            </div>
            
            <div 
              className="border-2 border-blue-200 rounded-lg p-6 hover:border-blue-500 cursor-pointer transition-colors"
              onClick={() => setFormType("CONVENTIONAL")}
            >
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Conventional</h3>
              <p className="mt-2 text-sm text-gray-500">
                Create a form for collecting data about conventional cocoa production.
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Or Import from File</h3>
            <Link 
              href="/forms/import"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Import from CSV/XLS
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-gray-900">
              Create {formType.toLowerCase()} Form
            </h2>
            <button
              onClick={() => setFormType(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Selection
            </button>
          </div>
          
          <form className="space-y-6" onSubmit={handleFormSubmit}>
            <div>
              <label htmlFor="formName" className="block text-sm font-medium text-gray-700">
                Form Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="formName"
                name="formName"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50"
                placeholder={`${formType.toLowerCase()} Cocoa Pod Counting Form`}
                required
              />
            </div>
            
            <div>
              <label htmlFor="formDescription" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="formDescription"
                name="formDescription"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50"
                placeholder="Describe the purpose of this form"
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="factory" className="block text-sm font-medium text-gray-700">
                Factory Location <span className="text-red-500">*</span>
              </label>
              <select
                id="factory"
                name="factory"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50"
                required
              >
                <option value="">Select factory location</option>
                {factories.map((factory) => (
                  <option key={factory.id} value={factory.id}>
                    {factory.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Form Fields</h3>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h4 className="text-md font-medium text-gray-700 mb-3">Farmer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="farmerId"
                      name="farmerId"
                      checked
                      disabled
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="farmerId" className="ml-2 block text-sm text-gray-700">
                      Farmer ID <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="farmerName"
                      name="farmerName"
                      checked
                      disabled
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="farmerName" className="ml-2 block text-sm text-gray-700">
                      Farmer Name <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="nationalId"
                      name="nationalId"
                      defaultChecked
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="nationalId" className="ml-2 block text-sm text-gray-700">
                      National ID Number
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="phoneNumber"
                      name="phoneNumber"
                      defaultChecked
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="phoneNumber" className="ml-2 block text-sm text-gray-700">
                      Phone Number
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="operationalArea"
                      name="operationalArea"
                      defaultChecked
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="operationalArea" className="ml-2 block text-sm text-gray-700">
                      Operational Area
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="community"
                      name="community"
                      defaultChecked
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="community" className="ml-2 block text-sm text-gray-700">
                      Community <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="location"
                      name="location"
                      defaultChecked
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="location" className="ml-2 block text-sm text-gray-700">
                      Location (GPS)
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h4 className="text-md font-medium text-gray-700 mb-3">Cocoa Pod Counting</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="smallCherelles"
                      name="smallCherelles"
                      defaultChecked
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="smallCherelles" className="ml-2 block text-sm text-gray-700">
                      Small Cherelles (S) <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="medium"
                      name="medium"
                      defaultChecked
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="medium" className="ml-2 block text-sm text-gray-700">
                      Medium (M) <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="large"
                      name="large"
                      defaultChecked
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="large" className="ml-2 block text-sm text-gray-700">
                      Large (L) <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="maturedUnripe"
                      name="maturedUnripe"
                      defaultChecked
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="maturedUnripe" className="ml-2 block text-sm text-gray-700">
                      Matured Unriped (MUR) <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="maturedRipe"
                      name="maturedRipe"
                      defaultChecked
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="maturedRipe" className="ml-2 block text-sm text-gray-700">
                      Matured Riped (MR) <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="diseased"
                      name="diseased"
                      defaultChecked
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="diseased" className="ml-2 block text-sm text-gray-700">
                      Diseased (D) <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="countDate"
                      name="countDate"
                      defaultChecked
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="countDate" className="ml-2 block text-sm text-gray-700">
                      Date of Counting <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notes"
                      name="notes"
                      defaultChecked
                      className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                    />
                    <label htmlFor="notes" className="ml-2 block text-sm text-gray-700">
                      Additional Notes
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Custom fields section */}
              {customFields.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Custom Fields</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customFields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={field.id}
                            name={field.name}
                            defaultChecked
                            className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                          />
                          <label htmlFor={field.id} className="ml-2 block text-sm text-gray-700">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                            <span className="text-xs text-gray-500 ml-1">({field.type})</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Add custom field form */}
              {isAddingField && (
                <div className="bg-blue-50 p-4 rounded-md mb-4 border border-blue-200">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Add Custom Field</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="fieldLabel" className="block text-sm font-medium text-gray-700">
                        Field Label <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="fieldLabel"
                        value={newField.label}
                        onChange={(e) => setNewField({ ...newField, label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50"
                        placeholder="e.g., Tree Age"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="fieldType" className="block text-sm font-medium text-gray-700">
                        Field Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="fieldType"
                        value={newField.type}
                        onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50"
                        required
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="location">Location</option>
                      </select>
                    </div>
                    
                    {newField.type === "dropdown" && (
                      <div>
                        <label htmlFor="fieldOptions" className="block text-sm font-medium text-gray-700">
                          Options <span className="text-red-500">*</span>
                        </label>
                        <div className="flex mt-1">
                          <input
                            type="text"
                            id="fieldOptions"
                            value={optionInput}
                            onChange={(e) => setOptionInput(e.target.value)}
                            className="block w-full rounded-l-md border-r-0 border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50"
                            placeholder="Add an option"
                          />
                          <button
                            type="button"
                            onClick={handleAddOption}
                            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 text-sm leading-4 font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none"
                          >
                            Add
                          </button>
                        </div>
                        {newField.options && newField.options.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Options:</p>
                            <div className="flex flex-wrap gap-2">
                              {newField.options.map((option, index) => (
                                <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs flex items-center">
                                  {option}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(option)}
                                    className="ml-1 text-gray-500 hover:text-red-500"
                                  >
                                    &times;
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="fieldRequired"
                        checked={newField.required}
                        onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                        className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                      />
                      <label htmlFor="fieldRequired" className="ml-2 block text-sm text-gray-700">
                        Required field
                      </label>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsAddingField(false)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddField}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-koa-orange hover:bg-orange-600 focus:outline-none"
                      >
                        Add Field
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                {!isAddingField && (
                  <button
                    type="button"
                    onClick={() => setIsAddingField(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Custom Field
                  </button>
                )}
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Form Access</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="supervisorAccess"
                    name="supervisorAccess"
                    defaultChecked
                    className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                  />
                  <label htmlFor="supervisorAccess" className="ml-2 block text-sm text-gray-700">
                    All Supervisors (View, Edit, Delete)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="officerAccess"
                    name="officerAccess"
                    defaultChecked
                    className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                  />
                  <label htmlFor="officerAccess" className="ml-2 block text-sm text-gray-700">
                    All Field Officers (View, Edit)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="guestAccess"
                    name="guestAccess"
                    defaultChecked
                    className="h-4 w-4 text-koa-orange focus:ring-koa-orange border-gray-300 rounded"
                  />
                  <label htmlFor="guestAccess" className="ml-2 block text-sm text-gray-700">
                    All Guests (View Only)
                  </label>
                </div>
              </div>
            </div>
            
            <div className="py-6">
              <Button
                type="submit"
                size="lg"
                className="mr-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Form"
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/forms")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 