// src/Pages/Customer/Analytics.jsx - FIXED VERSION

import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config_portal/axios';
import Loading from "../loading.jsx";
import { 
  FiTrendingUp, FiBarChart2, FiDownload, FiDollarSign, 
  FiCalendar, FiActivity, FiAward, FiTarget, FiInfo,
  FiCpu, FiUsers, FiAlertCircle
} from 'react-icons/fi';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell 
} from "recharts";

const CustomerAnalytics = () => {
  const { user, accessToken } = useAuth();
  const [machines, setMachines] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Fetch machines and dashboard data
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch customer machines
        const machinesResponse = await axiosInstance.get('/customer/machines', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        const machinesData = machinesResponse.data;
        setMachines(machinesData);
        
        // Fetch dashboard stats
        const dashboardResponse = await axiosInstance.get('/customer/dashboard', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setDashboardStats(dashboardResponse.data);
        
        // Fetch all logs for this customer's machines
        setLogsLoading(true);
        const logsResponse = await axiosInstance.get('/customer/all-logs', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (logsResponse.data && logsResponse.data.length > 0) {
          console.log('Raw logs data:', logsResponse.data);
          setDailyLogs(logsResponse.data);
        } else {
          console.log('No logs found, checking daily-logs endpoint...');
          // Fallback to daily-logs endpoint
          const dailyLogsResponse = await axiosInstance.get('/customer/daily-logs', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (dailyLogsResponse.data && dailyLogsResponse.data.length > 0) {
            setDailyLogs(dailyLogsResponse.data);
          }
        }
        setLogsLoading(false);
        
        console.log('Machines data:', machinesData);
        console.log('Dashboard stats:', dashboardResponse.data);
        
      } catch (err) {
        console.error('Failed to fetch analytics data:', err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [accessToken]);

  const analytics = useMemo(() => {
    if (!machines.length) return null;
    
    // ==============================================
    // Calculate actual totals from LOGS (most accurate)
    // ==============================================
    let totalTapsFromLogs = 0;
    let totalRevenueFromLogs = 0;
    const tapsByMachine = {};
    const tapsByDate = {};
    const tapsByMonth = {};
    
    // Process all logs to get accurate totals
    if (dailyLogs && dailyLogs.length > 0) {
      dailyLogs.forEach(log => {
        const machineId = log.machineId;
        const tapCount = log.tapCount || 0;
        const date = log.date;
        const costPerTap = log.costPerTap || 0.50;
        
        totalTapsFromLogs += tapCount;
        totalRevenueFromLogs += tapCount * costPerTap;
        
        // Group by machine
        if (!tapsByMachine[machineId]) {
          tapsByMachine[machineId] = 0;
        }
        tapsByMachine[machineId] += tapCount;
        
        // Group by date
        if (date) {
          if (!tapsByDate[date]) tapsByDate[date] = 0;
          tapsByDate[date] += tapCount;
          
          const dateObj = new Date(date);
          const monthKey = dateObj.toLocaleString('default', { month: 'short' }) + ' ' + dateObj.getFullYear();
          if (!tapsByMonth[monthKey]) tapsByMonth[monthKey] = 0;
          tapsByMonth[monthKey] += tapCount;
        }
      });
    }
    
    // Use logs data if available, otherwise fallback to machine.totalTaps
    const useLogsData = totalTapsFromLogs > 0;
    
    let totalTaps = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalMachineCost = 0;
    const machinePerformance = [];
    
    machines.forEach((machine) => {
      const costPerTap = machine.costPerTap || 0.50;
      const rentPerMonth = machine.rentPerMonth || 0;
      const maintenanceCost = machine.maintenanceCostPerMonth || 0;
      const machineCost = machine.machineCost || 0;
      
      // Get machine taps from logs (accurate) or fallback to machine.totalTaps
      let machineTaps = useLogsData 
        ? (tapsByMachine[machine.machineId] || 0)
        : (machine.totalTaps || 0);
      
      totalTaps += machineTaps;
      totalMachineCost += machineCost;
      
      // Calculate revenue based on taps
      const machineRevenue = machineTaps * costPerTap;
      totalRevenue += machineRevenue;
      
      // Calculate expenses (rent + maintenance)
      const machineExpenses = rentPerMonth + maintenanceCost;
      totalExpenses += machineExpenses;
      
      // Calculate net profit
      const netProfit = machineRevenue - machineExpenses;
      
      // Calculate monthly taps from logs
      let monthlyTaps = 0;
      const currentDate = new Date();
      const currentMonthKey = currentDate.toLocaleString('default', { month: 'short' }) + ' ' + currentDate.getFullYear();
      
      if (useLogsData) {
        // Get this machine's taps for current month
        dailyLogs.forEach(log => {
          if (log.machineId === machine.machineId && log.date) {
            const logDate = new Date(log.date);
            const logMonthKey = logDate.toLocaleString('default', { month: 'short' }) + ' ' + logDate.getFullYear();
            if (logMonthKey === currentMonthKey) {
              monthlyTaps += (log.tapCount || 0);
            }
          }
        });
      } else {
        monthlyTaps = machine.monthlyTaps || 0;
      }
      
      machinePerformance.push({
        id: machine.machineId,
        location: machine.location,
        state: machine.state,
        country: machine.country,
        totalTaps: machineTaps,
        monthlyTaps: monthlyTaps,
        revenue: machineRevenue,
        costPerTap,
        machineCost: machineCost,
        rentPerMonth,
        maintenanceCost,
        netProfit: netProfit,
        profitMargin: machineRevenue > 0 ? (netProfit / machineRevenue) * 100 : 0,
        status: machine.status
      });
    });
    
    // ==============================================
    // Generate daily trend from LOGS (accurate)
    // ==============================================
    let dailyTrend = [];
    const today = new Date();
    
    // Get last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      const taps = tapsByDate[dateStr] || 0;
      const revenue = taps * 0.50; // Average cost per tap
      
      dailyTrend.push({
        date: formattedDate,
        fullDate: dateStr,
        taps: taps,
        revenue: Math.round(revenue)
      });
    }
    
    // ==============================================
    // Generate monthly trend from LOGS (accurate)
    // ==============================================
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(today.getMonth() - i);
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      const monthYear = monthDate.getFullYear();
      const monthKey = `${monthName} ${monthYear}`;
      
      const taps = tapsByMonth[monthKey] || 0;
      const revenue = taps * 0.50;
      
      monthlyTrend.push({
        month: monthKey,
        taps: taps,
        revenue: Math.round(revenue)
      });
    }
    
    // Calculate growth rate based on monthly data
    const monthsWithData = monthlyTrend.filter(m => m.taps > 0);
    let growthRate = 0;
    if (monthsWithData.length >= 2) {
      const lastMonth = monthsWithData[monthsWithData.length - 1];
      const previousMonth = monthsWithData[monthsWithData.length - 2];
      if (previousMonth.taps > 0) {
        growthRate = ((lastMonth.taps - previousMonth.taps) / previousMonth.taps) * 100;
      }
    }
    
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Top performing machine (by net profit)
    const topMachine = [...machinePerformance].sort((a, b) => b.netProfit - a.netProfit)[0];
    
    // Active machines (those with taps in current month)
    const activeMachines = machinePerformance.filter(m => m.monthlyTaps > 0).length;
    
    // Average daily taps from actual data (last 30 days)
    const totalTapsLast30Days = dailyTrend.reduce((sum, day) => sum + day.taps, 0);
    const avgDailyTaps = totalTapsLast30Days > 0 ? Math.round(totalTapsLast30Days / 30) : 0;
    
    // ROI calculation
    const totalROI = totalMachineCost > 0 ? (netProfit / totalMachineCost) * 100 : 0;
    
    console.log('Analytics Summary:', {
      totalTapsFromLogs,
      totalTapsFromMachines: machines.reduce((sum, m) => sum + (m.totalTaps || 0), 0),
      totalRevenue,
      netProfit,
      activeMachines,
      avgDailyTaps,
      monthlyTrend,
      dailyCount: dailyTrend.filter(d => d.taps > 0).length
    });
    
    return { 
      totalTaps: useLogsData ? totalTapsFromLogs : totalTaps,
      totalRevenue, 
      totalExpenses,
      netProfit,
      profitMargin: profitMargin.toFixed(2),
      totalMachines: machines.length, 
      activeMachines: activeMachines || dashboardStats?.activeMachines || 0,
      dailyTrend, 
      monthlyTrend,
      machinePerformance: machinePerformance.sort((a, b) => b.totalTaps - a.totalTaps),
      growthRate: growthRate.toFixed(1),
      avgDailyTaps,
      topMachine,
      totalMachineCost,
      totalROI: totalROI.toFixed(2),
      usingLogsData: useLogsData
    };
  }, [machines, dashboardStats, dailyLogs]);

  const handleExport = () => {
    if (!analytics) return;
    
    const exportData = {
      generatedAt: new Date().toISOString(),
      customerInfo: {
        name: user?.name,
        email: user?.email
      },
      summary: {
        totalTaps: analytics.totalTaps,
        totalRevenue: analytics.totalRevenue,
        totalExpenses: analytics.totalExpenses,
        netProfit: analytics.netProfit,
        profitMargin: analytics.profitMargin,
        totalMachines: analytics.totalMachines,
        activeMachines: analytics.activeMachines,
        avgDailyTaps: analytics.avgDailyTaps,
        growthRate: analytics.growthRate,
        totalMachineCost: analytics.totalMachineCost,
        totalROI: analytics.totalROI
      },
      dailyTrend: analytics.dailyTrend.filter(d => d.taps > 0),
      monthlyTrend: analytics.monthlyTrend.filter(m => m.taps > 0),
      machinePerformance: analytics.machinePerformance.map(m => ({
        machineId: m.id,
        location: m.location,
        state: m.state,
        country: m.country,
        totalTaps: m.totalTaps,
        monthlyTaps: m.monthlyTaps,
        revenue: m.revenue,
        machineCost: m.machineCost,
        costPerTap: m.costPerTap,
        rentPerMonth: m.rentPerMonth,
        maintenanceCost: m.maintenanceCost,
        netProfit: m.netProfit,
        profitMargin: m.profitMargin
      })),
      generatedBy: 'FreshPOD Analytics System'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  };

  if (loading || logsLoading) return <Loading />;
  
  if (error) {
    return (
      <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 rounded-2xl p-10 text-center">
          <FiAlertCircle className="text-5xl text-red-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-red-600">Error loading analytics</p>
          <p className="text-sm text-red-500 mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!analytics || analytics.totalTaps === 0) {
    return (
      <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-2xl p-10 text-center text-gray-500">
          <FiBarChart2 className="text-5xl mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No tap data available</p>
          <p className="text-sm">Start collecting tap data to see analytics insights.</p>
          {analytics?.totalMachineCost > 0 && (
            <p className="text-xs text-gray-400 mt-2">Total Machine Investment: ₹{analytics.totalMachineCost.toLocaleString()}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header with Data Source Indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Analytics</h1>
          <p className="text-sm text-gray-500">Track your machine performance and profitability</p>
          {analytics.usingLogsData && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <FiActivity size={10} /> Data sourced from actual tap logs (most accurate)
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <div className="bg-white border px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm">
            <FiCalendar /> {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <button 
            onClick={handleExport}
            className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <FiDownload /> Export Report
          </button>
        </div>
      </div>

      {/* Data Consistency Warning */}
      {analytics.usingLogsData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6 flex items-start gap-3">
          <FiAlertCircle className="text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium">Note about your data:</p>
            <p className="text-xs">
              Your analytics are based on actual tap logs. 
              Lifetime taps from logs: <strong>{analytics.totalTaps}</strong> | 
              Machine records show: <strong>{machines.reduce((sum, m) => sum + (m.totalTaps || 0), 0)}</strong> taps
            </p>
          </div>
        </div>
      )}

      {/* Key Metrics Cards - Same as before */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiCpu className="text-blue-600 text-xl" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{analytics.totalMachines}</span>
          </div>
          <p className="text-gray-600 text-sm">Total Machines</p>
          <p className="text-xs text-green-600 mt-2">{analytics.activeMachines} active</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiActivity className="text-green-600 text-xl" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{analytics.totalTaps.toLocaleString()}</span>
          </div>
          <p className="text-gray-600 text-sm">Total Lifetime Taps</p>
          <p className="text-xs text-gray-400 mt-2">Avg {analytics.avgDailyTaps} taps/day</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiDollarSign className="text-purple-600 text-xl" />
            </div>
            <span className="text-2xl font-bold text-gray-800">₹{Math.round(analytics.totalRevenue).toLocaleString()}</span>
          </div>
          <p className="text-gray-600 text-sm">Total Revenue</p>
          <p className="text-xs text-green-600 mt-2">+{analytics.growthRate}% growth</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiTrendingUp className="text-orange-600 text-xl" />
            </div>
            <span className="text-2xl font-bold text-gray-800">₹{Math.round(analytics.totalMachineCost).toLocaleString()}</span>
          </div>
          <p className="text-gray-600 text-sm">Total Machine Investment</p>
          <p className="text-xs text-blue-600 mt-2">ROI: {analytics.totalROI}%</p>
        </div>
      </div>

      {/* Rest of your component remains the same... */}
      {/* Profitability Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <p className="text-xs opacity-80">Net Profit</p>
          <p className="text-2xl font-bold mt-1">₹{Math.round(analytics.netProfit).toLocaleString()}</p>
          <p className="text-xs opacity-80 mt-2">After expenses</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <p className="text-xs opacity-80">Profit Margin</p>
          <p className="text-2xl font-bold mt-1">{analytics.profitMargin}%</p>
          <p className="text-xs opacity-80 mt-2">of total revenue</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <p className="text-xs opacity-80">Monthly Expenses</p>
          <p className="text-2xl font-bold mt-1">₹{Math.round(analytics.totalExpenses).toLocaleString()}</p>
          <p className="text-xs opacity-80 mt-2">Rent + Maintenance</p>
        </div>
      </div>

      {/* Main Chart - Daily Trends */}
      {analytics.dailyTrend.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FiActivity className="text-blue-600" /> Tap Trends (Last 30 Days)
          </h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailyTrend}>
                <defs>
                  <linearGradient id="colorTaps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="taps" stroke="#3B82F6" fill="url(#colorTaps)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            Showing daily tap counts from your machine logs
          </p>
        </div>
      )}

      {/* Monthly Performance Chart */}
      {analytics.monthlyTrend.length > 0 && analytics.monthlyTrend.some(m => m.taps > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FiBarChart2 className="text-green-600" /> Monthly Performance
          </h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="taps" fill="#3B82F6" name="Taps" />
                <Bar yAxisId="right" dataKey="revenue" fill="#10B981" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Machine Performance Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Machine Performance</h3>
            <p className="text-xs text-gray-500 mt-1">Lifetime totals from actual usage logs</p>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500">Machine</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500">Location</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500">Cost/Tap</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500">Total Taps</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500">Revenue (₹)</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500">Net Profit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.machinePerformance.map((machine, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{machine.id}</td>
                    <td className="px-4 py-3 text-sm">{machine.location}</td>
                    <td className="px-4 py-3 text-sm font-medium">₹{machine.costPerTap.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-bold">{machine.totalTaps.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">₹{Math.round(machine.revenue).toLocaleString()}</td>
                    <td className={`px-4 py-3 text-sm font-bold ${machine.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      ₹{Math.round(machine.netProfit).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ROI and Insights */}
        <div className="space-y-6">
          {analytics.topMachine && (
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl text-white">
              <FiAward className="text-2xl mb-2 opacity-80" />
              <p className="text-xs opacity-80">Best Performing Machine</p>
              <p className="text-xl font-bold mt-1">{analytics.topMachine.id}</p>
              <p className="text-sm opacity-90 mt-1">{analytics.topMachine.location}</p>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div>
                  <p className="opacity-70">Machine Cost</p>
                  <p className="font-bold">₹{analytics.topMachine.machineCost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="opacity-70">Net Profit</p>
                  <p className="font-bold">₹{Math.round(analytics.topMachine.netProfit).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiTarget className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Average Daily Taps</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.avgDailyTaps.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Across {analytics.activeMachines} active machines</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiTrendingUp className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Return on Investment (ROI)</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.totalROI}%</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Based on ₹{(analytics.totalMachineCost/1000).toFixed(1)}k total machine investment
            </p>
          </div>
        </div>
      </div>

      {/* Profitability Tips */}
      <div className="bg-blue-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiInfo className="text-blue-600" />
          <h3 className="font-bold text-blue-800">Profitability Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-blue-700">
            <p className="font-medium">💡 Revenue Tip</p>
            <p className="text-xs mt-1">Consider increasing cost per tap on your best-performing machines</p>
          </div>
          <div className="text-blue-700">
            <p className="font-medium">🔧 Cost Saving</p>
            <p className="text-xs mt-1">Regular maintenance can reduce unexpected repair costs</p>
          </div>
          <div className="text-blue-700">
            <p className="font-medium">📈 Growth Opportunity</p>
            <p className="text-xs mt-1">
              {parseFloat(analytics.growthRate) >= 0 
                ? `Your positive growth rate of ${analytics.growthRate}% is excellent! Keep expanding.`
                : `Focus on increasing tap volume to improve your ${Math.abs(analytics.growthRate)}% decline.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalytics;