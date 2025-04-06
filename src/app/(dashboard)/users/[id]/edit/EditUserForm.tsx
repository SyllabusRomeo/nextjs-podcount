'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useToast } from "@/components/ui/use-toast";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  factoryId: string | null;
};

type Factory = {
  id: string;
  name: string;
};

interface EditUserFormProps {
  userId: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch");
  }
  return res.json();
};

export default function EditUserForm({ userId }: EditUserFormProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const { data: user, error: userError } = useSWR<User>(
    `/api/users/${userId}`,
    fetcher
  );

  const { data: factories, error: factoriesError } = useSWR<Factory[]>(
    "/api/factories",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const [formData, setFormData] = useState<Partial<User>>({
    name: "",
    email: "",
    role: "USER",
    factoryId: null,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        factoryId: user.factoryId,
      });
    }
  }, [user]);

  useEffect(() => {
    if (factoriesError) {
      toast({
        title: "Warning",
        description: "Failed to load factories. Factory assignment may not work correctly.",
        variant: "destructive",
      });
    }
  }, [factoriesError, toast]);

  if (status === "loading" || !user) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    router.push("/users");
    return null;
  }

  if (userError) {
    toast({
      title: "Error",
      description: "Failed to load user. Please try again later.",
      variant: "destructive",
    });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update user");
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });
      router.push("/users");
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Edit User</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring-koa-orange sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring-koa-orange sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as "ADMIN" | "USER" })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring-koa-orange sm:text-sm"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label htmlFor="factory" className="block text-sm font-medium text-gray-700">
              Factory
            </label>
            <select
              id="factory"
              value={formData.factoryId || ""}
              onChange={(e) => setFormData({ ...formData, factoryId: e.target.value || null })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-koa-orange focus:ring-koa-orange sm:text-sm"
              disabled={!factories}
            >
              <option value="">No Factory</option>
              {factories?.map((factory) => (
                <option key={factory.id} value={factory.id}>
                  {factory.name}
                </option>
              ))}
            </select>
            {!factories && !factoriesError && (
              <p className="mt-1 text-sm text-gray-500">Loading factories...</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/users")}
              className="btn-secondary"
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
  );
} 