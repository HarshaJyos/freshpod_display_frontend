import React, { useContext, useMemo } from 'react';
import { DataContext } from '../../context/DataContext';
import Loading from "../loading.jsx";
import { 
  FiMousePointer, FiActivity, FiTrendingUp, 
  FiAlertCircle, FiDollarSign, FiBarChart2, FiDownload,
  FiCheckCircle, FiZap, FiCalendar
} from 'react-icons/fi';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

const Dashboard = () => {
  const { machines, loading, error } = useContext(DataContext);

  const stats = useMemo(() => {
    if (!machines || Object.keys(machines).length === 0) {
      return { 
        totalTapsMonth: 0, activeCount: 0, unitList: [], 
        totalRevenue: 0, totalMachines: 0, uptime: 0,
        dailyTrend: [], alerts: [], monthName: "April 2026"
      };
    }

    const machineEntries = Object.entries(machines);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    
    let totalTapsMonth = 0;
    let grandTotalRevenue = 0;
    let activeMachinesCount = 0;
    const dailyMap = {};
    const alerts = [];

    const unitList = machineEntries.map(([id, data]) => {
      // Get logs and cost per tap from machine data
      const logs = data?.logs || {};
      // Default cost per tap from analytics page - using ₹70.00
      const costPerTap = data?.costPerTap || 70.00; 
      let machineMonthTaps = 0;
      let machineActiveDays = 0;
      let machineTotalTaps = 0;

      // First, calculate total taps for this machine (for efficiency comparison)
      Object.entries(logs).forEach(([date, log]) => {
        const count = log?.tapCount || log?.taps || log?.count || 0;
        machineTotalTaps += count;
      });

      // Process logs for current month
      Object.entries(logs).forEach(([date, log]) => {
        try {
          // Parse the date - handle different formats
          let logDate;
          if (date.includes('/')) {
            // Handle DD/MM/YYYY format
            const parts = date.split('/');
            logDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          } else {
            logDate = new Date(date);
          }
          
          // Check if date is valid
          if (isNaN(logDate.getTime())) {
            console.warn(`Invalid date format: ${date}`);
            return;
          }
          
          const count = log?.tapCount || log?.taps || log?.count || 0;
          
          // Check if log belongs to current month
          if (logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth) {
            machineMonthTaps += count;
            
            // Format date consistently for dailyMap
            const dateKey = `${logDate.getDate()}/${logDate.getMonth() + 1}/${logDate.getFullYear()}`;
            dailyMap[dateKey] = (dailyMap[dateKey] || 0) + count;
            
            if (count > 0) {
              machineActiveDays++;
            }
          }
        } catch (err) {
          console.warn(`Error processing log for ${id} on ${date}:`, err);
        }
      });

      // Calculate revenue for this month only (prioritize backend dynamic payments monthlyRevenue)
      const machineRevenue = data?.monthlyRevenue !== undefined ? data.monthlyRevenue : machineMonthTaps * costPerTap;
      grandTotalRevenue += machineRevenue;
      totalTapsMonth += machineMonthTaps;

      const isActive = machineMonthTaps > 0;
      if (isActive) activeMachinesCount++;

      if (!isActive && machineMonthTaps === 0) {
        alerts.push({ id, message: "No activity recorded this month" });
      }

      // Calculate efficiency based on active days in month
      let efficiency = "0%";
      if (machineMonthTaps > 0 && machineActiveDays > 0) {
        const efficiencyValue = Math.min(100, (machineActiveDays / 30) * 100);
        efficiency = `${efficiencyValue.toFixed(0)}%`;
      }

      return {
        id,
        owner: data?.owner || `Owner ${id.slice(-4)}`,
        monthTaps: machineMonthTaps,
        totalTaps: machineTotalTaps,
        activeDays: machineActiveDays,
        revenue: data?.totalRevenue !== undefined ? data.totalRevenue : machineRevenue,
        costPerTap: costPerTap,
        status: isActive ? "Active" : "Idle",
        efficiency: efficiency,
        state: data?.state || 'Unknown',
        country: data?.country || 'Unknown'
      };
    });

    // Sort dailyTrend by date
    const dailyTrend = Object.entries(dailyMap)
      .sort((a, b) => {
        const dateA = a[0].split('/');
        const dateB = b[0].split('/');
        return new Date(dateA[2], dateA[1] - 1, dateA[0]) - new Date(dateB[2], dateB[1] - 1, dateB[0]);
      })
      .slice(-7)
      .map(([date, count]) => ({
        date: date,
        taps: count
      }));

    // Calculate avg daily taps (using actual days in month)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const avgDailyTaps = daysInMonth > 0 ? Math.round(totalTapsMonth / daysInMonth) : 0;

    // Get top performers by revenue
    const topPerformers = [...unitList]
      .filter(m => m.monthTaps > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    return {
      totalTapsMonth,
      activeCount: activeMachinesCount,
      totalMachines: machineEntries.length,
      unitList,
      topPerformers,
      totalRevenue: grandTotalRevenue,
      dailyTrend,
      alerts,
      uptime: machineEntries.length > 0 ? (activeMachinesCount / machineEntries.length) * 100 : 0,
      monthName: `${monthNames[currentMonth]} ${currentYear}`,
      avgDailyTaps: avgDailyTaps,
      projectedRevenue: grandTotalRevenue * 1.15,
      daysInMonth: daysInMonth
    };
  }, [machines]);

  if (loading) return <Loading />;

  if (error) return (
    <div className="p-8 text-red-500 bg-red-50 rounded-xl flex items-center gap-3">
      <FiAlertCircle /> Error loading data: {error.message}
    </div>
  );

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[0]}/${parts[1]}`;
    }
    return dateStr;
  };

  return (
    <div className="w-full p-2 md:p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Machine Fleet Analytics</h1>
          <p className="text-gray-500 text-sm">{stats.monthName} • Monthly Performance Overview</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-medium shadow-sm">
            <FiCalendar /> {stats.monthName}
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-all">
            <FiDownload /> Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Machines", val: stats.totalMachines, sub: "Active Fleet", icon: <FiActivity />, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Machines", val: stats.activeCount, sub: `${stats.uptime.toFixed(1)}% uptime`, icon: <FiCheckCircle />, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Taps (Month)", val: stats.totalTapsMonth.toLocaleString(), sub: `Avg ${stats.avgDailyTaps}/day`, icon: <FiMousePointer />, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Total Revenue", val: `₹${(stats.totalRevenue/1000).toFixed(1)}k`, sub: "This Month", icon: <FiDollarSign />, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Projected Revenue", val: `₹${(stats.projectedRevenue/1000).toFixed(1)}k`, sub: "+15% Growth", icon: <FiTrendingUp />, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{item.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{item.val}</p>
            <div className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold ${item.bg} ${item.color}`}>
              {item.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="font-bold text-gray-800 text-sm sm:text-base">
              Daily Tap Trends (Last 7 Days)
            </h3>
            <span className="text-xs text-blue-500 font-medium">
              {stats.monthName}
            </span>
          </div>

          {stats.dailyTrend.length > 0 && stats.dailyTrend.some(d => d.taps > 0) ? (
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value) => [`${value} taps`, 'Taps']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="taps"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No tap data available for this month
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>Current Revenue</span>
                <span>₹{(stats.totalRevenue/1000).toFixed(1)}k</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: `${Math.min(100, (stats.totalRevenue / (stats.projectedRevenue || 1)) * 100)}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>Target Progress</span>
                <span>{Math.min(100, Math.round((stats.totalRevenue / (stats.projectedRevenue || 1)) * 100))}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full" style={{ width: `${Math.min(100, (stats.totalRevenue / (stats.projectedRevenue || 1)) * 100)}%` }} />
              </div>
            </div>
            <div className="pt-4 mt-2 border-t border-gray-100">
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Based on current monthly performance, projected revenue shows +15% growth potential.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Machine Performance - {stats.monthName}</h3>
            <button className="text-xs text-blue-600 font-bold hover:text-blue-700">Sort by Usage ▾</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-gray-400 font-bold border-b border-gray-50">
                  <th className="px-6 py-4">Machine ID</th>
                  <th className="px-6 py-4">Owner Name</th>
                  <th className="px-6 py-4">Monthly Taps</th>
                  <th className="px-6 py-4">Active Days</th>
                  <th className="px-6 py-4">Revenue (₹)</th>
                  <th className="px-6 py-4">Cost/Tap</th>
                  <th className="px-6 py-4">Efficiency</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.unitList.length > 0 ? (
                  stats.unitList
                    .sort((a, b) => b.monthTaps - a.monthTaps)
                    .slice(0, 6)
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-gray-800">{m.id}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{m.owner}</td>
                        <td className="px-6 py-4 text-xs font-bold">{m.monthTaps.toLocaleString()}</td>
                        <td className="px-6 py-4 text-xs text-gray-600">{m.activeDays}/{stats.daysInMonth || 30}</td>
                        <td className="px-6 py-4 text-xs font-bold text-green-600">₹{m.revenue.toLocaleString()}</td>
                        <td className="px-6 py-4 text-xs text-gray-600">₹{m.costPerTap.toFixed(2)}</td>
                        <td className="px-6 py-4 text-xs text-gray-600">{m.efficiency}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center w-fit gap-1 ${
                            m.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${m.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500 text-sm">
                      No machine data available for this month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
            <div className="flex items-center gap-3 mb-4 text-orange-700">
              <FiAlertCircle className="text-xl" />
              <h3 className="font-bold">Monthly Alerts</h3>
            </div>
            <p className="text-xs text-orange-600 font-medium mb-2">
              {stats.alerts.length} Machine{stats.alerts.length !== 1 ? 's' : ''} Inactive This Month
            </p>
            {stats.alerts.length > 0 && (
              <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                {stats.alerts.slice(0, 3).map((alert, idx) => (
                  <div key={idx} className="text-[10px] text-orange-700 bg-orange-100 p-2 rounded">
                    {alert.id}: {alert.message}
                  </div>
                ))}
              </div>
            )}
            {stats.alerts.length === 0 && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                ✓ All machines are active this month
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Top Performers This Month</h3>
            <div className="space-y-4">
              {stats.topPerformers.length > 0 ? (
                stats.topPerformers.map((m, i) => (
                  <div key={i} className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-white p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-600'}`}>
                        <FiZap />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">{m.id}</span>
                        <span className="text-[9px] text-gray-400">{m.monthTaps.toLocaleString()} taps @ ₹{m.costPerTap.toFixed(2)}/tap</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-green-600">₹{m.revenue.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">No active machines this month</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;