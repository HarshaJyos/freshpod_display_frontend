// src/Pages/Admin/MachineManagement.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config_portal/axios';
import Loading from "../loading.jsx";
import { 
  FiCpu, FiMapPin, FiDollarSign, FiPlus, FiEye, 
  FiEdit2, FiTrash2, FiRefreshCw, FiUser, FiActivity,
  FiTrendingUp, FiCalendar, FiDroplet, FiAlertCircle, 
  FiCheckCircle, FiX, FiSave, FiSearch, FiFilter,
  FiClock, FiShield, FiAward, FiTool, FiBarChart2,
  FiInfo
} from 'react-icons/fi';

const MachineManagement = () => {
  const { accessToken, userRole } = useAuth();
  const [machines, setMachines] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [formData, setFormData] = useState({
    machineId: '',
    location: '',
    state: '',
    country: 'India',
    costPerTap: 0.50,
    machineCost: 100,
    status: 'active',
    razorpayKeyId: '',
    razorpayKeySecret: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all machines - using correct endpoint /admin/machine/data
      const machinesResponse = await axiosInstance.get('/admin/machine/data', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const machinesData = machinesResponse.data;
      setMachines(Array.isArray(machinesData) ? machinesData : []);

      // Fetch all users - using correct endpoint /admin/users
      const usersResponse = await axiosInstance.get('/admin/users', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUsers(usersResponse.data || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMachine = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axiosInstance.post('/admin/machine', formData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (response.status === 201) {
        setMessage({ type: 'success', text: 'Machine created successfully!' });
        setTimeout(() => {
          setShowCreateModal(false);
          fetchData();
          resetForm();
        }, 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create machine' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMachine = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Note: You'll need to add this PUT endpoint to your backend
      const response = await axiosInstance.put(`/admin/machine/${selectedMachine._id}`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (response.status === 200) {
        setMessage({ type: 'success', text: 'Machine updated successfully!' });
        setTimeout(() => {
          setShowEditModal(false);
          fetchData();
        }, 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update machine' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMachine = async () => {
    if (!selectedMachine || !selectedUser) return;
    
    setLoading(true);
    try {
      const currentMachineIds = selectedUser.assignedMachines?.map(m => m._id || m) || [];
      const newMachineIds = [...currentMachineIds, selectedMachine._id];

      const response = await axiosInstance.put(
        `/admin/user/${selectedUser._id}`,
        { assignedMachineIds: newMachineIds },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.status === 200) {
        setMessage({ type: 'success', text: `Machine assigned to ${selectedUser.name} successfully!` });
        setTimeout(() => {
          setShowAssignModal(false);
          setSelectedMachine(null);
          setSelectedUser(null);
          fetchData();
        }, 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to assign machine' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignMachine = async (machineId, userId) => {
    if (!confirm('Remove this machine from the user?')) return;

    setLoading(true);
    try {
      const user = users.find(u => u._id === userId);
      const currentMachineIds = user.assignedMachines?.map(m => m._id || m) || [];
      const newMachineIds = currentMachineIds.filter(id => id !== machineId);

      const response = await axiosInstance.put(
        `/admin/user/${userId}`,
        { assignedMachineIds: newMachineIds },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.status === 200) {
        setMessage({ type: 'success', text: 'Machine unassigned successfully!' });
        fetchData();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to unassign machine' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      machineId: '',
      location: '',
      state: '',
      country: 'India',
      costPerTap: 0.50,
      machineCost: 100,
      status: 'active',
      razorpayKeyId: '',
      razorpayKeySecret: ''
    });
  };

  const openEditModal = (machine) => {
    setSelectedMachine(machine);
    setFormData({
      machineId: machine.machineId,
      location: machine.location,
      state: machine.state || '',
      country: machine.country || 'India',
      costPerTap: machine.costPerTap,
      machineCost: machine.machineCost || 100,
      status: machine.status || 'active',
      razorpayKeyId: machine.razorpayKeyId || '',
      razorpayKeySecret: machine.razorpayKeySecret || ''
    });
    setShowEditModal(true);
  };

  const getAssignedCustomer = (machine) => {
    if (!machine.assignedTo) return null;
    return users.find(u => u._id === machine.assignedTo);
  };

  const getDealership = (machine) => {
    if (!machine.dealership) return null;
    return users.find(u => u._id === machine.dealership);
  };

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.machineId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          machine.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || machine.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <Loading />;

  return (
    <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Machine Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all machines, assignments, and track performance</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <FiPlus /> Add Machine
        </button>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Machine ID or Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Total Machines</p>
          <p className="text-2xl font-bold text-gray-800">{machines.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Active Machines</p>
          <p className="text-2xl font-bold text-green-600">
            {machines.filter(m => m.status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Assigned Machines</p>
          <p className="text-2xl font-bold text-blue-600">
            {machines.filter(m => m.assignedTo).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Total Taps</p>
          <p className="text-2xl font-bold text-purple-600">
            {machines.reduce((sum, m) => sum + (m.totalTaps || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Total Revenue</p>
          <p className="text-2xl font-bold text-orange-600">
            ₹{(machines.reduce((sum, m) => sum + ((m.totalTaps || 0) * (m.costPerTap || 0)), 0)).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Machines Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-bold text-gray-500">Machine ID</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500">Location</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500">Financials</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500">Performance</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500">Assigned To</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500">Dealership</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMachines.map((machine) => {
                const customer = getAssignedCustomer(machine);
                const dealership = getDealership(machine);
                const totalRevenue = (machine.totalTaps || 0) * (machine.costPerTap || 0);

                return (
                  <tr key={machine._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FiCpu className="text-blue-500" />
                        <span className="font-mono font-medium">{machine.machineId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{machine.location}</p>
                        <p className="text-xs text-gray-500">{machine.state}, {machine.country}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-xs flex justify-between">
                          <span className="text-gray-500">Cost/Tap:</span>
                          <span className="font-bold text-blue-600">₹{machine.costPerTap?.toFixed(2)}</span>
                        </p>
                        <p className="text-xs flex justify-between">
                          <span className="text-gray-500">Machine Cost:</span>
                          <span className="font-bold">₹{(machine.machineCost || 0).toLocaleString()}</span>
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-xs flex justify-between">
                          <span className="text-gray-500">Total Taps:</span>
                          <span className="font-bold">{(machine.totalTaps || 0).toLocaleString()}</span>
                        </p>
                        <p className="text-xs flex justify-between">
                          <span className="text-gray-500">Revenue:</span>
                          <span className="font-bold text-green-600">₹{totalRevenue.toLocaleString()}</span>
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {customer ? (
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <FiUser size={12} /> {customer.name}
                          </p>
                          <p className="text-xs text-gray-500">{customer.email}</p>
                          <button
                            onClick={() => handleUnassignMachine(machine._id, customer._id)}
                            className="text-xs text-red-500 hover:text-red-700 mt-1"
                          >
                            Unassign
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedMachine(machine);
                            setShowAssignModal(true);
                          }}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100"
                        >
                          Assign
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {dealership ? (
                        <div>
                          <p className="text-sm font-medium">{dealership.name}</p>
                          <p className="text-xs text-gray-500">{dealership.role}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
                        machine.status === 'active' ? 'bg-green-100 text-green-700' :
                        machine.status === 'inactive' ? 'bg-gray-100 text-gray-500' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          machine.status === 'active' ? 'bg-green-500' :
                          machine.status === 'inactive' ? 'bg-gray-400' :
                          'bg-yellow-500'
                        }`} />
                        {machine.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedMachine(machine);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(machine)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Edit Machine"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        {!customer && (
                          <button
                            onClick={() => {
                              setSelectedMachine(machine);
                              setShowAssignModal(true);
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Assign"
                          >
                            <FiUser size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredMachines.length === 0 && (
          <div className="text-center py-12">
            <FiCpu className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No machines found</p>
          </div>
        )}
      </div>

      {/* Create Machine Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Create New Machine</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMachine} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Machine ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.machineId}
                    onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="MAC-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="City name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Tap (₹)</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={formData.costPerTap}
                    onChange={(e) => setFormData({ ...formData, costPerTap: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Machine Cost (₹)</label>
                  <input
                    type="number"
                    step="1000"
                    value={formData.machineCost}
                    onChange={(e) => setFormData({ ...formData, machineCost: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Key ID (Optional)</label>
                  <input
                    type="text"
                    value={formData.razorpayKeyId}
                    onChange={(e) => setFormData({ ...formData, razorpayKeyId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="rzp_live_..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Key Secret (Optional)</label>
                  <input
                    type="password"
                    value={formData.razorpayKeySecret}
                    onChange={(e) => setFormData({ ...formData, razorpayKeySecret: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Machine Modal */}
      {showEditModal && selectedMachine && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Edit Machine: {selectedMachine.machineId}</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateMachine} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Machine ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.machineId}
                    onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Tap (₹)</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={formData.costPerTap}
                    onChange={(e) => setFormData({ ...formData, costPerTap: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Machine Cost (₹)</label>
                  <input
                    type="number"
                    step="1000"
                    value={formData.machineCost}
                    onChange={(e) => setFormData({ ...formData, machineCost: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Key ID (Optional)</label>
                  <input
                    type="text"
                    value={formData.razorpayKeyId}
                    onChange={(e) => setFormData({ ...formData, razorpayKeyId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="rzp_live_..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Key Secret (Optional)</label>
                  <input
                    type="password"
                    value={formData.razorpayKeySecret}
                    onChange={(e) => setFormData({ ...formData, razorpayKeySecret: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Machine Details Modal */}
      {showDetailsModal && selectedMachine && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FiCpu className="text-blue-600" /> Machine Details: {selectedMachine.machineId}
              </h2>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FiInfo className="text-blue-600" /> Basic Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Machine ID:</span> <strong>{selectedMachine.machineId}</strong></p>
                    <p><span className="text-gray-500">Status:</span> 
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                        selectedMachine.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {selectedMachine.status}
                      </span>
                    </p>
                    <p><span className="text-gray-500">Created:</span> {new Date(selectedMachine.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FiMapPin className="text-green-600" /> Location Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Location:</span> {selectedMachine.location}</p>
                    <p><span className="text-gray-500">State:</span> {selectedMachine.state}</p>
                    <p><span className="text-gray-500">Country:</span> {selectedMachine.country}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FiDollarSign className="text-yellow-600" /> Financial Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Cost Per Tap:</span> ₹{selectedMachine.costPerTap?.toFixed(2)}</p>
                    <p><span className="text-gray-500">Machine Cost:</span> ₹{(selectedMachine.machineCost || 0).toLocaleString()}</p>
                    <p><span className="text-gray-500">Total Taps:</span> {(selectedMachine.totalTaps || 0).toLocaleString()}</p>
                    <p><span className="text-gray-500">Total Revenue:</span> ₹{((selectedMachine.totalTaps || 0) * (selectedMachine.costPerTap || 0)).toLocaleString()}</p>
                    <p><span className="text-gray-500">Razorpay Key ID:</span> <span className="font-mono text-xs">{selectedMachine.razorpayKeyId || 'Not set'}</span></p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FiUser className="text-purple-600" /> Assignment Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Assigned To:</span> {getAssignedCustomer(selectedMachine)?.name || 'Not assigned'}</p>
                    <p><span className="text-gray-500">Dealership:</span> {getDealership(selectedMachine)?.name || 'Not assigned'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowDetailsModal(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Close
                </button>
                <button onClick={() => {
                  setShowDetailsModal(false);
                  openEditModal(selectedMachine);
                }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Edit Machine
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Machine Modal */}
      {showAssignModal && selectedMachine && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-5 border-b">
              <h2 className="text-xl font-bold">Assign Machine</h2>
              <p className="text-sm text-gray-500 mt-1">Assign {selectedMachine.machineId} to a customer</p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
              <select
                value={selectedUser?._id || ''}
                onChange={(e) => {
                  const user = users.find(u => u._id === e.target.value);
                  setSelectedUser(user);
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a customer...</option>
                {users.filter(u => u.role === 'customer').map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>

              {selectedUser && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium">Customer Details:</p>
                  <p className="text-xs text-gray-600 mt-1">Name: {selectedUser.name}</p>
                  <p className="text-xs text-gray-600">Email: {selectedUser.email}</p>
                  <p className="text-xs text-gray-600">Phone: {selectedUser.phoneNumber}</p>
                  <p className="text-xs text-gray-600">Location: {selectedUser.state}</p>
                </div>
              )}

              <div className="flex gap-3 pt-6 mt-6 border-t">
                <button onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={handleAssignMachine}
                  disabled={!selectedUser || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign Machine'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineManagement;