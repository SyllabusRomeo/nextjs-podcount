'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: { [key: string]: string } = {
    default: 'An error occurred during authentication.',
    configuration: 'There is a problem with the server configuration.',
    accessdenied: 'You do not have permission to sign in.',
    verification: 'The verification failed or the token has expired.',
    'signin-failed': 'The sign in attempt failed. Please try again.',
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.default : errorMessages.default;

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Authentication Error
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {errorMessage}
        </p>
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Authentication Error
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Loading error details...
            </p>
          </div>
        </div>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  );
} 