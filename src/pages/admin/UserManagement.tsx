import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Mail,
  Shield,
  Calendar,
  Activity,
  RefreshCw,
  Download,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const { toast } = useToast();

  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'User Management' }
  ];

  const users = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
      joinDate: '2024-01-15',
      lastActive: '2024-01-20',
      totalSessions: 47,
      avgAccuracy: 89,
      totalHours: 12.5,
      phone: '+1 234-567-8900',
      location: 'New York, USA',
      preferences: {
        notifications: true,
        language: 'English',
        theme: 'light'
      }
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'user',
      status: 'active',
      joinDate: '2024-01-10',
      lastActive: '2024-01-19',
      totalSessions: 32,
      avgAccuracy: 92,
      totalHours: 8.3,
      phone: '+1 234-567-8901',
      location: 'California, USA',
      preferences: {
        notifications: false,
        language: 'English',
        theme: 'dark'
      }
    },
    {
      id: 3,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
      joinDate: '2023-12-01',
      lastActive: '2024-01-20',
      totalSessions: 15,
      avgAccuracy: 95,
      totalHours: 4.2,
      phone: '+1 234-567-8902',
      location: 'Texas, USA',
      preferences: {
        notifications: true,
        language: 'English',
        theme: 'light'
      }
    },
    {
      id: 4,
      name: 'Mike Johnson',
      email: 'mike@example.com',
      role: 'user',
      status: 'inactive',
      joinDate: '2024-01-05',
      lastActive: '2024-01-12',
      totalSessions: 8,
      avgAccuracy: 76,
      totalHours: 2.1,
      phone: '+1 234-567-8903',
      location: 'Florida, USA',
      preferences: {
        notifications: true,
        language: 'English',
        theme: 'light'
      }
    },
    {
      id: 5,
      name: 'Sarah Wilson',
      email: 'sarah@example.com',
      role: 'user',
      status: 'suspended',
      joinDate: '2024-01-20',
      lastActive: '2024-01-22',
      totalSessions: 25,
      avgAccuracy: 84,
      totalHours: 6.7,
      phone: '+1 234-567-8904',
      location: 'Washington, USA',
      preferences: {
        notifications: false,
        language: 'Spanish',
        theme: 'dark'
      }
    }
  ];

  const activityLogs = [
    {
      userId: 1,
      userName: 'John Doe',
      action: 'Started transcription session',
      timestamp: '2024-01-20 14:30:00',
      details: 'Real-time session, 15 minutes'
    },
    {
      userId: 2,
      userName: 'Jane Smith',
      action: 'Completed educational quiz',
      timestamp: '2024-01-20 13:45:00',
      details: 'Vowel Recognition Quiz - Score: 92%'
    },
    {
      userId: 1,
      userName: 'John Doe',
      action: 'Updated profile settings',
      timestamp: '2024-01-20 12:15:00',
      details: 'Changed transcription format'
    },
    {
      userId: 4,
      userName: 'Mike Johnson',
      action: 'Login attempt',
      timestamp: '2024-01-19 09:30:00',
      details: 'Last login session'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-primary/10 text-primary border-primary/20';
      case 'user': return 'bg-secondary/10 text-secondary border-secondary/20';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Advanced filtering and sorting logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const userDate = new Date(user.joinDate);
      const now = new Date();
      
      switch (dateFilter) {
        case 'week':
          matchesDate = (now.getTime() - userDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          matchesDate = (now.getTime() - userDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
          break;
        case '3months':
          matchesDate = (now.getTime() - userDate.getTime()) <= 90 * 24 * 60 * 60 * 1000;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesRole && matchesDate;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'joinDate':
        aValue = new Date(a.joinDate);
        bValue = new Date(b.joinDate);
        break;
      case 'lastActive':
        aValue = new Date(a.lastActive);
        bValue = new Date(b.lastActive);
        break;
      case 'sessions':
        aValue = a.totalSessions;
        bValue = b.totalSessions;
        break;
      case 'accuracy':
        aValue = a.avgAccuracy;
        bValue = b.avgAccuracy;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handlePasswordReset = (user) => {
    setSelectedUser(user);
    setIsPasswordResetModalOpen(true);
  };

  const handleSaveUser = () => {
    toast({
      title: "Success",
      description: "User updated successfully",
    });
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleConfirmDelete = () => {
    toast({
      title: "Success",
      description: "User deleted successfully",
    });
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const handleConfirmPasswordReset = () => {
    toast({
      title: "Password Reset Sent",
      description: `A password reset link has been sent to ${selectedUser?.email}`,
    });
    setIsPasswordResetModalOpen(false);
    setSelectedUser(null);
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Status', 'Join Date', 'Last Active', 'Sessions', 'Accuracy'],
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.role,
        user.status,
        user.joinDate,
        user.lastActive,
        user.totalSessions,
        `${user.avgAccuracy}%`
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "User data has been exported to CSV",
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage users, monitor activity, and review performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={exportUsers}
            variant="outline" 
            className="flex items-center gap-2 border-primary/20 text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-105"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105">
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
            <Eye className="h-4 w-4" />
            Activity Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Advanced Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-primary/20 animate-fade-in">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-primary/20 focus:border-primary focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Status Filter</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="border-primary/20">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Role Filter</Label>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="border-primary/20">
                          <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Registration Date</Label>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="border-primary/20">
                          <SelectValue placeholder="All Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="week">Past Week</SelectItem>
                          <SelectItem value="month">Past Month</SelectItem>
                          <SelectItem value="3months">Past 3 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Sort By</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="border-primary/20">
                          <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="joinDate">Join Date</SelectItem>
                          <SelectItem value="lastActive">Last Active</SelectItem>
                          <SelectItem value="sessions">Sessions</SelectItem>
                          <SelectItem value="accuracy">Accuracy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Users Table with Enhanced Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-primary/20 animate-fade-in">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-primary">User Accounts ({filteredUsers.length} total)</CardTitle>
                    <CardDescription>Manage user accounts and permissions</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSort(sortBy)}
                      className="border-primary/20 text-primary hover:bg-primary/10"
                    >
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary/10">
                        <th 
                          className="text-left p-3 font-medium text-primary cursor-pointer hover:bg-primary/5 transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1">
                            User
                            {sortBy === 'name' && (sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}
                          </div>
                        </th>
                        <th className="text-left p-3 font-medium text-primary">Role</th>
                        <th className="text-left p-3 font-medium text-primary">Status</th>
                        <th 
                          className="text-left p-3 font-medium text-primary cursor-pointer hover:bg-primary/5 transition-colors"
                          onClick={() => handleSort('lastActive')}
                        >
                          <div className="flex items-center gap-1">
                            Last Active
                            {sortBy === 'lastActive' && (sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}
                          </div>
                        </th>
                        <th 
                          className="text-left p-3 font-medium text-primary cursor-pointer hover:bg-primary/5 transition-colors"
                          onClick={() => handleSort('sessions')}
                        >
                          <div className="flex items-center gap-1">
                            Sessions
                            {sortBy === 'sessions' && (sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}
                          </div>
                        </th>
                        <th 
                          className="text-left p-3 font-medium text-primary cursor-pointer hover:bg-primary/5 transition-colors"
                          onClick={() => handleSort('accuracy')}
                        >
                          <div className="flex items-center gap-1">
                            Accuracy
                            {sortBy === 'accuracy' && (sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}
                          </div>
                        </th>
                        <th className="text-left p-3 font-medium text-primary">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((user) => (
                        <motion.tr 
                          key={user.id} 
                          className="border-b hover:bg-primary/5 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: user.id * 0.05 }}
                        >
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={`${getRoleColor(user.role)} border`}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={`${getStatusColor(user.status)} border`}>
                              {user.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {user.lastActive}
                          </td>
                          <td className="p-3 text-sm">
                            {user.totalSessions}
                          </td>
                          <td className="p-3 text-sm">
                            <span className={user.avgAccuracy >= 90 ? 'text-green-600' : user.avgAccuracy >= 80 ? 'text-yellow-600' : 'text-red-600'}>
                              {user.avgAccuracy}%
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditUser(user)}
                                className="border-primary/20 text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-105"
                                title="Edit User"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewUser(user)}
                                className="border-primary/20 text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-105"
                                title="View Details"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handlePasswordReset(user)}
                                className="border-orange-200 text-orange-600 hover:bg-orange-50 transition-all duration-200 hover:scale-105"
                                title="Reset Password"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-105"
                                    title="Delete User"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to permanently delete "{user.name}"'s account? 
                                      This action cannot be undone and will remove all user data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleConfirmDelete()}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete Account
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-primary/10">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(startIndex + usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="border-primary/20"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? "bg-primary text-white" : "border-primary/20"}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="border-primary/20"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-500 mb-2">No users found</h3>
                    <p className="text-gray-400">
                      {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || dateFilter !== 'all' 
                        ? 'Try adjusting your search and filter criteria' 
                        : 'No users have been registered yet'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* User Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: 'Total Users', value: '1,247', color: 'text-primary' },
              { title: 'Active Users', value: '1,089', color: 'text-green-600' },
              { title: 'Inactive Users', value: '158', color: 'text-yellow-600' },
              { title: 'Admin Users', value: '12', color: 'text-secondary' }
            ].map((stat, index) => (
              <Card key={index} className="border-primary/20 animate-fade-in hover:shadow-lg transition-all duration-300 hover:scale-105" style={{ animationDelay: `${index * 100}ms` }}>
                <CardContent className="p-6 text-center">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.title}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="border-primary/20 animate-fade-in">
            <CardHeader>
              <CardTitle className="text-primary">Recent Activity</CardTitle>
              <CardDescription>Monitor user actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border border-primary/10 rounded-lg hover:bg-primary/5 transition-colors animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-primary">{log.userName}</span>
                        <span className="text-sm text-gray-500">{log.timestamp}</span>
                      </div>
                      <div className="text-sm text-gray-700 mb-1">{log.action}</div>
                      <div className="text-xs text-gray-500">{log.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Profile View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-primary">User Profile Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedUser.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedUser.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Location</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedUser.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Role</Label>
                  <Badge className={`${getRoleColor(selectedUser.role)} border mt-1`}>
                    {selectedUser.role}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Badge className={`${getStatusColor(selectedUser.status)} border mt-1`}>
                    {selectedUser.status}
                  </Badge>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Account Activity</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-lg font-semibold text-primary">{selectedUser.totalSessions}</div>
                    <div className="text-xs text-gray-600">Total Sessions</div>
                  </div>
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-lg font-semibold text-primary">{selectedUser.avgAccuracy}%</div>
                    <div className="text-xs text-gray-600">Avg Accuracy</div>
                  </div>
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <div className="text-lg font-semibold text-primary">{selectedUser.totalHours}h</div>
                    <div className="text-xs text-gray-600">Total Hours</div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Preferences</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Language</Label>
                    <p className="text-sm text-gray-900 mt-1">{selectedUser.preferences?.language}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Theme</Label>
                    <p className="text-sm text-gray-900 mt-1">{selectedUser.preferences?.theme}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Notifications</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedUser.preferences?.notifications ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handlePasswordReset(selectedUser)}
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
                <Button
                  onClick={() => handleEditUser(selectedUser)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Reset Confirmation Modal */}
      <Dialog open={isPasswordResetModalOpen} onOpenChange={setIsPasswordResetModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary">Reset User Password</DialogTitle>
            <DialogDescription>
              Send password reset link to user's email
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900">Password Reset Support</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    This will send a secure password reset link to <strong>{selectedUser?.email}</strong>. 
                    The user will be able to create a new password using this link.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">
                <strong>User:</strong> {selectedUser?.name}<br />
                <strong>Email:</strong> {selectedUser?.email}<br />
                <strong>Last Active:</strong> {selectedUser?.lastActive}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsPasswordResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPasswordReset}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Reset Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
