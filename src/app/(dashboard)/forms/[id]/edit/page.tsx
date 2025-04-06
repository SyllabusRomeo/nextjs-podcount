"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type Field = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
};

type Section = {
  title: string;
  fields: Field[];
};

type Form = {
  id: string;
  name: string;
  description?: string;
  type: string;
  factoryId: string;
  factory?: {
    id: string;
    name: string;
  };
  fields: string | {
    sections: Section[];
  };
};

type Factory = {
  id: string;
  name: string;
  location?: string;
  type: string;
};

export default function EditFormPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [factories, setFactories] = useState<Factory[]>([]);
  const [factoryId, setFactoryId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formFields, setFormFields] = useState<{ sections: Section[] } | null>(null);

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
      }
    };

    if (session?.user) {
      fetchFactories();
    }
  }, [session]);

  // Fetch form data
  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/forms/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Form not found");
          } else if (response.status === 403) {
            setError("You don't have permission to edit this form");
          } else {
            setError("Failed to fetch form data");
          }
          setLoading(false);
          return;
        }
        
        const formData = await response.json();
        setForm(formData);
        setFormName(formData.name);
        setFormDescription(formData.description || "");
        setFactoryId(formData.factoryId);
        
        // Parse fields if it's a string
        if (typeof formData.fields === 'string') {
          try {
            const parsedFields = JSON.parse(formData.fields);
            if (Array.isArray(parsedFields)) {
              // Convert flat field array to sections format
              setFormFields({
                sections: [
                  {
                    title: "Form Fields",
                    fields: parsedFields
                  }
                ]
              });
            } else if (parsedFields.sections) {
              setFormFields(parsedFields);
            }
          } catch (e) {
            console.error("Error parsing form fields:", e);
            setFormFields({
              sections: [
                {
                  title: "Form Fields",
                  fields: []
                }
              ]
            });
          }
        } else if (typeof formData.fields === 'object') {
          setFormFields(formData.fields);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching form for editing:", error);
        setError("Failed to load form data");
        setLoading(false);
      }
    };

    if (params.id && session?.user) {
      fetchForm();
    }
  }, [params.id, session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!form || !formFields) {
        throw new Error("Form data is incomplete");
      }
      
      const response = await fetch(`/api/forms/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          factoryId: factoryId,
          fields: formFields
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update form");
      }
      
      toast({
        title: "Success",
        description: "Form updated successfully",
      });
      router.push(`/forms/${params.id}`);
    } catch (error) {
      console.error("Error updating form:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update form",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFieldRequired = (sectionIndex: number, fieldIndex: number) => {
    if (!formFields) return;

    const updatedFields = { ...formFields };
    const section = { ...updatedFields.sections[sectionIndex] };
    const field = { ...section.fields[fieldIndex] };
    
    field.required = !field.required;
    section.fields[fieldIndex] = field;
    updatedFields.sections[sectionIndex] = section;
    
    setFormFields(updatedFields);
  };

  const updateFieldLabel = (sectionIndex: number, fieldIndex: number, value: string) => {
    if (!formFields) return;

    const updatedFields = { ...formFields };
    const section = { ...updatedFields.sections[sectionIndex] };
    const field = { ...section.fields[fieldIndex] };
    
    field.label = value;
    section.fields[fieldIndex] = field;
    updatedFields.sections[sectionIndex] = section;
    
    setFormFields(updatedFields);
  };

  // Function to update section title
  const updateSectionTitle = (sectionIndex: number, value: string) => {
    if (!formFields) return;

    const updatedFields = { ...formFields };
    const section = { ...updatedFields.sections[sectionIndex] };
    
    section.title = value;
    updatedFields.sections[sectionIndex] = section;
    
    setFormFields(updatedFields);
  };

  if (status === "loading" || loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-4">Error</h2>
        <p className="mb-6">{error}</p>
        <Link href="/forms" className="btn-primary">
          Back to Forms
        </Link>
      </div>
    );
  }

  if (!form || !formFields) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-4">Form not found</h2>
        <p className="mb-6">The form you are trying to edit does not exist or you don't have access to it.</p>
        <Link href="/forms" className="btn-primary">
          Back to Forms
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Edit Form</h1>
        <p className="text-gray-600 mt-1">
          Update the form details and fields below
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="formName" className="block text-sm font-medium text-gray-700">
                Form Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="formName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50"
                required
              />
            </div>
            
            <div>
              <label htmlFor="formDescription" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="formDescription"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50"
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="factory" className="block text-sm font-medium text-gray-700">
                Factory Location <span className="text-red-500">*</span>
              </label>
              <select
                id="factory"
                value={factoryId}
                onChange={(e) => setFactoryId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50"
                required
              >
                <option value="">Select factory location</option>
                {factories.map((factory) => (
                  <option key={factory.id} value={factory.id}>
                    {factory.name} ({factory.location || 'No location'})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-koa-orange flex items-center justify-center text-white font-medium text-sm">
                  {form.type === "ORGANIC" ? "O" : "C"}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {form.type} Form
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Form Sections & Fields</h2>
          
          {formFields.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-8 last:mb-0">
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSectionTitle(sectionIndex, e.target.value)}
                  className="text-lg font-medium text-gray-800 border-none focus:ring-0"
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                {section.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex} className="py-3 border-b border-gray-200 last:border-b-0">
                    <div className="flex flex-wrap md:flex-nowrap items-start gap-4">
                      <div className="w-full md:w-1/2">
                        <label htmlFor={`field-${sectionIndex}-${fieldIndex}`} className="block text-sm font-medium text-gray-700">
                          Field Label
                        </label>
                        <input
                          type="text"
                          id={`field-${sectionIndex}-${fieldIndex}`}
                          value={field.label}
                          onChange={(e) => updateFieldLabel(sectionIndex, fieldIndex, e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50"
                        />
                      </div>
                      <div className="w-full md:w-1/4">
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <div className="mt-1 text-sm text-gray-900 p-2 bg-gray-100 rounded">
                          {field.type}
                        </div>
                      </div>
                      <div className="w-full md:w-1/4">
                        <label className="block text-sm font-medium text-gray-700">Required</label>
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => toggleFieldRequired(sectionIndex, fieldIndex)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                              field.required ? 'bg-koa-orange' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                field.required ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/forms/${params.id}`)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 