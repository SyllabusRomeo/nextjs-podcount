'use client';

import { FileImport } from "@/components/FileImport";
import Link from "next/link";
import { ChevronLeft, Home, ListTodo, Plus } from "lucide-react";

export default function ImportFormPage() {
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Navigation and breadcrumbs */}
      <div className="mb-6 flex flex-col space-y-4">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-koa-orange flex items-center">
            <Home className="h-4 w-4 mr-1" />
            <span>Dashboard</span>
          </Link>
          <span className="mx-2">/</span>
          <Link href="/forms" className="hover:text-koa-orange flex items-center">
            <ListTodo className="h-4 w-4 mr-1" />
            <span>Forms</span>
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Import</span>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Import Form from CSV/Excel</h1>
          <div className="flex space-x-3">
            <Link 
              href="/forms"
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Forms
            </Link>
            <Link
              href="/forms/new"
              className="inline-flex items-center px-3 py-2 border border-koa-orange text-sm leading-4 font-medium rounded-md text-white bg-koa-orange hover:bg-orange-600"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create New Form
            </Link>
          </div>
        </div>
        
        <p className="text-gray-600">
          Create a form from your existing data. Upload a CSV or Excel file, and we'll automatically turn column headers into form fields and each row into a response.
        </p>
      </div>
      <FileImport />
    </div>
  );
} 