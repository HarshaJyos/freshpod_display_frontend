// src/Pages/Dealership/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config_portal/axios';
import Loading from "../loading.jsx";
import { 
  FiShoppingCart, FiDollarSign, FiTrendingUp, FiUsers, 
  FiCpu, FiCalendar, FiBarChart2, FiActivity, FiAward 
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

const DealershipDashboard = () => {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    totalMachines: 0, 
    soldMachines: 0, 
    availableMachines: 0, 
    totalProfit: 0,
    profitPerMachine: 40000
  });
  const [analytics, setAnalytics] = useState({ salesTrend: [] });

  useEffect(() => { 
    fetchData(); 
    fetchAnalytics();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axiosInstance.get('/dealership/dashboard', { 
        headers: { Authorization: `Bearer ${accessToken}` } 
      });
      console.log("Dashboard data:", response.data);
      
      // Handle both possible response formats
      setStats({
        totalMachines: response.data.totalMachines || 0,
        soldMachines: response.data.soldMachines || 0,
        availableMachines: response.data.availableMachines || 0,
        totalProfit: response.data.totalProfit || response.data.totalRevenue || 0,
        profitPerMachine: response.data.profitPerMachine || 40000
      });
      setLoading(false);
    } catch (error) { 
      console.error("Error fetching dashboard:", error); 
      setLoading(false); 
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axiosInstance.get('/dealership/analytics', { 
        headers: { Authorization: `Bearer ${accessToken}` } 
      });
      console.log("Analytics data:", response.data);
      setAnalytics(response.data);
    } catch (error) { 
      console.error("Error fetching analytics:", error); 
    }
  };

  if (loading) return <Loading />;
  
  return (
    <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dealership Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name || 'Dealer'}</p>
        </div>
        <div className="bg-white border px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm">
          <FiCalendar /> {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Total Machines</p>
          <p className="text-2xl font-bold text-gray-800">{stats.totalMachines || 0}</p>
          <div className="mt-2 text-[10px] text-gray-500">In your inventory</div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Machines Sold</p>
          <p className="text-2xl font-bold text-green-600">{stats.soldMachines || 0}</p>
          <div className="mt-2 text-[10px] text-gray-500">Assigned to customers</div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Available Stock</p>
          <p className="text-2xl font-bold text-blue-600">{stats.availableMachines || 0}</p>
          <div className="mt-2 text-[10px] text-gray-500">Ready for sale</div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Total Profit</p>
          <p className="text-2xl font-bold text-purple-600">
            ₹{((stats.totalProfit || 0)/1000).toFixed(1)}k
          </p>
          <div className="mt-2 text-[10px] text-gray-500">
            ₹{(stats.profitPerMachine || 40000).toLocaleString()} per machine
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white">
          <FiShoppingCart className="text-2xl mb-2 opacity-80" />
          <p className="text-xs opacity-80">Machines Sold</p>
          <p className="text-2xl font-bold mt-1">{stats.soldMachines || 0}</p>
          <p className="text-[10px] opacity-80 mt-1">Out of {stats.totalMachines || 0} total</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-xl text-white">
          <FiUsers className="text-2xl mb-2 opacity-80" />
          <p className="text-xs opacity-80">Customers Served</p>
          <p className="text-2xl font-bold mt-1">{stats.soldMachines || 0}</p>
          <p className="text-[10px] opacity-80 mt-1">Unique customers</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-xl text-white">
          <FiAward className="text-2xl mb-2 opacity-80" />
          <p className="text-xs opacity-80">Profit per Machine</p>
          <p className="text-2xl font-bold mt-1">₹{(stats.profitPerMachine || 40000).toLocaleString()}</p>
          <p className="text-[10px] opacity-80 mt-1">On each sale</p>
        </div>
      </div>

      {/* Sales Chart */}
      {analytics.salesTrend && analytics.salesTrend.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FiBarChart2 className="text-blue-600" /> Monthly Sales Performance
            </h3>
            <span className="text-xs text-gray-500">
              Total Profit: ₹{((analytics.totalProfit || 0)/1000).toFixed(1)}k
            </span>
          </div>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="sales" fill="#3b82f6" name="Units Sold" />
                <Bar yAxisId="right" dataKey="profit" fill="#10b981" name="Profit (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 text-center">
          <FiBarChart2 className="text-4xl text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No sales data available yet</p>
          <p className="text-sm text-gray-400">Start selling machines to see your sales performance</p>
        </div>
      )}

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FiActivity className="text-purple-600" /> Sales Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Machines in Stock</span>
              <span className="text-lg font-bold text-blue-600">{stats.totalMachines || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Machines Sold</span>
              <span className="text-lg font-bold text-green-600">{stats.soldMachines || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Machines Available</span>
              <span className="text-lg font-bold text-orange-600">{stats.availableMachines || 0}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-sm font-bold text-gray-700">Total Profit Earned</span>
              <span className="text-xl font-bold text-purple-600">
                ₹{((stats.totalProfit || 0)/1000).toFixed(1)}k
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FiTrendingUp className="text-green-600" /> Quick Actions
          </h3>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/dealership/machines'}
              className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              View All Machines →
            </button>
            <button 
              onClick={() => window.location.href = '/dealership/users'}
              className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
            >
              Add New Customer →
            </button>
            <button 
              onClick={() => window.location.href = '/dealership/analytics'}
              className="w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
            >
              View Sales Report →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealershipDashboard;