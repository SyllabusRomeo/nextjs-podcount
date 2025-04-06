"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  factoryId: string | null;
  status: "ACTIVE" | "DISABLED";
  factory?: {
    name: string;
  };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: users, error, isLoading, mutate } = useSWR<User[]>("/api/users", fetcher);

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete user");
      
      toast.success("User deleted successfully");
      mutate(); // Refresh the users list
    } catch (error) {
      toast.error("Failed to delete user");
      console.error("Error deleting user:", error);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const isDisabling = currentStatus === "ACTIVE";
    const confirmMessage = isDisabling
      ? "Are you sure you want to disable this user? They will not be able to log in until enabled again."
      : "Are you sure you want to enable this user? They will be able to log in to the system.";
    
    if (!confirm(confirmMessage)) return;
    
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE"
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update user status");
      }
      
      const newStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
      toast.success(`User ${newStatus === "ACTIVE" ? "enabled" : "disabled"} successfully`);
      mutate(); // Refresh the users list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update user status";
      toast.error(errorMessage);
      console.error("Error updating user status:", error);
    }
  };

  useEffect(() => {
    // Prefetch the new user page for faster navigation
    router.prefetch("/users/new");
  }, [router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mb-6 flex justify-between items-center">
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
          <div className="h-10 w-28 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="space-y-4 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
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

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Error loading users. Please try again.</p>
        <button onClick={() => router.refresh()} className="btn-secondary mt-4">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Link 
          href="/users/new" 
          className="btn-primary transition-transform active:scale-95"
          prefetch={true}
        >
          Add New User
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Factory
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name || "N/A"}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status === "ACTIVE" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {user.status === "ACTIVE" ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.factory?.name || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  <Link 
                    href={`/users/${user.id}/edit`} 
                    className="text-indigo-600 hover:text-indigo-900 transition-colors inline-flex items-center"
                    prefetch={true}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(user.id, user.status)}
                    className={`${
                      user.status === "ACTIVE" 
                        ? "text-orange-600 hover:text-orange-900" 
                        : "text-green-600 hover:text-green-900"
                    } transition-colors inline-flex items-center`}
                    title={user.status === "ACTIVE" ? "Disable user account" : "Enable user account"}
                  >
                    {user.status === "ACTIVE" ? (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Disable
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                        Enable
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-900 transition-colors inline-flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 