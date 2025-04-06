"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR, { SWRConfiguration } from "swr";

type Factory = {
  id: string;
  name: string;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch factories");
  }
  return res.json();
};

const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 60000, // Refresh every minute
  errorRetryCount: 3,
};

export default function NewUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { data: factories, error: factoryError, isLoading: isLoadingFactories } = useSWR<Factory[]>(
    "/api/factories",
    fetcher,
    swrConfig
  );
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
    factoryId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create user");
      }

      router.push("/users");
      router.refresh(); // Refresh the users list
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (status === "loading") {
    return (
      <div className="animate-pulse">
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Add New User</h1>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring-koa-orange sm:text-sm transition-colors"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring-koa-orange sm:text-sm transition-colors"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring-koa-orange sm:text-sm transition-colors"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring-koa-orange sm:text-sm transition-colors"
              disabled={loading}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="FIELD_OFFICER">Field Officer</option>
            </select>
          </div>

          <div>
            <label htmlFor="factoryId" className="block text-sm font-medium text-gray-700">
              Factory
            </label>
            <select
              id="factoryId"
              name="factoryId"
              value={formData.factoryId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring-koa-orange sm:text-sm transition-colors"
              disabled={loading || isLoadingFactories}
            >
              <option value="">Select a factory</option>
              {factories?.map((factory) => (
                <option key={factory.id} value={factory.id}>
                  {factory.name}
                </option>
              ))}
            </select>
            {factoryError && (
              <p className="mt-1 text-sm text-red-600">Failed to load factories. Please refresh the page.</p>
            )}
            {isLoadingFactories && (
              <p className="mt-1 text-sm text-gray-500">Loading factories...</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/users"
              className="btn-secondary transition-colors"
              tabIndex={loading ? -1 : 0}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || isLoadingFactories}
              className="btn-primary transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 