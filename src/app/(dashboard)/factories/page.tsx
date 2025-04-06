"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";

type Factory = {
  id: string;
  name: string;
  location: string;
  createdAt: string;
  type?: string;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch factories");
  }
  return res.json();
};

const FACTORY_TYPES = [
  { value: "PROCESSING", label: "Processing Factory" },
  { value: "STORAGE", label: "Storage Facility" },
  { value: "OFFICE", label: "Office" },
  { value: "OTHER", label: "Other" },
];

export default function FactoriesPage() {
  const { data: session, status } = useSession();
  const { data: factories, error, isLoading, mutate } = useSWR<Factory[]>(
    "/api/factories",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  const [editingFactory, setEditingFactory] = useState<Factory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleEdit = (factory: Factory) => {
    setEditingFactory(factory);
    setFormError("");
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingFactory) return;

    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await fetch(`/api/factories/${editingFactory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingFactory.name,
          location: editingFactory.location,
          type: editingFactory.type || "OTHER",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update factory");
      }

      mutate(); // Refresh the factories list
      setEditingFactory(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this factory? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/factories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete factory");
      }

      mutate(); // Refresh the factories list
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete factory");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mb-6 flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="h-12 bg-gray-50"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 border-t border-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Factory Locations</h1>
        {session.user.role === "ADMIN" && (
          <Link href="/factories/new" className="btn-primary">
            Add New Factory
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
          Failed to load factories. Please try again later.
        </div>
      )}

      {editingFactory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Factory</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {formError}
                </div>
              )}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={editingFactory.name}
                  onChange={(e) =>
                    setEditingFactory({ ...editingFactory, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring-koa-orange sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={editingFactory.location}
                  onChange={(e) =>
                    setEditingFactory({ ...editingFactory, location: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring-koa-orange sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Factory Type
                </label>
                <select
                  id="type"
                  value={editingFactory.type || "OTHER"}
                  onChange={(e) =>
                    setEditingFactory({ ...editingFactory, type: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring-koa-orange sm:text-sm"
                >
                  {FACTORY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingFactory(null)}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {factories?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p>No factory locations found.</p>
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
                  Location
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
              {factories?.map((factory) => (
                <tr key={factory.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {factory.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {factory.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {FACTORY_TYPES.find(t => t.value === factory.type)?.label || "Other"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(factory.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(factory)}
                      className="text-koa-orange hover:text-orange-700 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(factory.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
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