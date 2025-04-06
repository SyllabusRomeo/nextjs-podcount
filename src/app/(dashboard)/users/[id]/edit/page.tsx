import EditUserForm from './EditUserForm';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Edit User ${resolvedParams.id}`,
    description: `Edit user details for user ${resolvedParams.id}`,
  };
}

export default async function EditUserPage({ params, searchParams }: PageProps) {
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/users');
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  return <EditUserForm userId={resolvedParams.id} />;
} 