"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

type Form = {
  id: string;
  name: string;
  description?: string;
  type: string;
  factoryName: string;
  createdAt: string;
  permissions?: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
};

export default function FormsPage() {
  const { data: session, status } = useSession();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchForms();
    }
  }, [session]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/forms?t=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch forms');
      }

      const data = await response.json();
      setForms(data);
      
      // Only create default forms if none exist and user has a factory
      if (data.length === 0 && session?.user?.factoryId) {
        await createDefaultForms();
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
      alert('Failed to load forms. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultForms = async () => {
    try {
      if (!session?.user?.factoryId) {
        console.error("No factory ID found for user");
        return;
      }

      // Default organic form
      const organicForm = {
        name: "Organic Cocoa Pod Counting Template",
        description: "Default template for organic cocoa pod counting",
        type: "ORGANIC",
        factoryId: session.user.factoryId,
        fields: JSON.stringify([
          { name: "farm_name", type: "text", required: true },
          { name: "plot_id", type: "text", required: true },
          { name: "harvest_date", type: "date", required: true },
          { name: "pod_count", type: "number", required: true },
          { name: "weather_conditions", type: "text", required: false },
          { name: "notes", type: "text", required: false }
        ])
      };

      // Default conventional form
      const conventionalForm = {
        name: "Conventional Cocoa Pod Counting Template",
        description: "Default template for conventional cocoa pod counting",
        type: "CONVENTIONAL",
        factoryId: session.user.factoryId,
        fields: JSON.stringify([
          { name: "farm_name", type: "text", required: true },
          { name: "plot_id", type: "text", required: true },
          { name: "harvest_date", type: "date", required: true },
          { name: "pod_count", type: "number", required: true },
          { name: "fertilizer_used", type: "text", required: true },
          { name: "pesticide_used", type: "text", required: true },
          { name: "notes", type: "text", required: false }
        ])
      };

      // Create both forms with proper error handling
      const responses = await Promise.all([
        fetch('/api/forms', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify(organicForm)
        }),
        fetch('/api/forms', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify(conventionalForm)
        })
      ]);

      // Check if both creations were successful
      if (!responses.every(r => r.ok)) {
        throw new Error('Failed to create default forms');
      }

      // Fetch forms again with cache busting
      const timestamp = new Date().getTime();
      const refreshResponse = await fetch(`/api/forms?t=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setForms(refreshedData);
      }
    } catch (error) {
      console.error("Error creating default forms:", error);
      alert('Failed to create default forms. Please try again.');
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This will also delete all associated data and cannot be undone.')) {
      return;
    }

    setDeleting(formId);
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error('Failed to delete form');
      }

      // Remove the deleted form from state
      setForms(prevForms => prevForms.filter(form => form.id !== formId));
      
      // Notify other components about the deletion with the form ID
      localStorage.setItem('formDeleted', formId);
      
      // Clear any cached data
      await fetch(`/api/forms?clear-cache=1&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      alert('Form and associated data deleted successfully');
    } catch (error) {
      console.error('Error deleting form:', error);
      alert('Failed to delete form');
    } finally {
      setDeleting(null);
    }
  };

  if (status === "loading" || loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!session) {
    return null;
  }

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Form Templates</h1>
        <div className="flex space-x-4">
          <Link href="/forms/new" className="btn-primary">
            Create New Form
          </Link>
          <Link href="/forms/import" className="btn-outline">
            Import from CSV/XLS
          </Link>
        </div>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p>No form templates found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Factory
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Created
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forms.map((form) => (
                <tr key={form.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {form.name}
                    </div>
                    {form.description && (
                      <div className="text-sm text-gray-500">
                        {form.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeClass(
                        form.type
                      )}`}
                    >
                      {form.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {form.factoryName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(form.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/forms/${form.id}`}
                      className="text-koa-orange hover:text-orange-700 mr-2"
                    >
                      View
                    </Link>
                    <Link
                      href={`/forms/${form.id}/edit`}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      Edit
                    </Link>
                    {session?.user?.role === 'ADMIN' && (
                      <button
                        onClick={() => handleDelete(form.id)}
                        disabled={deleting === form.id}
                        className={`text-red-600 hover:text-red-900 ${
                          deleting === form.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {deleting === form.id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 