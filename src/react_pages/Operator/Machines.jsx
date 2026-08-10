// Pages/Operator/Machines.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config_portal/axios';
import { FiShield, FiMapPin, FiActivity } from 'react-icons/fi';

const OperatorMachines = () => {
  const { accessToken } = useAuth();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await axiosInstance.get('/operator/machines', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setMachines(response.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading machines...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Machines</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines.map(machine => (
          <div key={machine._id} className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-3 mb-3">
              <FiShield className="text-blue-600 text-2xl" />
              <h3 className="font-bold text-lg">{machine.machineId}</h3>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
              <FiMapPin size={14} /> {machine.location}
            </p>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              <div>
                <p className="text-xs text-gray-500">Today's Cycles</p>
                <p className="font-bold">{machine.todaysCycles || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Price/Cycle</p>
                <p className="font-bold text-blue-600">₹{machine.costPerCycle || machine.costPerTap || 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperatorMachines;