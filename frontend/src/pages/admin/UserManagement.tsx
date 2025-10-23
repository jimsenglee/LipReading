import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { useConfirmation } from '@/hooks/use-confirmation';
import { 
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Users,
  Activity,
  Shield,
  User
} from 'lucide-react';
import { useUsers, useUpdateUser, useDeleteUser, UserData, UsersParams } from '@/services';
import { getImageUrl, DEFAULT_AVATAR_PATH } from '@/lib/constants';
import AddUserForm from '@/components/admin/AddUserForm';
import DataTable, { Column, Action } from '@/components/admin/DataTable';
import SearchFilterBar from '@/components/admin/SearchFilterBar';
import BulkActions from '@/components/admin/BulkActions';
import { exportToCSV, exportToExcel, exportToPDF, formatDateForExport } from '@/lib/export-utils';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
  const { toast } = useToast();
  const confirmation = useConfirmation();

  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'User Management', href: '/admin/users' }
  ];

  // Query parameters for API - NO PAGE RESET ON SEARCH/FILTER
  const queryParams: UsersParams = {
    page: currentPage,
    per_page: usersPerPage,
    search: searchTerm || undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    sort_by: sortBy,
    sort_order: sortOrder
  };

  const { data: usersResponse, error, refetch } = useUsers(queryParams);
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const users = usersResponse?.data || [];
  const pagination = usersResponse?.pagination;


  // Handle search - no debounce to allow continuous typing
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Don't reset page to prevent jumping effect
  };

  // Handle sorting - NO PAGE RESET
  const handleSort = (field: 'name' | 'email' | 'created_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    // Don't reset page to prevent jumping
  };

  // Handle role filter change - NO PAGE RESET
  const handleRoleFilterChange = (value: 'all' | 'admin' | 'user') => {
    setRoleFilter(value);
    // Don't reset page to prevent jumping effect
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change - ONLY reset page here
  const handleItemsPerPageChange = (value: string) => {
    setUsersPerPage(parseInt(value));
    setCurrentPage(1); // Only reset page when changing items per page
  };

  // Handle individual user selection
  const handleUserSelect = (userId: number, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(user => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  // export functionality using utility functions
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (!users || users.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no users to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Name', 'Email', 'Role', 'Created', 'Sessions'];
    const data = users.map(user => [
      user.name,
      user.email,
      user.role,
      formatDateForExport(user.created_at),
      user.sessions_count
    ]);

    const exportData = { headers, data, filename: 'users' };

    switch (format) {
      case 'csv':
        exportToCSV(exportData);
        toast({
          title: "Export Successful",
          description: "Users data has been exported to CSV.",
        });
          break;
      case 'excel':
        exportToExcel(exportData);
        toast({
          title: "Export Successful",
          description: "Users data has been exported to Excel.",
        });
          break;
      case 'pdf':
        exportToPDF(exportData);
        toast({
          title: "Export Successful",
          description: "Users data has been exported to HTML (PDF-ready).",
        });
          break;
      }
  };

  // Multiple delete functionality
  const handleMultipleDelete = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select users to delete.",
        variant: "destructive",
      });
      return;
    }

    const confirmed = await confirmation.confirm({
      title: "Delete Multiple Users",
      message: `Are you sure you want to delete ${selectedUsers.size} user(s)? This action cannot be undone.`,
      type: "warning",
      confirmText: "Delete All",
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    try {
      confirmation.setLoading(true);
      
      // Delete users one by one
      for (const userId of selectedUsers) {
        await deleteUserMutation.mutateAsync(userId);
      }
      
      setSelectedUsers(new Set());
      setIsMultiDeleteModalOpen(false);
      
      toast({
        title: "Users Deleted",
        description: `${selectedUsers.size} user(s) have been deleted successfully.`,
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Some users could not be deleted. Please try again.",
        variant: "destructive",
      });
    } finally {
      confirmation.setLoading(false);
    }
  };

  // Handle user edit
  const handleEditUser = async (userData: Partial<UserData>) => {
    if (!selectedUser) return;

    try {
      await updateUserMutation.mutateAsync({
        userId: selectedUser.id,
        userData: userData
      });
      
    toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
        variant: "success",
    });
      
    setIsEditModalOpen(false);
    setSelectedUser(null);
    } catch (error: any) {
    toast({
        title: "Update Failed",
        description: error.message || "Failed to update user information.",
        variant: "destructive",
      });
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const confirmed = await confirmation.confirm({
        title: "Delete User",
        message: `Are you sure you want to delete ${selectedUser.name}? This action cannot be undone.`,
        type: "danger",
        confirmText: "Delete User",
        cancelText: "Cancel"
      });

      if (!confirmed) return;

      await deleteUserMutation.mutateAsync(selectedUser.id);
    
    toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
        variant: "success",
    });
      
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      });
    }
  };


  // define table columns for data table
  const userColumns: Column<UserData>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
            {user.profile_image_path ? (
              <img 
                src={getImageUrl(user.profile_image_path)} 
                alt={user.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <User className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="font-medium text-gray-900">{user.name}</div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (user) => <span className="text-gray-600">{user.email}</span>
    },
    {
      key: 'role',
      label: 'Role',
      render: (user) => (
        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
          {user.role}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (user) => <span className="text-gray-600">{formatDateForExport(user.created_at)}</span>
    },
    {
      key: 'sessions_count',
      label: 'Sessions',
      render: (user) => <span className="text-gray-600">{user.sessions_count}</span>
    }
  ];

  // define table actions for data table
  const userActions: Action<UserData>[] = [
    {
      key: 'view',
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: (user) => {
        setSelectedUser(user);
        setIsViewModalOpen(true);
      }
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
      }
    },
    {
      key: 'reset-password',
      label: 'Reset Password',
      icon: <Shield className="h-4 w-4" />,
      onClick: (user) => {
        setSelectedUser(user);
        setIsPasswordResetModalOpen(true);
      },
      className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
      },
      variant: 'ghost',
      className: "text-red-600 hover:text-red-700 hover:bg-red-50"
    }
  ];

  return (
    <div className="space-y-6">
      <AnimatedBreadcrumb items={breadcrumbItems} />
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-gray-600 mt-1">
                Manage users, monitor activity, and control access
          </p>
        </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* bulk actions component */}
              <BulkActions
                selectedCount={selectedUsers.size}
                onBulkDelete={() => setIsMultiDeleteModalOpen(true)}
                onExport={handleExport}
                deleteLabel="Delete"
                exportLabel="Export"
              />

              {/* add user button */}
          <Button 
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4" />
            Add New User
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-primary/5 border border-primary/20">
          <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Users className="h-4 w-4" />
            User Accounts
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Activity className="h-4 w-4" />
            Activity Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
              {/* search and filters - always show */}
              <Card className="border-primary/20">
              <CardContent className="p-6">
                  <SearchFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={handleSearch}
                    searchPlaceholder="Search users by name or email..."
                    filterValue={roleFilter}
                    onFilterChange={handleRoleFilterChange}
                    filterOptions={[
                      { value: 'all', label: 'All Roles' },
                      { value: 'admin', label: 'Admin' },
                      { value: 'user', label: 'User' }
                    ]}
                    filterLabel="Filter by:"
                  />
              </CardContent>
            </Card>
                    

              {/* users table using data table component */}
              <DataTable
                data={users}
                columns={userColumns}
                actions={userActions}
                pagination={pagination}
                selectedItems={selectedUsers}
                onItemSelect={handleUserSelect}
                onSelectAll={handleSelectAll}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                error={error}
                onRetry={() => refetch()}
                emptyStateIcon={<Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
                emptyStateTitle={searchTerm || roleFilter !== 'all' ? 'No Users Found' : 'No Users Yet'}
                emptyStateDescription={searchTerm || roleFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first user.'
                }
                emptyStateAction={!searchTerm && roleFilter === 'all' ? (
                  <Button onClick={() => setIsAddUserModalOpen(true)} className="bg-primary hover:bg-primary/90">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First User
                      </Button>
                ) : undefined}
                title="User Accounts"
                description={pagination ? `${pagination.total_count} total users` : '0 total users'}
                getItemId={(user) => user.id}
              />

        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Logs</h3>
                    <p className="text-gray-600">Activity logging feature coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View User Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20">
                  <img 
                    src={selectedUser.profile_image_path ? getImageUrl(selectedUser.profile_image_path) : DEFAULT_AVATAR_PATH}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_AVATAR_PATH;
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <Badge 
                    variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}
                    className={selectedUser.role === 'admin' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}
                  >
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>
              
                <div className="grid grid-cols-2 gap-4">
                  <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <p className="text-gray-900">{selectedUser.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div>
                  <Label className="text-sm font-medium text-gray-700">Created</Label>
                  <p className="text-gray-900">{formatDateForExport(selectedUser.created_at)}</p>
                  </div>
                  <div>
                  <Label className="text-sm font-medium text-gray-700">Sessions</Label>
                  <p className="text-gray-900">{selectedUser.sessions_count}</p>
                  </div>
                </div>
              </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update information for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
                  <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  defaultValue={selectedUser.name}
                  className="border-primary/20 focus:border-primary"
                />
                  </div>
                  <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  defaultValue={selectedUser.email}
                  className="border-primary/20 focus:border-primary"
                />
                  </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  defaultChecked={selectedUser.is_active}
                  className="rounded border-primary/20"
                />
                <Label htmlFor="edit-active">Active</Label>
                  </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    const name = (document.getElementById('edit-name') as HTMLInputElement)?.value;
                    const email = (document.getElementById('edit-email') as HTMLInputElement)?.value;
                    const isActive = (document.getElementById('edit-active') as HTMLInputElement)?.checked;
                    
                    handleEditUser({ name, email, is_active: isActive });
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Modal */}
      <Dialog open={isPasswordResetModalOpen} onOpenChange={setIsPasswordResetModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              A password reset email will be sent to {selectedUser?.email}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPasswordResetModalOpen(false)}>
              Cancel
            </Button>
              <Button className="bg-primary hover:bg-primary/90">
                Send Reset Email
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with the information below.
            </DialogDescription>
          </DialogHeader>
          <AddUserForm
            onSuccess={() => {
              setIsAddUserModalOpen(false);
              refetch();
            }}
            onCancel={() => setIsAddUserModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Multiple Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isMultiDeleteModalOpen}
        onClose={() => setIsMultiDeleteModalOpen(false)}
        onConfirm={handleMultipleDelete}
        title="Delete Multiple Users"
        message={`Are you sure you want to delete ${selectedUsers.size} user(s)? This action cannot be undone.`}
        type="warning"
        confirmText="Delete All"
        cancelText="Cancel"
        isLoading={confirmation.isLoading}
      />
    </div>
  );
};

export default UserManagement;
