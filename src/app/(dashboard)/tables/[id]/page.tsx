"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { utils as xlsxUtils, writeFile as xlsxWriteFile } from 'xlsx';

type FormField = {
  name: string;
  label: string;
  type: string;
};

type FormEntry = {
  id: string;
  data: Record<string, any>;
  createdAt: string;
};

type FormData = {
  id: string;
  name: string;
  description?: string;
  type: string;
  factory: {
    id: string;
    name: string;
  };
  fields: FormField[];
  entries: FormEntry[];
};

export default function TableDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filteredEntries, setFilteredEntries] = useState<FormEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        // Fetch form and its responses
        const [formRes, responsesRes] = await Promise.all([
          fetch(`/api/forms/${params.id}`),
          fetch(`/api/responses?formId=${params.id}`)
        ]);

        if (!formRes.ok || !responsesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const form = await formRes.json();
        const responses = await responsesRes.json();

        // Parse form fields based on their format
        let fields: FormField[] = [];
        if (typeof form.fields === 'string') {
          try {
            const parsedFields = JSON.parse(form.fields);
            
            if (Array.isArray(parsedFields)) {
              // Direct array of fields
              fields = parsedFields;
            } else if (parsedFields.sections) {
              // Sections format
              fields = parsedFields.sections.reduce((allFields: FormField[], section: any) => {
                return [...allFields, ...section.fields];
              }, []);
            }
          } catch (e) {
            console.error("Error parsing form fields:", e);
          }
        } else if (Array.isArray(form.fields)) {
          // Already an array
          fields = form.fields;
        } else if (form.fields && form.fields.sections) {
          // Already in sections format
          fields = form.fields.sections.reduce((allFields: FormField[], section: any) => {
            return [...allFields, ...section.fields];
          }, []);
        }

        // Transform form data
        const formData: FormData = {
          id: form.id,
          name: form.name,
          description: form.description,
          type: form.type,
          factory: { id: form.factoryId, name: form.factoryName },
          fields: fields,
          entries: responses.map((response: any) => ({
            id: response.id,
            data: typeof response.data === 'string' ? JSON.parse(response.data) : response.data,
            createdAt: response.createdAt,
            submittedBy: response.submittedBy
          }))
        };

        setFormData(formData);
        setFilteredEntries(formData.entries);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching form data:", error);
        setLoading(false);
      }
    };

    if (params.id) {
      fetchFormData();
    }
  }, [params.id]);

  // Apply search filter
  useEffect(() => {
    if (!formData) return;
    
    if (!searchTerm) {
      setFilteredEntries(formData.entries);
    } else {
      const filtered = formData.entries.filter(entry => {
        // Search through all data fields as string
        return Object.values(entry.data).some(value => 
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredEntries(filtered);
    }
    
    // Reset to first page when filtering
    setCurrentPage(1);
  }, [searchTerm, formData]);

  // Apply sorting
  useEffect(() => {
    if (!sortField || !formData) return;
    
    const sorted = [...filteredEntries].sort((a, b) => {
      const aValue = a.data[sortField];
      const bValue = b.data[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
    
    setFilteredEntries(sorted);
  }, [sortField, sortDirection, formData]);

  // Get all fields for table headers
  const getAllFields = () => {
    if (!formData) return [];
    return formData.fields;
  };

  // Get current page items
  const getCurrentItems = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredEntries.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Handle sort changes
  const handleSort = (fieldName: string) => {
    if (sortField === fieldName) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New sort field, default to ascending
      setSortField(fieldName);
      setSortDirection('asc');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!formData) return;
    
    const fields = getAllFields();
    const headers = fields.map(field => field.label).join(',');
    const rows = filteredEntries.map(entry => {
      return fields.map(field => {
        const value = entry.data[field.name];
        // Escape commas and quotes
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',');
    }).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${formData.name}_data.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!formData) return;
    
    const fields = getAllFields();
    const headers = fields.map(field => field.label);
    const data = [
      headers,
      ...filteredEntries.map(entry => 
        fields.map(field => entry.data[field.name])
      )
    ];
    
    const ws = xlsxUtils.aoa_to_sheet(data);
    const wb = xlsxUtils.book_new();
    xlsxUtils.book_append_sheet(wb, ws, 'Data');
    xlsxWriteFile(wb, `${formData.name}_data.xlsx`);
  };

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const changePage = (pageNumber: number) => setCurrentPage(pageNumber);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-koa-orange"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!formData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Form not found</h1>
        <Link
          href="/tables"
          className="text-koa-orange hover:text-orange-600"
        >
          Back to Tables
        </Link>
      </div>
    );
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{formData.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{formData.description}</p>
        </div>
        <div className="space-x-2">
          <button 
            onClick={exportToCSV}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-koa-orange bg-orange-100 hover:bg-orange-200 focus:outline-none"
          >
            Export CSV
          </button>
          <button 
            onClick={exportToExcel}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-koa-orange bg-orange-100 hover:bg-orange-200 focus:outline-none"
          >
            Export Excel
          </button>
          <Link
            href={`/forms/${params.id}/submit`}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-koa-orange hover:bg-orange-600 focus:outline-none"
          >
            Add Entry
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="w-64">
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {getAllFields().map((field) => (
                    <th
                      key={field.name}
                      onClick={() => handleSort(field.name)}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                    >
                      {field.label}
                      {sortField === field.name && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getCurrentItems().map((entry) => (
                  <tr key={entry.id}>
                    {getAllFields().map((field) => (
                      <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.data[field.name]}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => changePage(page)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === page
                      ? "bg-koa-orange text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 