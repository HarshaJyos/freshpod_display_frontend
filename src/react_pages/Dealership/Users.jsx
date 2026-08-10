// Pages/Dealership/Users.jsx - Enhanced Version
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config_portal/axios';
import Loading from "../loading.jsx";
import { 
  FiUsers, FiUserPlus, FiSearch, FiFilter, 
  FiMail, FiPhone, FiMapPin, FiCpu, FiX,
  FiCheckCircle, FiClock, FiTrash2, FiEdit2,
  FiInfo, FiAlertCircle
} from 'react-icons/fi';

const DealershipUsers = () => {
  const { user, accessToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dealershipInfo, setDealershipInfo] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchMachines();
    fetchDealershipInfo();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/dealership/customers', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUsers(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await axiosInstance.get('/dealership/machines', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const machineList = response.data.machines || [];
      console.log('All dealership machines:', machineList);
      
      // Show only machines where assignedTo is null
      const unassignedMachines = machineList.filter(m => !m.assignedTo);
      console.log('Unassigned machines (available for sale):', unassignedMachines);
      
      setMachines(unassignedMachines);
    } catch (error) {
      console.error('Failed to fetch machines:', error);
    }
  };

  const fetchDealershipInfo = async () => {
    try {
      const response = await axiosInstance.get('/user/profile', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setDealershipInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch dealership info:', error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phoneNumber?.includes(searchTerm)
  );

  // Only show unassigned machines (already filtered in fetchMachines)
  const availableMachines = machines;

  if (loading) return <Loading />;

  return (
    <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Customers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your customer accounts</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <FiUserPlus /> Add Customer
        </button>
      </div>

      {/* Dealership Info Banner */}
      {dealershipInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-blue-700">
          <FiInfo className="text-blue-500" />
          <span>
            Customers will automatically inherit your state (<strong>{dealershipInfo.state}</strong>) and country (<strong>{dealershipInfo.country}</strong>)
          </span>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Total Customers</p>
          <p className="text-2xl font-bold text-gray-800">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Active Customers</p>
          <p className="text-2xl font-bold text-green-600">{users.filter(u => u.isFirstLogin !== true).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Machines Sold</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.reduce((acc, u) => acc + (u.assignedMachines?.length || 0), 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Available Machines</p>
          <p className="text-2xl font-bold text-orange-600">{availableMachines.length}</p>
        </div>
      </div>

      {/* Warning if no available machines */}
      {availableMachines.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <FiAlertCircle className="text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">No machines available for sale</p>
            <p className="text-xs text-yellow-700 mt-1">
              All your machines have been sold. Contact admin to assign more machines to your dealership.
            </p>
          </div>
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((customer) => (
          <div key={customer._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {customer.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{customer.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <FiMapPin size={10} /> {customer.location || 'Location not set'}
                    </p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-[9px] font-bold ${
                  !customer.isFirstLogin ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {!customer.isFirstLogin ? 'Active' : 'First Login Pending'}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-xs text-gray-600 flex items-center gap-2">
                  <FiMail size={12} /> {customer.email}
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-2">
                  <FiPhone size={12} /> {customer.phoneNumber}
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-2">
                  <FiMapPin size={12} /> {customer.state}, {customer.country}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-3 mb-3">
                <p className="text-xs text-gray-500 mb-2">Assigned Machines: {customer.assignedMachines?.length || 0}</p>
                <div className="flex flex-wrap gap-1">
                  {(customer.assignedMachines || []).slice(0, 3).map(machine => {
                    const machineId = typeof machine === 'object' ? machine._id : machine;
                    return (
                      <span key={machineId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px]">
                        <FiCpu size={10} /> {typeof machine === 'object' ? machine.machineId : machineId?.slice(-6)}
                      </span>
                    );
                  })}
                  {(customer.assignedMachines?.length || 0) > 3 && (
                    <span className="text-[10px] text-gray-400">+{(customer.assignedMachines.length - 3)} more</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                  Manage Machines
                </button>
                <button className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <FiEdit2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <FiUsers className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No customers found</p>
          <button onClick={() => setShowAddModal(true)} className="mt-4 text-blue-600 text-sm font-medium hover:text-blue-700">
            Add your first customer →
          </button>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal 
          onClose={() => {
            setShowAddModal(false);
            fetchUsers();
            fetchMachines();
          }} 
          onSuccess={() => {
            fetchUsers();
            fetchMachines();
          }}
          availableMachines={availableMachines}
          dealershipInfo={dealershipInfo}
        />
      )}
    </div>
  );
};

// Add Customer Modal Component
const AddCustomerModal = ({ onClose, onSuccess, availableMachines, dealershipInfo }) => {
  const { accessToken } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    location: '',
    assignedMachineIds: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const response = await axiosInstance.post('/dealership/create-customer', formData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      console.log('Customer created:', response.data);
      alert('Customer added successfully! Default password is their phone number.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to add customer:', error);
      setError(error.response?.data?.message || 'Failed to add customer');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMachine = (machineId) => {
    setFormData(prev => ({
      ...prev,
      assignedMachineIds: prev.assignedMachineIds.includes(machineId)
        ? prev.assignedMachineIds.filter(id => id !== machineId)
        : [...prev.assignedMachineIds, machineId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Add New Customer</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer name"
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
              placeholder="customer@example.com"
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
            <p className="text-[10px] text-gray-400 mt-1">Default password will be this phone number</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="City, Area"
            />
          </div>

          {/* Auto-filled State and Country Info */}
          {dealershipInfo && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-2">Location Details (Auto-filled from dealership):</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">State:</span>
                  <span className="ml-2 font-medium">{dealershipInfo.state}</span>
                </div>
                <div>
                  <span className="text-gray-500">Country:</span>
                  <span className="ml-2 font-medium">{dealershipInfo.country}</span>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Assign Machines 
              <span className="text-xs text-green-600 ml-2">
                ({availableMachines.length} available)
              </span>
            </label>
            <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
              {availableMachines.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No machines available for sale</p>
                  <p className="text-xs text-gray-400 mt-1">All machines are already assigned to customers</p>
                </div>
              ) : (
                availableMachines.map(machine => (
                  <label key={machine._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.assignedMachineIds.includes(machine._id)}
                      onChange={() => toggleMachine(machine._id)}
                      className="rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{machine.machineId}</p>
                      <p className="text-xs text-gray-500">{machine.location}</p>
                    </div>
                    <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Available</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Selected: {formData.assignedMachineIds.length} machine(s)
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            <p className="font-bold mb-1">📝 Important Notes:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Customer's state and country will be automatically set to your dealership's location</li>
              <li>Default password will be the customer's phone number</li>
              <li>Customer must change password on first login</li>
              <li>Selected machines will be assigned to this customer</li>
              <li>Once assigned, machines cannot be reassigned to another customer</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DealershipUsers;