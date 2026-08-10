// Pages/Operator/History.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config_portal/axios';
import { FiClock, FiShield } from 'react-icons/fi';

const OperatorHistory = () => {
  const { accessToken } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await axiosInstance.get('/operator/machines', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setMachines(response.data);
      if (response.data.length > 0) {
        setSelectedMachine(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const fetchHistory = async (machineId) => {
    if (!machineId) return;
    
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/operator/machine/${machineId}/history`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMachine) {
      fetchHistory(selectedMachine);
    }
  }, [selectedMachine]);

  if (loading && machines.length === 0) {
    return <div className="p-6 text-center">Loading machines...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Disinfection History</h1>
      
      {/* Machine Selector */}
      {machines.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Machine
          </label>
          <select
            value={selectedMachine || ''}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {machines.map((machine) => (
              <option key={machine._id} value={machine._id}>
                {machine.machineId} - {machine.location}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* History Display */}
      {loading ? (
        <div className="p-6 text-center">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <FiClock className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No disinfection history found for this machine</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cycles</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue (₹)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((record, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 text-sm">{record.date}</td>
                  <td className="px-6 py-4 text-sm">
                    {record.time ? new Date(record.time).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">{record.cycles}</td>
                  <td className="px-6 py-4 text-sm">{record.revenue?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.status === 'completed' ? 'bg-green-100 text-green-800' :
                      record.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status || record.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OperatorHistory;