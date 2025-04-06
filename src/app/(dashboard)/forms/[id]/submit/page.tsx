"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  factory: {
    id: string;
    name: string;
  };
  fields: {
    sections: Section[];
  };
};

export default function SubmitFormPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessOptions, setShowSuccessOptions] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Form not found');
          } else if (response.status === 403) {
            throw new Error('You don\'t have permission to view this form');
          } else {
            throw new Error('Failed to fetch form');
          }
        }

        const formData = await response.json();
        
        // Parse fields if it's a string
        let fields;
        if (typeof formData.fields === 'string') {
          try {
            fields = JSON.parse(formData.fields);
          } catch (e) {
            console.error("Error parsing form fields:", e);
            throw new Error('Invalid form data format');
          }
        } else {
          fields = formData.fields;
        }
        
        // Transform the fields into sections format if needed
        if (Array.isArray(fields)) {
          formData.fields = {
            sections: [
              {
                title: "Form Fields",
                fields: fields
              }
            ]
          };
        } else if (fields.sections) {
          formData.fields = fields;
        }

        setForm(formData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching form:", error);
        setLoading(false);
      }
    };

    if (params.id) {
      fetchForm();
    }
  }, [params.id]);

  // Handle field change
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData({
      ...formData,
      [fieldName]: value,
    });
    
    // Clear error when field is filled
    if (errors[fieldName]) {
      setErrors({
        ...errors,
        [fieldName]: "",
      });
    }
  };

  // Get current location
  const handleGetLocation = (fieldName: string) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          handleFieldChange(fieldName, `${location.lat},${location.lng}`);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please check your device settings.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!form) return false;

    // Check all required fields
    form.fields.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required) {
          const value = formData[field.name];
          if (!value) {
            newErrors[field.name] = "This field is required";
            isValid = false;
          } else if (field.type === "number" && isNaN(Number(value))) {
            newErrors[field.name] = "Please enter a valid number";
            isValid = false;
          }
        }
      });
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Transform form data to match backend format
      const transformedData = Object.entries(formData).reduce((acc, [key, value]) => {
        // Convert empty strings to null
        if (value === '') {
          acc[key] = null;
        }
        // Convert number strings to actual numbers
        else if (!isNaN(Number(value)) && typeof value === 'string') {
          acc[key] = Number(value);
        }
        // Keep other values as is
        else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: params.id,
          data: transformedData,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to submit form');
      }

      await response.json();
      // Show success options instead of redirecting
      setShowSuccessOptions(true);
      // Clear form data for new submission
      setFormData({});
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error instanceof Error ? error.message : "Error submitting form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render appropriate input based on field type
  const renderFieldInput = (field: Field) => {
    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            id={field.name}
            value={formData[field.name] || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50 ${errors[field.name] ? 'border-red-500' : ''}`}
            required={field.required}
          />
        );
      
      case "number":
        return (
          <input
            type="number"
            id={field.name}
            value={formData[field.name] || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50 ${errors[field.name] ? 'border-red-500' : ''}`}
            required={field.required}
          />
        );
      
      case "date":
        return (
          <input
            type="date"
            id={field.name}
            value={formData[field.name] || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50 ${errors[field.name] ? 'border-red-500' : ''}`}
            required={field.required}
          />
        );
      
      case "dropdown":
        return (
          <select
            id={field.name}
            value={formData[field.name] || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50 ${errors[field.name] ? 'border-red-500' : ''}`}
            required={field.required}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      case "location":
        return (
          <div className="mt-1 flex space-x-2">
            <input
              type="text"
              id={field.name}
              value={formData[field.name] || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50 ${errors[field.name] ? 'border-red-500' : ''}`}
              placeholder="Latitude, Longitude"
              readOnly
              required={field.required}
            />
            <button
              type="button"
              onClick={() => handleGetLocation(field.name)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-koa-orange hover:bg-orange-600 focus:outline-none"
            >
              Get Location
            </button>
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            id={field.name}
            value={formData[field.name] || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring focus:ring-koa-orange focus:ring-opacity-50"
            required={field.required}
          />
        );
    }
  };

  if (status === "loading" || loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  if (!form) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-4">Form not found</h2>
        <p className="mb-6">The form you are trying to access does not exist or you don't have permission to view it.</p>
        <Link href="/forms" className="btn-primary">
          Back to Forms
        </Link>
      </div>
    );
  }

  if (showSuccessOptions) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Form Submitted Successfully!</h3>
            <p className="text-sm text-gray-500 mb-6">What would you like to do next?</p>
            <div className="space-y-3">
              <button
                onClick={() => setShowSuccessOptions(false)}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-koa-orange hover:bg-orange-600 focus:outline-none"
              >
                Submit Another Response
              </button>
              <Link
                href={`/tables/${params.id}`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                View All Responses
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Submit Form: {form.name}</h1>
        <div className="flex items-center mt-2">
          <div className="w-6 h-6 rounded-full bg-koa-orange flex items-center justify-center text-white font-medium text-sm">
            {form.type === "ORGANIC" ? "O" : "C"}
          </div>
          <span className="ml-2 text-sm font-medium text-gray-700">
            {form.type} Form | Factory: {form.factory.name}
          </span>
        </div>
        {form.description && (
          <p className="text-gray-600 mt-1">{form.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {form.fields.sections.map((section, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">{section.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.fields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderFieldInput(field)}
                  {errors[field.name] && (
                    <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end space-x-3">
          <Link
            href={`/forms/${form.id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-koa-orange hover:bg-orange-600 focus:outline-none"
          >
            {isSubmitting ? "Submitting..." : "Submit Form"}
          </button>
        </div>
      </form>
    </div>
  );
} 