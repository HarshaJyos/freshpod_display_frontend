// Pages/UserDirective.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config_portal/axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FiUsers, FiUserPlus, FiEdit2, FiTrash2, FiShield, 
  FiUser, FiCpu, FiXCircle, FiSearch,
  FiPhone, FiMapPin, FiRefreshCw
} from 'react-icons/fi';

const UserDirective = () => {
  const { accessToken, userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    location: '',
    state: '',
    country: 'India',
    role: 'customer',
    assignedMachineIds: [],
    razorpayKeyId: '',
    razorpayKeySecret: ''
  });

  // Fetch users from backend
  useEffect(() => {
    fetchUsers();
    fetchMachines();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/users', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('Fetched users:', response.data);
      setUsers(response.data || []);
      if (response.data?.length === 0) {
        toast.info('No users found. Create your first user!');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await axiosInstance.get('/admin/machine/data', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('Raw machines response:', response.data);
      
      let machineList = [];
      if (Array.isArray(response.data)) {
        machineList = response.data.map(item => ({
          _id: item._id,
          machineId: item.machineId,
          location: item.location,
          assignedTo: item.assignedTo,
          dealership: item.dealership,
          operatorId: item.operatorId,
          status: item.status
        }));
      }
      
      console.log('Processed machines:', machineList);
      setMachines(machineList);
    } catch (error) {
      console.error('Failed to fetch machines:', error);
      toast.error('Failed to fetch machines');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        location: formData.location,
        state: formData.state,
        country: formData.country,
        role: formData.role,
        assignedMachineIds: formData.assignedMachineIds,
        razorpayKeyId: formData.razorpayKeyId,
        razorpayKeySecret: formData.razorpayKeySecret
      };
      
      await axiosInstance.post('/admin/createUser', userData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      toast.success('User created successfully!');
      setShowAddModal(false);
      resetForm();
      fetchUsers();
      fetchMachines();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        location: formData.location,
        assignedMachineIds: formData.assignedMachineIds,
        razorpayKeyId: formData.razorpayKeyId,
        razorpayKeySecret: formData.razorpayKeySecret
      };
      
      await axiosInstance.put(`/admin/user/${selectedUser._id}`, userData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      toast.success('User updated successfully!');
      setShowEditModal(false);
      resetForm();
      fetchUsers();
      fetchMachines();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axiosInstance.delete(`/admin/user/${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        toast.success('User deleted successfully!');
        fetchUsers();
        fetchMachines();
      } catch (error) {
        console.error('Failed to delete user:', error);
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      location: '',
      state: '',
      country: 'India',
      role: 'customer',
      assignedMachineIds: [],
      razorpayKeyId: '',
      razorpayKeySecret: ''
    });
    setSelectedUser(null);
  };

  const openEditModal = (user) => {
    let userMachineIds = [];
    if (user.assignedMachines && user.assignedMachines.length > 0) {
      userMachineIds = user.assignedMachines.map(m => {
        return typeof m === 'object' ? m._id : m;
      });
    }
    
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      location: user.location || '',
      state: user.state || '',
      country: user.country || 'India',
      role: user.role,
      assignedMachineIds: userMachineIds,
      razorpayKeyId: user.razorpayKeyId || '',
      razorpayKeySecret: user.razorpayKeySecret || ''
    });
    setShowEditModal(true);
  };

  const toggleMachineAssignment = (machineId) => {
    setFormData(prev => {
      const isCurrentlyAssigned = prev.assignedMachineIds.includes(machineId);
      const newAssignedIds = isCurrentlyAssigned
        ? prev.assignedMachineIds.filter(id => id !== machineId)
        : [...prev.assignedMachineIds, machineId];
      
      return {
        ...prev,
        assignedMachineIds: newAssignedIds
      };
    });
  };

  // Check if machine is completely unassigned
  const isMachineCompletelyUnassigned = (machine) => {
    const noDealership = !machine.dealership || machine.dealership === null;
    const noOperator = !machine.operatorId || machine.operatorId === null;
    const noCustomer = !machine.assignedTo || machine.assignedTo === null;
    
    return noDealership && noOperator && noCustomer;
  };

  // Get machines for ADD USER modal
  const getAvailableMachinesForAdd = () => {
    if (formData.role === 'admin') {
      return [];
    }
    return machines.filter(machine => isMachineCompletelyUnassigned(machine));
  };

  // Get machines for EDIT USER modal
  const getAvailableMachinesForEdit = () => {
    if (!selectedUser) return [];
    if (selectedUser.role === 'admin') return [];
    
    return machines.filter(machine => {
      const isCurrentlyAssignedToThisUser = machine.assignedTo === selectedUser._id;
      const isCompletelyUnassigned = isMachineCompletelyUnassigned(machine);
      return isCurrentlyAssignedToThisUser || isCompletelyUnassigned;
    });
  };

  // Get machine assignment status text
  const getMachineAssignmentStatus = (machine, currentUserId) => {
    if (machine.assignedTo === currentUserId) {
      return { text: 'Currently assigned', color: 'text-green-500' };
    }
    if (machine.dealership) {
      return { text: 'Assigned to dealership', color: 'text-orange-500' };
    }
    if (machine.operatorId) {
      return { text: 'Assigned to operator', color: 'text-purple-500' };
    }
    if (machine.assignedTo) {
      return { text: 'Assigned to another customer', color: 'text-red-500' };
    }
    return { text: 'Available', color: 'text-green-500' };
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phoneNumber?.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status !== 'inactive').length,
    customers: users.filter(u => u.role === 'customer').length,
    admins: users.filter(u => u.role === 'admin').length,
    dealerships: users.filter(u => u.role === 'dealership').length,
    availableMachines: machines.filter(m => isMachineCompletelyUnassigned(m)).length
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin':
        return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 flex items-center gap-1"><FiShield size={10} /> Admin</span>;
      case 'dealership':
        return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 flex items-center gap-1"><FiUser size={10} /> Dealership</span>;
      case 'customer':
        return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 flex items-center gap-1"><FiUser size={10} /> Customer</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">{role}</span>;
    }
  };

  if (loading) {
    return (
      <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Directory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage users, roles, and machine assignments</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              fetchUsers();
              fetchMachines();
            }}
            className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <FiRefreshCw /> Refresh
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <FiUserPlus /> Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Total Users</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Admins</p>
          <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Dealerships</p>
          <p className="text-2xl font-bold text-orange-600">{stats.dealerships}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Customers</p>
          <p className="text-2xl font-bold text-blue-600">{stats.customers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Free Machines</p>
          <p className="text-2xl font-bold text-orange-600">{stats.availableMachines}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="dealership">Dealership</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Machines</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Razorpay Key ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600">
                        <p className="flex items-center gap-1"><FiPhone size={10} /> {user.phoneNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.assignedMachines?.map(machine => {
                          const machineId = typeof machine === 'object' ? machine.machineId : machine;
                          const machineDetails = machines.find(m => m._id === machineId || m.machineId === machineId);
                          return (
                            <span key={machineId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-medium">
                              <FiCpu size={10} /> {machineDetails?.machineId || machineId?.slice(-6) || 'Unknown'}
                            </span>
                          );
                        })}
                        {(!user.assignedMachines || user.assignedMachines.length === 0) && (
                           <span className="text-xs text-gray-400">No machines assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell font-mono text-[10px] text-gray-600">
                      {user.razorpayKeyId ? `${user.razorpayKeyId.slice(0, 10)}...` : <span className="text-gray-400">None (System Env)</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <FiMapPin size={10} /> {user.location || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit User"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        {user.role !== 'admin' && (
                          <button 
                            onClick={() => handleDeleteUser(user._id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete User"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <FiUsers className="text-4xl mx-auto mb-3 text-gray-300" />
                    <p>No users found</p>
                    <p className="text-sm mt-1">Click "Add User" to create your first user</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
              <button onClick={() => {
                setShowAddModal(false);
                resetForm();
              }} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiXCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      setFormData({
                        ...formData, 
                        role: e.target.value, 
                        assignedMachineIds: []
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="dealership">Dealership</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City, Area"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Razorpay Key ID (Optional)</label>
                  <input
                    type="text"
                    value={formData.razorpayKeyId}
                    onChange={(e) => setFormData({...formData, razorpayKeyId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="rzp_live_..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Razorpay Key Secret (Optional)</label>
                  <input
                    type="password"
                    value={formData.razorpayKeySecret}
                    onChange={(e) => setFormData({...formData, razorpayKeySecret: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Machine Assignment Section */}
              {(formData.role === 'customer' || formData.role === 'dealership') && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Assign Machines 
                    <span className="text-xs text-gray-400 ml-2">
                      (Only completely unassigned machines are shown)
                    </span>
                  </label>
                  <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {getAvailableMachinesForAdd().length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No machines available for assignment</p>
                        <p className="text-xs text-gray-400 mt-1">All machines are already assigned</p>
                      </div>
                    ) : (
                      getAvailableMachinesForAdd().map(machine => (
                        <label key={machine._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.assignedMachineIds.includes(machine._id)}
                            onChange={() => toggleMachineAssignment(machine._id)}
                            className="rounded border-gray-300"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{machine.machineId}</p>
                            <p className="text-xs text-gray-500">{machine.location}</p>
                          </div>
                          <span className="text-xs text-green-500">Available</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Edit User: {selectedUser.name}</h2>
              <button onClick={() => {
                setShowEditModal(false);
                resetForm();
              }} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiXCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Razorpay Key ID (Optional)</label>
                  <input
                    type="text"
                    value={formData.razorpayKeyId}
                    onChange={(e) => setFormData({...formData, razorpayKeyId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="rzp_live_..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Razorpay Key Secret (Optional)</label>
                  <input
                    type="password"
                    value={formData.razorpayKeySecret}
                    onChange={(e) => setFormData({...formData, razorpayKeySecret: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Machine Assignment Section for Edit */}
              {selectedUser.role !== 'admin' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Assign/Unassign Machines 
                    <span className="text-xs text-gray-400 ml-2">
                      (Currently assigned: {formData.assignedMachineIds.length} machines)
                    </span>
                  </label>
                  <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {getAvailableMachinesForEdit().length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No machines available for assignment</p>
                      </div>
                    ) : (
                      getAvailableMachinesForEdit().map(machine => {
                        const status = getMachineAssignmentStatus(machine, selectedUser._id);
                        const isChecked = formData.assignedMachineIds.includes(machine._id);
                        
                        return (
                          <label key={machine._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleMachineAssignment(machine._id)}
                              className="rounded border-gray-300"
                              disabled={!isChecked && machine.assignedTo && machine.assignedTo !== selectedUser._id}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{machine.machineId}</p>
                              <p className="text-xs text-gray-500">{machine.location}</p>
                            </div>
                            <span className={`text-xs ${status.color}`}>
                              {status.text}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDirective;