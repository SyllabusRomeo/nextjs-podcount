"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

type TableData = {
  id: string;
  formId: string;
  formName: string;
  formType: string;
  factory: string;
  entriesCount: number;
  lastUpdated: string;
  permissions?: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
};

type Form = {
  id: string;
  name: string;
  type: string;
  factoryName: string;
  createdAt: string;
  access?: Array<{
    userId: string;
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }>;
};

type Response = {
  formId: string;
  createdAt: string;
};

export default function TablesPage() {
  const { data: session, status } = useSession();
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const timestamp = new Date().getTime();
      const [formsRes, responsesRes] = await Promise.all([
        fetch(`/api/forms?t=${timestamp}`, {
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }),
        fetch(`/api/responses?t=${timestamp}`, {
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
      ]);

      if (!formsRes.ok || !responsesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const forms = await formsRes.json();
      const responses = await responsesRes.json();

      // Filter forms based on user role and permissions
      const isAdmin = session?.user?.role === 'ADMIN';
      const isSupervisor = session?.user?.role === 'SUPERVISOR';
      
      let filteredForms = forms;
      if (!isAdmin) {
        // For non-admins, only show forms they have access to
        filteredForms = forms.filter((form: any) => {
          const hasAccess = form.access?.some((access: any) => 
            access.userId === session?.user?.id && access.canView
          );
          return hasAccess;
        });
      }

      // Group responses by formId
      const responsesByForm = responses.reduce((acc: Record<string, Response[]>, response: Response) => {
        if (!acc[response.formId]) {
          acc[response.formId] = [];
        }
        acc[response.formId].push(response);
        return acc;
      }, {});

      // Create table data only for accessible forms
      const tableData = filteredForms
        .filter((form: Form) => form && form.id)
        .map((form: Form) => ({
          id: form.id,
          formId: form.id,
          formName: form.name,
          formType: form.type,
          factory: form.factoryName,
          entriesCount: responsesByForm[form.id]?.length || 0,
          lastUpdated: responsesByForm[form.id]?.[0]?.createdAt || form.createdAt,
          permissions: {
            canView: isAdmin || form.access?.some((a) => a.userId === session?.user?.id && a.canView),
            canEdit: isAdmin || form.access?.some((a) => a.userId === session?.user?.id && a.canEdit),
            canDelete: isAdmin || (isSupervisor && form.access?.some((a) => a.userId === session?.user?.id && a.canDelete))
          }
        }));

      setTables(tableData);
    } catch (error) {
      console.error("Error fetching tables:", error);
      setError('Failed to load tables. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form and its associated data? This action cannot be undone.')) {
      return;
    }

    setDeleting(formId);
    try {
      const deleteResponse = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to delete form');
      }

      // Remove from state immediately
      setTables(prevTables => prevTables.filter(table => table.id !== formId));
      
      // Force a complete refresh of the data
      await fetchTables();
      
      alert('Form and associated data deleted successfully');
    } catch (error) {
      console.error('Error deleting form:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete form');
      // Refresh the tables list to ensure consistent state
      await fetchTables();
    } finally {
      setDeleting(null);
    }
  };

  // Fetch tables only when session changes
  useEffect(() => {
    if (session) {
      fetchTables();
    }
  }, [session]);

  if (status === "loading" || loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
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
        <h1 className="text-2xl font-semibold">Data Tables</h1>
      </div>

      {tables.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p>No tables found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {table.formName}
                  </h2>
                  <div className="mt-2 flex items-center">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeClass(
                        table.formType
                      )} mr-2`}
                    >
                      {table.formType}
                    </span>
                    <span className="text-sm text-gray-500">
                      Factory: {table.factory}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <span>
                      {table.entriesCount} entries | Last updated:{" "}
                      {new Date(table.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/forms/${table.formId}/submit`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-koa-orange hover:bg-orange-600 focus:outline-none"
                  >
                    Add Entry
                  </Link>
                  {table.permissions?.canEdit && (
                    <Link
                      href={`/forms/${table.formId}/edit`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      Edit Form
                    </Link>
                  )}
                  {table.permissions?.canView && (
                    <Link
                      href={`/tables/${table.id}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      View Data
                    </Link>
                  )}
                  {table.permissions?.canDelete && (
                    <button
                      onClick={() => handleDelete(table.id)}
                      disabled={deleting === table.id}
                      className={`inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none ${
                        deleting === table.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {deleting === table.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Sample Data Preview
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Farmer ID
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Farmer Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Community
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          S
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          M
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          L
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          MUR
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          MR
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[1, 2].map((row) => (
                        <tr key={row}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            F-{table.id.slice(0, 4)}-{row}00{row}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            Farmer {row}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {table.factory} {row}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {Math.floor(Math.random() * 50)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {Math.floor(Math.random() * 40)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {Math.floor(Math.random() * 30)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {Math.floor(Math.random() * 20)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {Math.floor(Math.random() * 10)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-right">
                  <span className="text-xs text-gray-500">
                    Displaying 2 of {table.entriesCount} records
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 