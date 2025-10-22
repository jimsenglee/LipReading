import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { useConfirmation } from '@/hooks/use-confirmation';
import { 
  Search, 
  UserPlus,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Users,
  Activity,
  Mail,
  Shield,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  File
} from 'lucide-react';
import { useUsers, useUpdateUser, useDeleteUser, UserData, UsersParams } from '@/services/queries';
import { getImageUrl, DEFAULT_AVATAR_PATH } from '@/lib/constants';
import AddUserForm from '@/components/admin/AddUserForm';

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
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const confirmation = useConfirmation();

  const breadcrumbItems = [
    { title: 'Admin Panel', href: '/admin' },
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

  // Handle click outside to close export dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

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

  // Multiple export options
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
      formatDate(user.created_at),
      user.sessions_count
    ]);

    switch (format) {
      case 'csv':
        exportToCSV(headers, data);
        break;
      case 'excel':
        exportToExcel(headers, data);
        break;
      case 'pdf':
        exportToPDF(headers, data);
        break;
    }
  };

  const exportToCSV = (headers: string[], data: any[][]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Users data has been exported to CSV.",
    });
  };

  const exportToExcel = (headers: string[], data: any[][]) => {
    // Simple Excel export using CSV with .xlsx extension
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Users data has been exported to Excel.",
    });
  };

  const exportToPDF = (headers: string[], data: any[][]) => {
    // Simple PDF export using HTML
    const htmlContent = `
      <html>
        <head>
          <title>Users Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Users Export - ${new Date().toLocaleDateString()}</h1>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Users data has been exported to HTML (PDF-ready).",
    });
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
        data: userData
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

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Custom pagination component matching Figma design - always shows buttons
  const CustomPagination = () => {
    if (!pagination) return null;

    const totalPages = pagination.total_pages;
    const current = pagination.current_page;
    const hasMultiplePages = totalPages > 1;
    
    // Calculate page numbers to show (max 3)
    let startPage = Math.max(1, current - 1);
    let endPage = Math.min(totalPages, current + 1);
    
    // Adjust if we're near the beginning or end
    if (current <= 2) {
      endPage = Math.min(3, totalPages);
    }
    if (current >= totalPages - 1) {
      startPage = Math.max(1, totalPages - 2);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center space-x-1">
        {/* First Page Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={!hasMultiplePages || current <= 1}
          className={`h-8 w-8 p-0 ${!hasMultiplePages ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          &laquo;
        </Button>

        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(current - 1)}
          disabled={!hasMultiplePages || current <= 1}
          className={`h-8 w-8 p-0 ${!hasMultiplePages ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          &lsaquo;
        </Button>

        {/* Page Numbers */}
        {pages.map(page => (
          <Button
            key={page}
            variant={page === current ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(page)}
            className={`h-8 w-8 p-0 ${page === current ? 'bg-primary text-white' : ''}`}
          >
            {page}
          </Button>
        ))}

        {/* Show ellipsis if there are more pages */}
        {endPage < totalPages && (
          <span className="px-2 text-gray-500">...</span>
        )}

        {/* Last Page Button */}
        {endPage < totalPages && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            className="h-8 w-8 p-0"
          >
            {totalPages}
          </Button>
        )}

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(current + 1)}
          disabled={!hasMultiplePages || current >= totalPages}
          className={`h-8 w-8 p-0 ${!hasMultiplePages ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          &rsaquo;
        </Button>

        {/* Last Page Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={!hasMultiplePages || current >= totalPages}
          className={`h-8 w-8 p-0 ${!hasMultiplePages ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          &raquo;
        </Button>
      </div>
    );
  };

  // Get sort icon
  const getSortIcon = (field: 'name' | 'email' | 'created_at') => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
        <div className="space-y-6">
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
              {/* Export Dropdown */}
              <div className="relative" ref={exportDropdownRef}>
          <Button 
            variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
                {showExportDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleExport('csv');
                          setShowExportDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FileText className="h-4 w-4" />
                        Export as CSV
                      </button>
                      <button
                        onClick={() => {
                          handleExport('excel');
                          setShowExportDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Export as Excel
                      </button>
                      <button
                        onClick={() => {
                          handleExport('pdf');
                          setShowExportDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <File className="h-4 w-4" />
                        Export as PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Multiple Delete Button */}
              {selectedUsers.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={() => setIsMultiDeleteModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedUsers.size})
                </Button>
              )}

              {/* Add User Button */}
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
              {/* Search and Filters - Always show */}
              <Card className="border-primary/20">
              <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Search - on the left */}
                    <div className="flex-1 max-w-md">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="pl-10 border-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                  
                    {/* Role Filter - on the far right */}
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by:</Label>
                      <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                        <SelectTrigger className="w-40 border-primary/20 focus:border-primary">
                          <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    </div>
                </CardContent>
              </Card>
                    

              {/* Users Table */}
              <Card className="border-primary/20">
              <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-primary">User Accounts</CardTitle>
                      <CardDescription>
                        {pagination ? `${pagination.total_count} total users` : '0 total users'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              <CardContent>
                  {error ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Users</h3>
                        <p className="text-gray-600 mb-4">There was a problem loading the user data.</p>
                        <Button onClick={() => refetch()} variant="outline">
                          Try Again
                        </Button>
                </div>
                  </div>
                  ) : users.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {searchTerm || roleFilter !== 'all' ? 'No Users Found' : 'No Users Yet'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {searchTerm || roleFilter !== 'all' 
                            ? 'Try adjusting your search or filter criteria.'
                            : 'Get started by adding your first user.'
                          }
                        </p>
                        {!searchTerm && roleFilter === 'all' && (
                          <Button onClick={() => setIsAddUserModalOpen(true)} className="bg-primary hover:bg-primary/90">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add First User
                    </Button>
                        )}
                  </div>
                </div>
                  ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4">
                              <Checkbox
                                checked={selectedUsers.size === users.length && users.length > 0}
                                onCheckedChange={handleSelectAll}
                              />
                            </th>
                            <th 
                              className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('name')}
                        >
                              <div className="flex items-center gap-2">
                                Name
                                {getSortIcon('name')}
                          </div>
                        </th>
                            <th 
                              className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                              onClick={() => handleSort('email')}
                            >
                              <div className="flex items-center gap-2">
                                Email
                                {getSortIcon('email')}
                          </div>
                        </th>
                            <th className="text-left py-3 px-4">Role</th>
                            <th 
                              className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                              onClick={() => handleSort('created_at')}
                            >
                              <div className="flex items-center gap-2">
                                Created
                                {getSortIcon('created_at')}
                          </div>
                        </th>
                            <th className="text-left py-3 px-4">Sessions</th>
                            <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                          {users.map((user) => (
                            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <Checkbox
                                  checked={selectedUsers.has(user.id)}
                                  onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                                />
                              </td>
                              <td className="py-3 px-4">
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
                            <div>
                                    <div className="font-medium text-gray-900">{user.name}</div>
                                  </div>
                            </div>
                          </td>
                              <td className="py-3 px-4 text-gray-600">{user.email}</td>
                              <td className="py-3 px-4">
                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                              <td className="py-3 px-4 text-gray-600">{formatDate(user.created_at)}</td>
                              <td className="py-3 px-4 text-gray-600">{user.sessions_count}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                              <Button 
                                    variant="ghost"
                                size="sm" 
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setIsViewModalOpen(true);
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                    variant="ghost"
                                size="sm" 
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setIsEditModalOpen(true);
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                    variant="ghost"
                                size="sm" 
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setIsPasswordResetModalOpen(true);
                                    }}
                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Reset Password"
                              >
                                    <Shield className="h-4 w-4" />
                              </Button>
                                  <Button 
                                    variant="ghost"
                                    size="sm" 
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                            </div>
                          </td>
                            </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
                
                {/* Pagination Controls - Bottom */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-gray-700">Show numbers of</Label>
                    <Select value={usersPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                      <SelectTrigger className="w-24 border-primary/20 focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label className="text-sm font-medium text-gray-700">entries</Label>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Showing {pagination ? `${((pagination.current_page - 1) * pagination.per_page) + 1}` : '0'} to {pagination ? `${Math.min(pagination.current_page * pagination.per_page, pagination.total_count)}` : '0'} of {pagination ? pagination.total_count : '0'} entries
                    </span>
                    <CustomPagination />
                  </div>
                </div>
              </CardContent>
            </Card>

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
        </div>
      </div>

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
                  <p className="text-gray-900">{formatDate(selectedUser.created_at)}</p>
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