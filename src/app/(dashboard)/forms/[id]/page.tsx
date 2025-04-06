"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Form = {
  id: string;
  name: string;
  description?: string;
  type: string;
  factory: {
    name: string;
  };
  createdAt: string;
  fields: {
    sections: Array<{
      title: string;
      fields: Array<{
        name: string;
        label: string;
        type: string;
        required: boolean;
        options?: string[];
      }>;
    }>;
  };
};

export default function FormDetailsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/forms/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Form not found");
          } else if (response.status === 403) {
            setError("You don't have permission to view this form");
          } else {
            setError("Failed to fetch form data");
          }
          setLoading(false);
          return;
        }
        
        const formData = await response.json();
        
        // Parse fields if it's a string
        if (typeof formData.fields === 'string') {
          try {
            formData.fields = JSON.parse(formData.fields);
          } catch (e) {
            console.error("Error parsing form fields:", e);
          }
        }
        
        // Convert flat fields array to sections format if needed
        if (Array.isArray(formData.fields)) {
          formData.fields = {
            sections: [
              {
                title: "Form Fields",
                fields: formData.fields
              }
            ]
          };
        }
        
        setForm(formData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching form details:", error);
        setError("Failed to load form data");
        setLoading(false);
      }
    };

    if (params.id && session?.user) {
      fetchForm();
    }
  }, [params.id, session]);

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "ORGANIC":
        return "bg-green-100 text-green-800";
      case "CONVENTIONAL":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFieldTypeBadge = (type: string) => {
    switch (type) {
      case "text":
        return "bg-blue-100 text-blue-800";
      case "number":
        return "bg-green-100 text-green-800";
      case "date":
        return "bg-purple-100 text-purple-800";
      case "dropdown":
        return "bg-yellow-100 text-yellow-800";
      case "location":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  if (!form) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-4">Form not found</h2>
        <p className="mb-6">The form you are looking for does not exist or you don't have access to it.</p>
        <Link href="/forms" className="btn-primary">
          Back to Forms
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{form.name}</h1>
          {form.description && <p className="text-gray-600 mt-1">{form.description}</p>}
        </div>
        <div className="flex space-x-3">
          <Link href={`/forms/${form.id}/edit`} className="btn-primary">
            Edit Form
          </Link>
          <Link href={`/forms/${form.id}/submit`} className="btn-secondary">
            Enter Data
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-y-4">
          <div className="w-full sm:w-1/2 md:w-1/3">
            <span className="text-sm font-medium text-gray-500">Type</span>
            <div className="mt-1">
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeClass(
                  form.type
                )}`}
              >
                {form.type}
              </span>
            </div>
          </div>
          <div className="w-full sm:w-1/2 md:w-1/3">
            <span className="text-sm font-medium text-gray-500">Factory</span>
            <div className="mt-1 text-sm text-gray-900">{form.factory.name}</div>
          </div>
          <div className="w-full sm:w-1/2 md:w-1/3">
            <span className="text-sm font-medium text-gray-500">Created</span>
            <div className="mt-1 text-sm text-gray-900">
              {new Date(form.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Form Fields</h2>
        </div>
        <div className="px-6 py-4">
          {form.fields.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6 last:mb-0">
              <h3 className="text-md font-medium text-gray-800 mb-3">{section.title}</h3>
              <div className="bg-gray-50 rounded-md p-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Field Label
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Required
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Field Name
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {section.fields.map((field, fieldIndex) => (
                      <tr key={fieldIndex}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {field.label}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getFieldTypeBadge(field.type)}`}>
                            {field.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {field.required ? (
                            <span className="text-green-500">Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {field.name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Link href="/forms" className="text-koa-orange hover:text-orange-700">
          ← Back to Forms
        </Link>
      </div>
    </div>
  );
} 