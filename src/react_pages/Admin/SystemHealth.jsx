import React, { useContext, useMemo } from 'react';
import { DataContext } from '../../context/DataContext';
import Loading from "../loading.jsx";
import { FiActivity, FiServer, FiWifi, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const SystemHealth = () => {
  const { machines, loading } = useContext(DataContext);

  const healthData = useMemo(() => {
    if (!machines) return [];
    return Object.entries(machines).map(([id, m]) => ({
      id,
      status: m.status || 'offline',
      lastHeartbeat: m.lastHeartbeat,
      latency: Math.floor(Math.random() * (150 - 20) + 20) + "ms" // Mocked technical metric
    }));
  }, [machines]);

  if (loading) return <Loading />;

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-sm text-gray-500 font-medium">Technical uptime and network latency</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase">Server Status</p>
            <p className="text-xs font-bold text-green-600 flex items-center gap-1 justify-end">
              <FiCheckCircle /> Operational
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Overview */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-1">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FiActivity className="text-red-500" /> Pulse Monitor
          </h3>
          <div className="space-y-4">
            {healthData.slice(0, 5).map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-black text-gray-700">{m.id}</span>
                <span className="text-[10px] font-bold text-blue-500">{m.latency}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Connectivity Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-gray-50 bg-gray-50/50">
             <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FiWifi className="text-green-500" /> Connectivity Registry
            </h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase text-gray-400 font-bold border-b border-gray-50">
                <th className="px-6 py-4">Node ID</th>
                <th className="px-6 py-4">Pulse Status</th>
                <th className="px-6 py-4">Last Sync</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {healthData.map((node) => (
                <tr key={node.id}>
                  <td className="px-6 py-4 text-xs font-black text-gray-800">{node.id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                      node.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {node.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-gray-500">
                    {node.lastHeartbeat || 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:underline text-[10px] font-black uppercase">Ping</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;