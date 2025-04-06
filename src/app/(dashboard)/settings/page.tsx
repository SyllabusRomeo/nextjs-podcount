'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
}

interface PasswordResetRequest {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchUsers();
      fetchResetRequests();
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (users.length > 0) {
      setFilteredUsers(
        users.filter((user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setIsLoading(false);
    }
  };

  const fetchResetRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const response = await fetch('/api/password-reset-request');
      if (!response.ok) {
        throw new Error('Failed to fetch password reset requests');
      }
      const data = await response.json();
      setResetRequests(data);
      setIsLoadingRequests(false);
    } catch (error) {
      console.error('Error fetching password reset requests:', error);
      toast.error('Failed to load password reset requests');
      setIsLoadingRequests(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    try {
      setIsResetting(true);
      const response = await fetch(`/api/users/${selectedUser}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      const data = await response.json();
      toast.success('Password reset successfully');
      
      // Show the temporary password to the admin
      toast.message('Temporary Password', {
        description: `The temporary password for this user is: ${data.temporaryPassword}`,
        duration: 10000,
      });
      
      setSelectedUser('');
      setIsResetting(false);
      
      // Refresh reset requests list
      fetchResetRequests();
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
      setIsResetting(false);
    }
  };

  const handleCompleteRequest = async (requestId: string, userId: string) => {
    try {
      // Reset the user's password
      const resetResponse = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!resetResponse.ok) {
        const errorData = await resetResponse.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      const resetData = await resetResponse.json();
      
      // Mark the request as completed
      const completeResponse = await fetch(`/api/password-reset-request/${requestId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to mark request as completed');
      }
      
      toast.success('Password reset successfully');
      
      // Show the temporary password to the admin
      toast.message('Temporary Password', {
        description: `The temporary password for this user is: ${resetData.temporaryPassword}`,
        duration: 10000,
      });
      
      // Refresh reset requests list
      fetchResetRequests();
    } catch (error) {
      console.error('Error handling reset request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process request');
    }
  };

  const handleDismissRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/password-reset-request/${requestId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel request');
      }
      
      toast.success('Request dismissed');
      
      // Refresh reset requests list
      fetchResetRequests();
    } catch (error) {
      console.error('Error dismissing request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to dismiss request');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-koa-orange"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">System Settings</h1>
      
      <Tabs defaultValue="passwordReset" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="passwordReset">Password Reset</TabsTrigger>
          <TabsTrigger value="resetRequests">
            Reset Requests
            {resetRequests.filter(req => req.status === 'PENDING').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {resetRequests.filter(req => req.status === 'PENDING').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="systemConfig">System Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="passwordReset">
          <Card>
            <CardHeader>
              <CardTitle>Reset User Password</CardTitle>
              <CardDescription>
                Reset a user's password. A temporary password will be generated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="search">Search User</Label>
                <Input
                  id="search"
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />
              </div>
              
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser === user.id
                          ? 'bg-orange-100 border-orange-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {user.role} {user.status && `• ${user.status === 'ACTIVE' ? 'Active' : 'Disabled'}`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    {searchQuery ? 'No users match your search' : 'No users found'}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedUser('');
                  setSearchQuery('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={!selectedUser || isResetting}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isResetting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="resetRequests">
          <Card>
            <CardHeader>
              <CardTitle>Password Reset Requests</CardTitle>
              <CardDescription>
                Manage password reset requests from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-koa-orange"></div>
                </div>
              ) : resetRequests.length > 0 ? (
                <div className="grid gap-4">
                  {resetRequests.filter(req => req.status === 'PENDING').map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{request.user.name}</div>
                          <div className="text-sm text-gray-500">{request.user.email}</div>
                        </div>
                        <Badge className="bg-yellow-500">
                          Pending
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-400 mb-4">
                        Requested on {new Date(request.createdAt).toLocaleString()}
                      </div>
                      <div className="flex space-x-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDismissRequest(request.id)}
                        >
                          Dismiss
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={() => handleCompleteRequest(request.id, request.userId)}
                        >
                          Reset Password
                        </Button>
                      </div>
                    </div>
                  ))}

                  {resetRequests.filter(req => req.status !== 'PENDING').length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">Previous Requests</h3>
                      {resetRequests.filter(req => req.status !== 'PENDING').map((request) => (
                        <div key={request.id} className="p-4 border rounded-lg mb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{request.user.name}</div>
                              <div className="text-sm text-gray-500">{request.user.email}</div>
                            </div>
                            <Badge className={request.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-500'}>
                              {request.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-400">
                            Requested on {new Date(request.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No password reset requests found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="systemConfig">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Manage system-wide settings and configurations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                System configuration settings will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 