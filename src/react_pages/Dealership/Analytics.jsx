// Pages/Dealership/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config_portal/axios';
import Loading from "../loading.jsx";
import { 
  FiTrendingUp, FiBarChart2, FiDownload, FiCalendar,
  FiDollarSign, FiTarget, FiAward, FiUsers,
  FiShoppingCart, FiActivity, FiPieChart, FiTrendingDown
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";

const DealershipAnalytics = () => {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [machines, setMachines] = useState([]);
  const [timeRange, setTimeRange] = useState('monthly');

  const PROFIT_PER_MACHINE = 40000;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const machinesRes = await axiosInstance.get('/dealership/machines', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setMachines(machinesRes.data.machines || []);
      
      // Process sales data with PROFIT (not revenue)
      const soldMachines = machinesRes.data.machines.filter(m => m.assignedTo);
      const salesByMonth = {};
      const profitByMonth = {};
      
      soldMachines.forEach(machine => {
        const date = new Date(machine.updatedAt || machine.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        if (!salesByMonth[monthKey]) {
          salesByMonth[monthKey] = { month: monthName, sales: 0, profit: 0 };
        }
        salesByMonth[monthKey].sales += 1;
        salesByMonth[monthKey].profit += PROFIT_PER_MACHINE;
      });
      
      const monthlyData = Object.values(salesByMonth).slice(-6);
      setSalesData(monthlyData);
      setProfitData(monthlyData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  };

  // Calculate stats with PROFIT
  const soldMachines = machines.filter(m => m.assignedTo);
  const availableMachines = machines.filter(m => !m.assignedTo);
  const totalProfit = soldMachines.length * PROFIT_PER_MACHINE;
  
  const stats = {
    totalMachines: machines.length,
    soldMachines: soldMachines.length,
    availableMachines: availableMachines.length,
    totalProfit: totalProfit,
    profitPerMachine: PROFIT_PER_MACHINE,
    avgMachineCost: machines.length > 0 ? 
      machines.reduce((acc, m) => acc + (m.machineCost || 0), 0) / machines.length : 0,
    conversionRate: machines.length > 0 ? 
      (soldMachines.length / machines.length) * 100 : 0,
    monthlyAvgSales: salesData.length > 0 ? 
      Math.round(salesData.reduce((acc, m) => acc + m.sales, 0) / salesData.length) : 0,
    projectedAnnualProfit: totalProfit * 1.2 // 20% growth projection
  };

  // Calculate growth trend
  const getGrowthTrend = () => {
    if (salesData.length < 2) return 0;
    const lastMonth = salesData[salesData.length - 1]?.sales || 0;
    const previousMonth = salesData[salesData.length - 2]?.sales || 0;
    if (previousMonth === 0) return lastMonth > 0 ? 100 : 0;
    return ((lastMonth - previousMonth) / previousMonth) * 100;
  };

  const growthTrend = getGrowthTrend();

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) return <Loading />;

  return (
    <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dealership Analytics</h1>
          <p className="text-sm text-gray-500">Track your sales performance and profit margins</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm">
            <FiCalendar /> {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <button className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <FiDownload /> Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Total Machines</p>
          <p className="text-2xl font-bold text-gray-800">{stats.totalMachines}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Sold</p>
          <p className="text-2xl font-bold text-green-600">{stats.soldMachines}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Available</p>
          <p className="text-2xl font-bold text-blue-600">{stats.availableMachines}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Total Profit</p>
          <p className="text-2xl font-bold text-purple-600">₹{(stats.totalProfit/1000).toFixed(1)}k</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Profit/Machine</p>
          <p className="text-2xl font-bold text-orange-600">₹{stats.profitPerMachine.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Conversion Rate</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.conversionRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Growth Alert */}
      <div className={`mb-6 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3 ${
        growthTrend >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          {growthTrend >= 0 ? (
            <FiTrendingUp className="text-green-600 text-xl" />
          ) : (
            <FiTrendingDown className="text-red-600 text-xl" />
          )}
          <div>
            <p className={`text-sm font-medium ${growthTrend >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {growthTrend >= 0 ? '+ ' : ''}{growthTrend.toFixed(1)}% Growth Rate
            </p>
            <p className="text-xs text-gray-500">Compared to previous month</p>
          </div>
        </div>
        <div className="text-sm">
          <span className="font-medium">Projected Annual Profit:</span>
          <span className="ml-2 font-bold text-purple-600">₹{(stats.projectedAnnualProfit/1000).toFixed(1)}k</span>
        </div>
      </div>

      {/* Sales & Profit Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <FiBarChart2 className="text-blue-600" /> Sales & Profit Trends
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeRange('quarterly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === 'quarterly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Quarterly
            </button>
          </div>
        </div>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'profit') return [`₹${value.toLocaleString()}`, 'Profit'];
                  if (name === 'sales') return [value, 'Units Sold'];
                  return [value, name];
                }}
              />
              <Bar yAxisId="left" dataKey="sales" fill="#3B82F6" name="Units Sold" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="profit" fill="#10B981" name="profit" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Units Sold</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Profit (₹)</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Machine Status Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FiPieChart className="text-purple-600" /> Inventory Distribution
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Sold', value: stats.soldMachines, color: '#10B981' },
                    { name: 'Available', value: stats.availableMachines, color: '#3B82F6' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#3B82F6" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {stats.availableMachines} machines available for sale
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Potential profit: ₹{((stats.availableMachines * PROFIT_PER_MACHINE)/1000).toFixed(1)}k
            </p>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-2xl text-white">
            <FiAward className="text-2xl mb-2 opacity-80" />
            <p className="text-xs opacity-80">Average Machine Cost</p>
            <p className="text-2xl font-bold mt-1">₹{Math.round(stats.avgMachineCost).toLocaleString()}</p>
            <p className="text-[10px] opacity-80 mt-1">Cost price per unit</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl text-white">
            <FiUsers className="text-2xl mb-2 opacity-80" />
            <p className="text-xs opacity-80">Customers Served</p>
            <p className="text-2xl font-bold mt-1">{stats.soldMachines}</p>
            <p className="text-[10px] opacity-80 mt-1">Total customers acquired</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-2xl text-white">
            <FiTarget className="text-2xl mb-2 opacity-80" />
            <p className="text-xs opacity-80">Monthly Average Sales</p>
            <p className="text-2xl font-bold mt-1">{stats.monthlyAvgSales}</p>
            <p className="text-[10px] opacity-80 mt-1">Units per month</p>
          </div>
        </div>
      </div>

      {/* Monthly Performance Table */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Monthly Performance Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Units Sold</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Profit (₹)</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {salesData.map((item, idx) => {
                const prevSales = idx > 0 ? salesData[idx - 1].sales : item.sales;
                const growth = idx > 0 ? ((item.sales - prevSales) / prevSales) * 100 : 0;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium">{item.month}</td>
                    <td className="px-6 py-3 text-sm">{item.sales}</td>
                    <td className="px-6 py-3 text-sm font-bold text-green-600">₹{(item.profit/1000).toFixed(1)}k</td>
                    <td className="px-6 py-3">
                      {idx > 0 && (
                        <span className={`text-xs font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                        </span>
                      )}
                      {idx === 0 && <span className="text-xs text-gray-400">Base</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Total Investment</p>
            <p className="text-xl font-bold text-gray-800">₹{(stats.totalMachines * stats.avgMachineCost / 1000).toFixed(1)}k</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Total Return</p>
            <p className="text-xl font-bold text-green-600">₹{(stats.totalProfit/1000).toFixed(1)}k</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">ROI</p>
            <p className="text-xl font-bold text-purple-600">
              {stats.totalMachines * stats.avgMachineCost > 0 
                ? ((stats.totalProfit / (stats.totalMachines * stats.avgMachineCost)) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealershipAnalytics;