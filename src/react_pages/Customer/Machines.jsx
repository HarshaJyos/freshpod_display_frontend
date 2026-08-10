// src/Pages/Customer/Machines.jsx - Fixed profit calculation
import React, { useContext, useState, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config_portal/axios';
import Loading from "../loading.jsx";
import { 
  FiCpu, FiMapPin, FiEdit2, FiSave, FiX, FiEye, 
  FiDollarSign, FiTrendingUp, FiAlertCircle, FiInfo,
  FiRefreshCw
} from 'react-icons/fi';

const CustomerMachines = () => {
  const { machines, loading, refetch } = useContext(DataContext);
  const { user, accessToken } = useAuth();
  const [editingField, setEditingField] = useState({ machineId: null, field: null });
  const [editValue, setEditValue] = useState('');
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [machineList, setMachineList] = useState([]);

  // Fetch machines with settings
  const fetchMachines = async () => {
    try {
      const response = await axiosInstance.get('/customer/machines', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      // Process machines to add calculated fields
      const processedMachines = response.data.map(machine => {
        // CORRECT FORMULA: Revenue = Taps × Cost Per Tap
        const monthlyRevenue = (machine.monthlyTaps || 0) * (machine.costPerTap || 0);
        const totalRevenue = (machine.totalTaps || 0) * (machine.costPerTap || 0);
        
        // CORRECT FORMULA: Net Profit = Revenue - Rent - Maintenance
        const monthlyExpenses = (machine.rentPerMonth || 0) + (machine.maintenanceCostPerMonth || 0);
        const monthlyNetProfit = monthlyRevenue - monthlyExpenses;
        const totalNetProfit = totalRevenue - monthlyExpenses;
        
        // Profit Margin = (Net Profit ÷ Revenue) × 100
        const monthlyProfitMargin = monthlyRevenue > 0 ? (monthlyNetProfit / monthlyRevenue) * 100 : 0;
        
        return {
          ...machine,
          monthlyRevenue,
          totalRevenue,
          monthlyExpenses,
          monthlyNetProfit,
          totalNetProfit,
          monthlyProfitMargin
        };
      });
      
      setMachineList(processedMachines);
    } catch (error) {
      console.error('Failed to fetch machines:', error);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchMachines();
    }
  }, [accessToken, machines]);

  const handleSaveField = async (machineId, field, value) => {
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      alert(`Please enter a valid ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      return;
    }

    setUpdating(true);
    try {
      let endpoint = '';
      let payload = {};
      
      switch(field) {
        case 'costPerTap':
          endpoint = `/customer/machine/${machineId}/cost`;
          payload = { costPerTap: parsedValue };
          break;
        case 'rentPerMonth':
          endpoint = `/customer/machine/${machineId}/rent`;
          payload = { rentPerMonth: parsedValue };
          break;
        case 'maintenanceCostPerMonth':
          endpoint = `/customer/machine/${machineId}/maintenance`;
          payload = { maintenanceCostPerMonth: parsedValue };
          break;
        default:
          endpoint = `/customer/machine/${machineId}/settings`;
          payload = { [field]: parsedValue };
      }
      
      const response = await axiosInstance.put(endpoint, payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.data.success || response.status === 200) {
        await fetchMachines(); // Refresh the list
        alert(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} updated successfully!`);
      }
      
      setEditingField({ machineId: null, field: null });
    } catch (error) {
      console.error('Failed to update:', error);
      alert(error.response?.data?.message || `Failed to update ${field}`);
    } finally {
      setUpdating(false);
    }
  };

  const startEditing = (machineId, field, currentValue) => {
    setEditingField({ machineId, field });
    setEditValue(currentValue.toString());
  };

  if (loading) return <Loading />;

  // Calculate summary stats
  const totalMonthlyRevenue = machineList.reduce((acc, m) => acc + ((m.monthlyTaps || 0) * (m.costPerTap || 0)), 0);
  const totalMonthlyExpenses = machineList.reduce((acc, m) => acc + (m.rentPerMonth || 0) + (m.maintenanceCostPerMonth || 0), 0);
  const totalNetProfit = totalMonthlyRevenue - totalMonthlyExpenses;

  return (
    <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Machines</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your machines and track profitability</p>
        </div>
        <button 
          onClick={fetchMachines}
          className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          <FiRefreshCw size={16} />
        </button>
      </div>

      {/* Summary Stats */}
      {machineList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-[10px] font-bold uppercase">Total Machines</p>
            <p className="text-2xl font-bold text-gray-800">{machineList.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-[10px] font-bold uppercase">Monthly Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{Math.round(totalMonthlyRevenue).toLocaleString()}
            </p>
            <p className="text-[9px] text-gray-400 mt-1">Taps × Cost/Tap</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-[10px] font-bold uppercase">Monthly Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              ₹{Math.round(totalMonthlyExpenses).toLocaleString()}
            </p>
            <p className="text-[9px] text-gray-400 mt-1">Rent + Maintenance</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-[10px] font-bold uppercase">Net Profit</p>
            <p className={`text-2xl font-bold ${totalNetProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ₹{Math.round(totalNetProfit).toLocaleString()}
            </p>
            <p className="text-[9px] text-gray-400 mt-1">Revenue - Expenses</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machineList.map((machine) => {
          // Calculate current month profitability
          const monthlyRevenue = (machine.monthlyTaps || 0) * (machine.costPerTap || 0);
          const monthlyExpenses = (machine.rentPerMonth || 0) + (machine.maintenanceCostPerMonth || 0);
          const monthlyNetProfit = monthlyRevenue - monthlyExpenses;
          const isProfitable = monthlyNetProfit > 0;
          
          // Calculate lifetime profitability
          const totalRevenue = (machine.totalTaps || 0) * (machine.costPerTap || 0);
          const totalNetProfit = totalRevenue - monthlyExpenses;
          
          return (
            <div key={machine._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
              {/* Profit/Loss Indicator Bar */}
              <div className={`h-1 w-full ${isProfitable ? 'bg-green-500' : monthlyNetProfit < 0 ? 'bg-red-500' : 'bg-gray-400'}`} />
              
              <div className="p-5">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{machine.machineId}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <FiMapPin size={12} /> {machine.location || 'N/A'}, {machine.state}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[9px] font-bold ${
                    machine.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {machine.status || 'Active'}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500">Total Taps</p>
                    <p className="text-sm font-bold text-gray-800">{(machine.totalTaps || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500">This Month</p>
                    <p className="text-sm font-bold text-blue-600">{(machine.monthlyTaps || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500">Cost/Tap</p>
                    {editingField.machineId === machine._id && editingField.field === 'costPerTap' ? (
                      <div className="flex items-center justify-center gap-1">
                        <input 
                          type="number" 
                          value={editValue} 
                          onChange={(e) => setEditValue(e.target.value)} 
                          className="w-16 px-1 py-0.5 border rounded text-sm text-center" 
                          step="0.10" 
                          min="0"
                          disabled={updating}
                        />
                        <button onClick={() => handleSaveField(machine._id, 'costPerTap', editValue)} className="text-green-600" disabled={updating}>
                          <FiSave size={14} />
                        </button>
                        <button onClick={() => setEditingField({ machineId: null, field: null })} className="text-red-600">
                          <FiX size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-blue-600">₹{(machine.costPerTap || 0).toFixed(2)}</span>
                        <button onClick={() => startEditing(machine._id, 'costPerTap', machine.costPerTap || 0)} className="text-gray-400 hover:text-blue-600">
                          <FiEdit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500">Rent/Month</p>
                    {editingField.machineId === machine._id && editingField.field === 'rentPerMonth' ? (
                      <div className="flex items-center justify-center gap-1">
                        <input 
                          type="number" 
                          value={editValue} 
                          onChange={(e) => setEditValue(e.target.value)} 
                          className="w-20 px-1 py-0.5 border rounded text-sm text-center" 
                          step="100" 
                          min="0"
                          disabled={updating}
                        />
                        <button onClick={() => handleSaveField(machine._id, 'rentPerMonth', editValue)} className="text-green-600" disabled={updating}>
                          <FiSave size={14} />
                        </button>
                        <button onClick={() => setEditingField({ machineId: null, field: null })} className="text-red-600">
                          <FiX size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-orange-600">₹{(machine.rentPerMonth || 0).toLocaleString()}</span>
                        <button onClick={() => startEditing(machine._id, 'rentPerMonth', machine.rentPerMonth || 0)} className="text-gray-400 hover:text-blue-600">
                          <FiEdit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profitability Breakdown */}
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <p className="text-[10px] font-bold text-blue-700 uppercase mb-2">Revenue Calculation</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Taps:</span>
                      <span className="font-bold">{(machine.monthlyTaps || 0).toLocaleString()} × ₹{(machine.costPerTap || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Revenue:</span>
                      <span className="font-bold text-green-600">₹{monthlyRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Expenses:</span>
                      <span className="text-red-600">- ₹{monthlyExpenses.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-blue-200 pt-1 mt-1">
                      <div className="flex justify-between">
                        <span className="font-bold">Net Profit:</span>
                        <span className={`font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{monthlyNetProfit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profitability Card */}
                

                {/* Break-even Analysis */}
                <div className="bg-gray-50 rounded-lg p-2 mb-4">
                  <p className="text-[9px] text-gray-500 font-bold mb-1">BREAK-EVEN ANALYSIS</p>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-600">Break-even taps:</span>
                    <span className="font-bold">
                      {Math.ceil(((machine.rentPerMonth || 0) + (machine.maintenanceCostPerMonth || 0)) / (machine.costPerTap || 0.5))} taps/month
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] mt-0.5">
                    <span className="text-gray-600">Current taps:</span>
                    <span className={`font-bold ${(machine.monthlyTaps || 0) >= Math.ceil(((machine.rentPerMonth || 0) + (machine.maintenanceCostPerMonth || 0)) / (machine.costPerTap || 0.5)) ? 'text-green-600' : 'text-red-600'}`}>
                      {(machine.monthlyTaps || 0).toLocaleString()} taps
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] mt-0.5">
                    <span className="text-gray-600">Daily target:</span>
                    <span className="font-bold">
                      {Math.ceil(((machine.rentPerMonth || 0) + (machine.maintenanceCostPerMonth || 0)) / (machine.costPerTap || 0.5) / 30)} taps/day
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedMachine({...machine, monthlyRevenue, monthlyExpenses, monthlyNetProfit, totalRevenue, totalNetProfit})} 
                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <FiEye size={12} /> View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {machineList.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <FiCpu className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No machines assigned to you yet</p>
          <p className="text-sm text-gray-400 mt-1">Contact your dealership to get machines assigned</p>
        </div>
      )}

      {/* Machine Detail Modal */}
      {selectedMachine && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSelectedMachine(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FiCpu className="text-blue-600 text-xl" />
                <h2 className="text-xl font-bold text-gray-900">{selectedMachine.machineId}</h2>
              </div>
              <button onClick={() => setSelectedMachine(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-800 mb-3">Machine Details</h3>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Location</span>
                    <span className="text-sm">{selectedMachine.location || 'N/A'}, {selectedMachine.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Status</span>
                    <span className="text-sm font-medium text-green-600">{selectedMachine.status || 'Active'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Total Lifetime Taps</span>
                    <span className="text-sm font-bold">{(selectedMachine.totalTaps || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">This Month Taps</span>
                    <span className="text-sm font-bold">{(selectedMachine.monthlyTaps || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-gray-800 mb-3">Financial Settings</h3>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Cost Per Tap</span>
                    <span className="text-sm font-bold text-blue-600">₹{(selectedMachine.costPerTap || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Monthly Rent</span>
                    <span className="text-sm font-bold text-orange-600">₹{(selectedMachine.rentPerMonth || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Monthly Maintenance</span>
                    <span className="text-sm font-bold text-purple-600">₹{(selectedMachine.maintenanceCostPerMonth || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Monthly Profit & Loss Statement */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-gray-800 mb-3 text-center">Monthly Profit & Loss Statement</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Revenue (Taps × Cost/Tap)</span>
                    <span className="text-sm font-bold text-green-600">
                      ₹{((selectedMachine.monthlyTaps || 0) * (selectedMachine.costPerTap || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pl-4">
                    <span className="text-xs text-gray-500">- Rent</span>
                    <span className="text-xs text-red-600">₹{(selectedMachine.rentPerMonth || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pl-4">
                    <span className="text-xs text-gray-500">- Maintenance</span>
                    <span className="text-xs text-red-600">₹{(selectedMachine.maintenanceCostPerMonth || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-gray-200">
                    <span className="text-sm font-bold text-gray-800">= Net Profit</span>
                    <span className={`text-lg font-bold ${((selectedMachine.monthlyTaps || 0) * (selectedMachine.costPerTap || 0) - (selectedMachine.rentPerMonth || 0) - (selectedMachine.maintenanceCostPerMonth || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{((selectedMachine.monthlyTaps || 0) * (selectedMachine.costPerTap || 0) - (selectedMachine.rentPerMonth || 0) - (selectedMachine.maintenanceCostPerMonth || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lifetime Profit & Loss */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-gray-800 mb-3 text-center text-sm">Lifetime Performance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Total Revenue:</span>
                    <span className="text-sm font-bold text-green-600">
                      ₹{((selectedMachine.totalTaps || 0) * (selectedMachine.costPerTap || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Total Expenses (Monthly):</span>
                    <span className="text-sm text-red-600">₹{((selectedMachine.rentPerMonth || 0) + (selectedMachine.maintenanceCostPerMonth || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                    <span className="text-xs font-bold">Lifetime Net Profit:</span>
                    <span className={`text-sm font-bold ${((selectedMachine.totalTaps || 0) * (selectedMachine.costPerTap || 0) - (selectedMachine.rentPerMonth || 0) - (selectedMachine.maintenanceCostPerMonth || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{((selectedMachine.totalTaps || 0) * (selectedMachine.costPerTap || 0) - (selectedMachine.rentPerMonth || 0) - (selectedMachine.maintenanceCostPerMonth || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiInfo className="text-blue-600" />
                  <h3 className="font-bold text-blue-800 text-sm">Profitability Insights</h3>
                </div>
                <div className="space-y-2 text-xs text-blue-700">
                  <p>• <strong>Formula:</strong> (Taps × Cost/Tap) - Rent - Maintenance = Net Profit</p>
                  <p>• Current month taps: {(selectedMachine.monthlyTaps || 0).toLocaleString()}</p>
                  <p>• Break-even: Need {Math.ceil(((selectedMachine.rentPerMonth || 0) + (selectedMachine.maintenanceCostPerMonth || 0)) / (selectedMachine.costPerTap || 0.50))} taps/month</p>
                  <p>• Daily target: {Math.ceil(((selectedMachine.rentPerMonth || 0) + (selectedMachine.maintenanceCostPerMonth || 0)) / (selectedMachine.costPerTap || 0.50) / 30)} taps/day</p>
                  <p className={`font-bold ${((selectedMachine.monthlyTaps || 0) * (selectedMachine.costPerTap || 0) - (selectedMachine.rentPerMonth || 0) - (selectedMachine.maintenanceCostPerMonth || 0)) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    • Current status: {((selectedMachine.monthlyTaps || 0) * (selectedMachine.costPerTap || 0) - (selectedMachine.rentPerMonth || 0) - (selectedMachine.maintenanceCostPerMonth || 0)) >= 0 ? '✅ Profitable' : '⚠️ Operating at loss'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMachines;