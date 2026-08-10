// src/Pages/Dealership/Machines.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config_portal/axios';
import Loading from "../loading.jsx";
import { FiCpu, FiPlus, FiSearch, FiCheckCircle, FiClock } from 'react-icons/fi';

const DealershipMachines = () => {
  const { accessToken } = useAuth();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchMachines(); }, []);
  const fetchMachines = async () => {
    try {
      const response = await axiosInstance.get('/dealership/machines', { headers: { Authorization: `Bearer ${accessToken}` } });
      setMachines(response.data.machines || []);
      setLoading(false);
    } catch (error) { console.error(error); setLoading(false); }
  };

  const filteredMachines = machines.filter(m => m.machineId.toLowerCase().includes(searchTerm.toLowerCase()) || m.location.toLowerCase().includes(searchTerm.toLowerCase()));
  if (loading) return <Loading />;

  return (
    <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-gray-900">My Machines</h1></div>
      <div className="bg-white rounded-xl p-4 mb-6"><div className="relative"><FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search machines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" /></div></div>
      <div className="bg-white rounded-2xl overflow-hidden"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-4 text-left text-xs font-bold">Machine ID</th><th className="px-6 py-4 text-left text-xs font-bold">Location</th><th className="px-6 py-4 text-left text-xs font-bold">Cost Price</th><th className="px-6 py-4 text-left text-xs font-bold">Status</th><th className="px-6 py-4 text-left text-xs font-bold">Date</th></tr></thead><tbody>{filteredMachines.map(m => (<tr key={m._id} className="border-t"><td className="px-6 py-4 text-sm font-mono font-bold">{m.machineId}</td><td className="px-6 py-4 text-sm">{m.location}</td><td className="px-6 py-4 text-sm">₹{m.machineCost?.toLocaleString() || 0}</td><td className="px-6 py-4"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${m.assignedTo ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{m.assignedTo ? <FiCheckCircle size={10} /> : <FiClock size={10} />}{m.assignedTo ? 'Sold' : 'Available'}</span></td><td className="px-6 py-4 text-xs">{new Date(m.createdAt).toLocaleDateString()}</td></tr>))}</tbody></table></div>
    </div>
  );
};

export default DealershipMachines;