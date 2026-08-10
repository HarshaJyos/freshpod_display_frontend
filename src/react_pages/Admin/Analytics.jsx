import React, { useContext, useMemo, useState, useRef, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import Loading from "../loading.jsx";
import { 
  FiTrendingUp, FiPieChart, FiBarChart2, FiArrowUpRight, FiTarget,
  FiCalendar, FiCpu, FiDownload, FiFilter, FiRefreshCw,
  FiActivity, FiDollarSign, FiUsers, FiClock, FiAward,
  FiChevronLeft, FiChevronRight, FiMaximize2, FiMinimize2,
  FiSun, FiMoon, FiZap, FiMapPin
} from 'react-icons/fi';
import {SanitizationLevel , SanitizationIndicator} from '../Sanitization.jsx';

const Analytics = () => {
  console.log("=== Analytics Component Mounted ===");
  
  const context = useContext(DataContext);
  console.log("DataContext value:", context);
  
  const { machines, loading } = context || {};
  console.log("Machines data:", machines);
  console.log("Loading state:", loading);
  
  // State for date range and machine selection
  const [dateRange, setDateRange] = useState('lifetime');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [chartView, setChartView] = useState('daily');
  
  // New filter states
  const [selectedState, setSelectedState] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  console.log("Initial filter states:", { dateRange, selectedState, selectedCountry, selectedMachine });

  // Get all unique states and countries from machines
  const { uniqueStates, uniqueCountries, machineList } = useMemo(() => {
    console.log("useMemo running for unique states/countries");
    console.log("machines in useMemo:", machines);
    
    if (!machines) {
      console.log("No machines data available");
      return { uniqueStates: [], uniqueCountries: [], machineList: [] };
    }
    
    const states = new Set();
    const countries = new Set();
    const machineIds = [];
    
    console.log("Processing machines entries:", Object.entries(machines).length);
    
    Object.entries(machines).forEach(([id, machine]) => {
      console.log(`Processing machine ${id}:`, machine);
      machineIds.push(id);
      if (machine && machine.state) {
        console.log(`Adding state: ${machine.state} for machine ${id}`);
        states.add(machine.state);
      } else {
        console.warn(`Machine ${id} has no state property or machine is undefined`);
      }
      if (machine && machine.country) {
        console.log(`Adding country: ${machine.country} for machine ${id}`);
        countries.add(machine.country);
      } else {
        console.warn(`Machine ${id} has no country property or machine is undefined`);
      }
    });
    
    const result = {
      uniqueStates: Array.from(states).sort(),
      uniqueCountries: Array.from(countries).sort(),
      machineList: machineIds
    };
    
    console.log("Unique states:", result.uniqueStates);
    console.log("Unique countries:", result.uniqueCountries);
    console.log("Machine list:", result.machineList);
    
    return result;
  }, [machines]);

  // Filter data based on all criteria
  const filteredData = useMemo(() => {
    console.log("=== Filtering Data ===");
    console.log("Input machines:", machines);
    console.log("Selected filters:", { dateRange, selectedState, selectedCountry, selectedMachine, customStartDate, customEndDate });
    
    if (!machines) {
      console.log("No machines available, returning null");
      return null;
    }

    let filteredMachines = { ...machines };
    console.log("Initial filteredMachines keys:", Object.keys(filteredMachines).length);
    
    // Filter by state
    if (selectedState) {
      console.log(`Filtering by state: ${selectedState}`);
      const beforeCount = Object.keys(filteredMachines).length;
      filteredMachines = Object.fromEntries(
        Object.entries(filteredMachines).filter(([id, machine]) => {
          const match = machine.state === selectedState;
          if (!match) console.log(`Filtering out machine ${id} - state: ${machine.state}`);
          return match;
        })
      );
      console.log(`State filter: ${beforeCount} -> ${Object.keys(filteredMachines).length} machines`);
    }
    
    // Filter by country
    if (selectedCountry) {
      console.log(`Filtering by country: ${selectedCountry}`);
      const beforeCount = Object.keys(filteredMachines).length;
      filteredMachines = Object.fromEntries(
        Object.entries(filteredMachines).filter(([id, machine]) => {
          const match = machine.country === selectedCountry;
          if (!match) console.log(`Filtering out machine ${id} - country: ${machine.country}`);
          return match;
        })
      );
      console.log(`Country filter: ${beforeCount} -> ${Object.keys(filteredMachines).length} machines`);
    }
    
    // Filter by specific machine if selected
    if (dateRange === 'machine' && selectedMachine) {
      console.log(`Filtering by specific machine: ${selectedMachine}`);
      if (machines[selectedMachine]) {
        filteredMachines = { [selectedMachine]: machines[selectedMachine] };
        console.log(`Found machine ${selectedMachine}`);
      } else {
        console.warn(`Machine ${selectedMachine} not found`);
        filteredMachines = {};
      }
    }

    // Filter by date range
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      console.log(`Applying custom date filter from ${customStartDate} to ${customEndDate}`);
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      
      console.log("Date range:", { start, end });

      const filtered = {};
      Object.entries(filteredMachines).forEach(([id, machine]) => {
        const logs = machine.logs || {};
        console.log(`Processing machine ${id} logs:`, Object.keys(logs).length, "entries");
        
        const filteredLogs = {};
        
        Object.entries(logs).forEach(([date, log]) => {
          const logDate = new Date(date);
          if (logDate >= start && logDate <= end) {
            console.log(`Including log entry for ${date}`);
            filteredLogs[date] = log;
          }
        });
        
        if (Object.keys(filteredLogs).length > 0) {
          console.log(`Machine ${id} has ${Object.keys(filteredLogs).length} logs in date range`);
          filtered[id] = { ...machine, logs: filteredLogs };
        } else if (dateRange !== 'machine') {
          console.log(`Machine ${id} has no logs in date range, including with empty logs`);
          filtered[id] = { ...machine, logs: {} };
        }
      });
      filteredMachines = filtered;
      console.log(`Date filter result: ${Object.keys(filteredMachines).length} machines`);
    }

    console.log("Final filteredMachines keys:", Object.keys(filteredMachines));
    return filteredMachines;
  }, [machines, dateRange, customStartDate, customEndDate, selectedMachine, selectedState, selectedCountry]);

  // Calculate analytics with actual cost per tap from machines
  const analytics = useMemo(() => {
    console.log("=== Calculating Analytics ===");
    console.log("FilteredData:", filteredData);
    
    if (!filteredData) {
      console.log("No filteredData available");
      return null;
    }

    const entries = Object.entries(filteredData);
    console.log("Number of machine entries:", entries.length);
    
    if (entries.length === 0) {
      console.log("No machine entries found");
      return null;
    }

    let totalTaps = 0;
    let totalRevenue = 0;
    let activeMachines = 0;
    const dailyData = {};
    const monthlyData = {};
    const yearlyData = {};
    const machinePerformance = [];
    const stateStats = {};
    const countryStats = {};

    entries.forEach(([id, machine]) => {
      console.log(`Processing machine ${id}:`, machine);
      
      const logs = machine.logs || {};
      const logEntries = Object.entries(logs);
      console.log(`Machine ${id} has ${logEntries.length} log entries`);
      
      let machineTaps = 0;
      const costPerTap = machine.costPerTap || 0.50;
      console.log(`Machine ${id} costPerTap:`, costPerTap);
      
      // Track state and country stats
      const state = machine.state || 'Unknown';
      const country = machine.country || 'India';
      console.log(`Machine ${id} location: ${state}, ${country}`);
      
      if (!stateStats[state]) {
        stateStats[state] = { taps: 0, revenue: 0, machines: 0 };
      }
      if (!countryStats[country]) {
        countryStats[country] = { taps: 0, revenue: 0, machines: 0 };
      }
      
      logEntries.forEach(([date, log]) => {
        const count = log.tapCount || 0;
        console.log(`Log entry ${date}: ${count} taps`);
        machineTaps += count;
        totalTaps += count;
        
        // Daily aggregation
        dailyData[date] = (dailyData[date] || 0) + count;
        
        // Monthly aggregation
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          console.error(`Invalid date: ${date}`);
          return;
        }
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + count;
        
        // Yearly aggregation
        const year = dateObj.getFullYear();
        yearlyData[year] = (yearlyData[year] || 0) + count;
      });
      
      const machineRevenue = machineTaps * costPerTap;
      totalRevenue += machineRevenue;
      if (machineTaps > 0) activeMachines++;
      
      // Update state and country stats
      stateStats[state].taps += machineTaps;
      stateStats[state].revenue += machineRevenue;
      stateStats[state].machines += 1;
      
      countryStats[country].taps += machineTaps;
      countryStats[country].revenue += machineRevenue;
      countryStats[country].machines += 1;
      
      machinePerformance.push({
        id,
        taps: machineTaps,
        revenue: machineRevenue,
        status: machineTaps > 0 ? 'Active' : 'Inactive',
        state,
        country,
        costPerTap
      });
    });

    console.log("Aggregation results:", {
      totalTaps,
      totalRevenue,
      activeMachines,
      totalMachines: entries.length,
      dailyDataKeys: Object.keys(dailyData).length,
      monthlyDataKeys: Object.keys(monthlyData).length,
      yearlyDataKeys: Object.keys(yearlyData).length
    });

    // Calculate trends
    const dailyTrend = Object.entries(dailyData)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-90);
    
    console.log("Daily trend length:", dailyTrend.length);
    
    const monthlyTrend = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, val]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        return [label, val, key];
      });
    
    console.log("Monthly trend length:", monthlyTrend.length);
    
    const yearlyTrend = Object.entries(yearlyData)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    
    console.log("Yearly trend length:", yearlyTrend.length);

    // Calculate growth metrics
    const previousPeriod = monthlyTrend.slice(-6, -3);
    const currentPeriod = monthlyTrend.slice(-3);
    const previousAvg = previousPeriod.reduce((acc, [_, val]) => acc + val, 0) / (previousPeriod.length || 1);
    const currentAvg = currentPeriod.reduce((acc, [_, val]) => acc + val, 0) / (currentPeriod.length || 1);
    const growthRate = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;
    
    console.log("Growth metrics:", { previousAvg, currentAvg, growthRate });

    // Peak performance times
    const peakDay = dailyTrend.length > 0 ? dailyTrend.reduce((a, b) => a[1] > b[1] ? a : b)[0] : 'N/A';
    const peakMonth = monthlyTrend.length > 0 ? monthlyTrend.reduce((a, b) => a[1] > b[1] ? a : b)[0] : 'N/A';
    const peakYear = yearlyTrend.length > 0 ? yearlyTrend.reduce((a, b) => a[1] > b[1] ? a : b)[0] : 'N/A';
    
    console.log("Peak periods:", { peakDay, peakMonth, peakYear });

    const result = {
      totalTaps,
      totalRevenue,
      activeMachines,
      totalMachines: entries.length,
      machinePerformance: machinePerformance.sort((a, b) => b.taps - a.taps),
      dailyTrend,
      monthlyTrend,
      yearlyTrend,
      growthRate,
      peakDay,
      peakMonth,
      peakYear,
      avgDailyTaps: dailyTrend.length > 0 ? Math.round(totalTaps / dailyTrend.length) : 0,
      avgMonthlyTaps: monthlyTrend.length > 0 ? Math.round(totalTaps / monthlyTrend.length) : 0,
      efficiency: entries.length > 0 ? ((activeMachines / entries.length) * 100).toFixed(1) : 0,
      projectedTaps: Math.round(totalTaps * (1 + (growthRate / 100))),
      stateStats,
      countryStats
    };
    
    console.log("Final analytics result:", result);
    return result;
  }, [filteredData]);

  const handleExportData = () => {
    console.log("Exporting data...");
    if (!analytics) {
      console.warn("No analytics data to export");
      return;
    }
    
    const exportData = {
      period: dateRange,
      startDate: customStartDate,
      endDate: customEndDate,
      machine: selectedMachine,
      filters: {
        state: selectedState,
        country: selectedCountry
      },
      analytics: {
        totalTaps: analytics.totalTaps,
        totalRevenue: analytics.totalRevenue,
        activeMachines: analytics.activeMachines,
        totalMachines: analytics.totalMachines,
        growthRate: analytics.growthRate,
        avgDailyTaps: analytics.avgDailyTaps,
        avgMonthlyTaps: analytics.avgMonthlyTaps,
        efficiency: analytics.efficiency,
        projectedTaps: analytics.projectedTaps
      },
      machinePerformance: analytics.machinePerformance,
      stateStats: analytics.stateStats,
      countryStats: analytics.countryStats,
      dailyTrend: analytics.dailyTrend,
      monthlyTrend: analytics.monthlyTrend,
      yearlyTrend: analytics.yearlyTrend
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `analytics_${dateRange}_${selectedState || 'all'}_${selectedCountry || 'all'}_${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    console.log("Export completed:", exportFileDefaultName);
  };

  const clearAllFilters = () => {
    console.log("Clearing all filters");
    setSelectedState('');
    setSelectedCountry('');
    setSelectedMachine('');
    setDateRange('lifetime');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  // Interactive chart component
  const InteractiveChart = ({ data, title, color, unit = 'taps' }) => {
    console.log(`Rendering chart: ${title} with ${data?.length} data points`);
    
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, label: '', value: 0 });
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

    useEffect(() => {
      console.log("Chart component mounted/updated");
      if (containerRef.current) {
        const updateDimensions = () => {
          const rect = containerRef.current.getBoundingClientRect();
          setDimensions({ width: rect.width, height: 400 });
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
      }
    }, []);

    if (!data || data.length === 0) {
      console.warn("No chart data available");
      return (
        <div ref={containerRef} className="h-full flex items-center justify-center text-gray-400">
          No data available for the selected period
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => d[1]), 1);
    const minValue = Math.min(...data.map(d => d[1]), 0);
    const valueRange = maxValue - minValue;
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const chartHeight = dimensions.height - padding.top - padding.bottom;
    const stepX = chartWidth / (data.length - 1);

    const getX = (index) => padding.left + index * stepX;
    const getY = (value) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

    let path = '';
    let areaPath = '';
    if (data.length > 0) {
      path = `M ${getX(0)} ${getY(data[0][1])}`;
      for (let i = 0; i < data.length - 1; i++) {
        const p0 = { x: getX(i), y: getY(data[i][1]) };
        const p1 = { x: getX(i + 1), y: getY(data[i + 1][1]) };
        const cp1x = p0.x + (p1.x - p0.x) / 3;
        const cp1y = p0.y;
        const cp2x = p1.x - (p1.x - p0.x) / 3;
        const cp2y = p1.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
      }
      areaPath = path + ` L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;
    }

    const handleMouseMove = (e) => {
      const svgRect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - svgRect.left;
      
      let closestIndex = 0;
      let minDist = Infinity;
      data.forEach((_, idx) => {
        const pointX = getX(idx);
        const dist = Math.abs(mouseX - pointX);
        if (dist < minDist) {
          minDist = dist;
          closestIndex = idx;
        }
      });
      
      if (minDist < 30) {
        const point = data[closestIndex];
        setTooltip({
          show: true,
          x: getX(closestIndex),
          y: getY(point[1]),
          label: point[0],
          value: point[1]
        });
      } else {
        setTooltip({ ...tooltip, show: false });
      }
    };

    const handleMouseLeave = () => setTooltip({ ...tooltip, show: false });

    return (
      <div ref={containerRef} className="relative" style={{ height: '400px', width: '100%' }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.0 }} />
            </linearGradient>
          </defs>
          
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + chartHeight * ratio;
            const value = Math.round(maxValue - (ratio * valueRange));
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={padding.left + chartWidth} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4,4" />
                <text x={padding.left - 8} y={y + 4} fontSize="11" fill="#9CA3AF" textAnchor="end">
                  {value.toLocaleString()}
                </text>
              </g>
            );
          })}
          
          <path d={areaPath} fill={`url(#gradient-${color})`} opacity="0.5" />
          <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          
          {data.map((point, index) => {
            const x = getX(index);
            const y = getY(point[1]);
            return <circle key={index} cx={x} cy={y} r="5" fill={color} stroke="white" strokeWidth="2" />;
          })}
          
          {data.map((point, index) => {
            const x = getX(index);
            let showLabel = false;
            if (chartView === 'daily') showLabel = index % Math.max(1, Math.floor(data.length / 10)) === 0 || index === data.length - 1;
            else if (chartView === 'monthly') showLabel = data.length <= 12 || index % 2 === 0 || index === data.length - 1;
            else showLabel = true;
            
            if (!showLabel) return null;
            
            return (
              <text key={index} x={x} y={dimensions.height - padding.bottom + 20} fontSize="10" fill="#6B7280" textAnchor="middle"
                transform={chartView === 'daily' && data.length > 15 ? `rotate(-35, ${x}, ${dimensions.height - padding.bottom + 20})` : ''}>
                {point[0]}
              </text>
            );
          })}
          
          {tooltip.show && (
            <g transform={`translate(${tooltip.x + 10}, ${tooltip.y - 30})`}>
              <rect x="-60" y="-20" width="120" height="36" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="1" opacity="0.95" />
              <text x="0" y="-4" fontSize="10" fill="#6B7280" textAnchor="middle">{tooltip.label}</text>
              <text x="0" y="10" fontSize="12" fill={color} textAnchor="middle" fontWeight="bold">
                {tooltip.value.toLocaleString()} {unit}
              </text>
            </g>
          )}
        </svg>
      </div>
    );
  };

  const getChartData = () => {
    console.log("Getting chart data for view:", chartView);
    let result;
    switch(chartView) {
      case 'daily':
        result = analytics?.dailyTrend.slice(-30).map(([date, taps]) => ({
          label: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          value: taps
        }));
        break;
      case 'monthly':
        result = analytics?.monthlyTrend.map(([month, taps]) => ({ label: month, value: taps }));
        break;
      case 'lifetime':
        result = analytics?.yearlyTrend.map(([year, taps]) => ({ label: year.toString(), value: taps }));
        break;
      default:
        result = [];
    }
    console.log(`Chart data for ${chartView}:`, result?.length, "items");
    return result;
  };

  const getChartColors = () => {
    switch(chartView) {
      case 'daily': return '#3B82F6';
      case 'monthly': return '#10B981';
      case 'lifetime': return '#8B5CF6';
      default: return '#3B82F6';
    }
  };

  const getChartTitle = () => {
    switch(chartView) {
      case 'daily': return 'Daily Tap Trends (Last 30 Days)';
      case 'monthly': return 'Monthly Tap Trends';
      case 'lifetime': return 'Lifetime Performance (Yearly)';
      default: return 'Tap Trends';
    }
  };

  const getChartIcon = () => {
    switch(chartView) {
      case 'daily': return <FiSun className="text-yellow-500" />;
      case 'monthly': return <FiCalendar className="text-green-500" />;
      case 'lifetime': return <FiZap className="text-purple-500" />;
      default: return <FiBarChart2 className="text-blue-600" />;
    }
  };

  // Early returns with logging
  if (loading) {
    console.log("Loading state active, showing loading component");
    return <Loading />;
  }
  
  console.log("Loading complete, checking analytics data");
  
  if (!analytics || analytics.totalTaps === 0) {
    console.log("No analytics data or zero taps:", analytics);
    return (
      <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-2xl p-10 text-center text-gray-500">
          <FiBarChart2 className="text-4xl mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No tap data available</p>
          <p className="text-sm">Start collecting tap data to see analytics insights.</p>
          <p className="text-xs text-gray-400 mt-2">Debug: {!analytics ? 'analytics is null' : 'totalTaps = 0'}</p>
        </div>
      </div>
    );
  }

  console.log("Rendering main component with analytics data");
  return (
    <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-sm text-gray-500 font-medium">Predictive modeling and fleet distribution</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              console.log("Toggle filters");
              setShowFilters(!showFilters);
            }}
            className={`bg-white border px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              (selectedState || selectedCountry) ? 'border-blue-500 text-blue-600' : 'border-gray-200 text-gray-700'
            }`}
          >
            <FiFilter /> Filters {(selectedState || selectedCountry) && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
          </button>
          <button onClick={handleExportData} className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <FiDownload /> Export Report
          </button>
          <button onClick={() => {
            console.log("Refresh clicked");
            window.location.reload();
          }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FiMapPin className="text-blue-600" /> Location Filters
            </h3>
            <button onClick={clearAllFilters} className="text-xs text-red-600 hover:text-red-700">
              Clear All Filters
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  console.log("Selected state:", e.target.value);
                  setSelectedState(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All States</option>
                {uniqueStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  console.log("Selected country:", e.target.value);
                  setSelectedCountry(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Countries</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
          {(selectedState || selectedCountry) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedState && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                  State: {selectedState}
                  <button onClick={() => setSelectedState('')} className="hover:text-blue-900">×</button>
                </span>
              )}
              {selectedCountry && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                  Country: {selectedCountry}
                  <button onClick={() => setSelectedCountry('')} className="hover:text-blue-900">×</button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Date Range & Filter Controls */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { 
              console.log("Set date range: lifetime");
              setDateRange('lifetime'); 
              setSelectedMachine(''); 
            }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === 'lifetime' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Lifetime
            </button>
            <button onClick={() => { 
              console.log("Set date range: custom");
              setDateRange('custom'); 
              setSelectedMachine(''); 
              setShowDatePicker(true); 
            }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Custom Range
            </button>
            <button onClick={() => { 
              console.log("Set date range: machine");
              setDateRange('machine'); 
              setShowDatePicker(false); 
            }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === 'machine' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Specific Machine
            </button>
          </div>

          {dateRange === 'custom' && showDatePicker && (
            <div className="flex gap-3 items-center flex-wrap">
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => {
                  console.log("Custom start date:", e.target.value);
                  setCustomStartDate(e.target.value);
                }} 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm" 
              />
              <span className="text-gray-500">to</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => {
                  console.log("Custom end date:", e.target.value);
                  setCustomEndDate(e.target.value);
                }} 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm" 
              />
              <button onClick={() => setShowDatePicker(false)} className="px-3 py-2 text-gray-500 hover:text-gray-700">Apply</button>
            </div>
          )}

          {dateRange === 'machine' && (
            <div className="flex gap-3 items-center flex-1">
              <select 
                value={selectedMachine} 
                onChange={(e) => {
                  console.log("Selected machine:", e.target.value);
                  setSelectedMachine(e.target.value);
                }} 
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Select a machine...</option>
                {machineList.map(machine => <option key={machine} value={machine}>{machine}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
          <FiCalendar size={12} />
          <span>
            {dateRange === 'lifetime' && 'Showing all historical data'}
            {dateRange === 'custom' && customStartDate && customEndDate && `Showing data from ${customStartDate} to ${customEndDate}`}
            {dateRange === 'machine' && selectedMachine && `Showing lifetime data for ${selectedMachine}`}
            {dateRange === 'machine' && !selectedMachine && 'Please select a machine to view analytics'}
          </span>
          {selectedState && <span className="text-blue-600">• State: {selectedState}</span>}
          {selectedCountry && <span className="text-blue-600">• Country: {selectedCountry}</span>}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Total Taps</p>
          <p className="text-2xl font-bold text-gray-800">{analytics.totalTaps.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">₹{(analytics.totalRevenue/1000).toFixed(1)}k</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Active Machines</p>
          <p className="text-2xl font-bold text-blue-600">{analytics.activeMachines}/{analytics.totalMachines}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Growth Rate</p>
          <p className={`text-2xl font-bold ${analytics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {analytics.growthRate >= 0 ? '+' : ''}{analytics.growthRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Efficiency</p>
          <p className="text-2xl font-bold text-purple-600">{analytics.efficiency}%</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase">Projected Taps</p>
          <p className="text-2xl font-bold text-orange-600">{analytics.projectedTaps.toLocaleString()}</p>
        </div>
      </div>

      {/* State and Country Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top States */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiMapPin className="text-green-600" /> Top Performing States
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.stateStats)
              .sort((a, b) => b[1].taps - a[1].taps)
              .slice(0, 5)
              .map(([state, data]) => (
                <div key={state}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{state}</span>
                    <span className="text-gray-500">{data.taps.toLocaleString()} taps</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(data.taps / analytics.totalTaps) * 100}%` }} />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiMapPin className="text-blue-600" /> Performance by Country
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.countryStats)
              .sort((a, b) => b[1].taps - a[1].taps)
              .map(([country, data]) => (
                <div key={country}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{country}</span>
                    <span className="text-gray-500">{data.taps.toLocaleString()} taps</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(data.taps / analytics.totalTaps) * 100}%` }} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Main Curve Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">{getChartIcon()} {getChartTitle()}</h3>
          <div className="flex gap-2">
            <button onClick={() => {
              console.log("Set chart view: daily");
              setChartView('daily');
            }} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${chartView === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}><FiSun size={14} /> Daily</button>
            <button onClick={() => {
              console.log("Set chart view: monthly");
              setChartView('monthly');
            }} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${chartView === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}><FiCalendar size={14} /> Monthly</button>
            <button onClick={() => {
              console.log("Set chart view: lifetime");
              setChartView('lifetime');
            }} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${chartView === 'lifetime' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}><FiZap size={14} /> Lifetime</button>
          </div>
        </div>
        <InteractiveChart 
          data={getChartData().map(d => [d.label, d.value])} 
          title={getChartTitle()} 
          color={getChartColors()} 
          unit="taps" 
        />
      </div>

      {/* Performance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><FiPieChart className="text-purple-600" /> Performance Distribution</h3>
          <div className="space-y-6">
            {(() => {
              const high = analytics.machinePerformance.filter(m => m.taps > 1000).length;
              const medium = analytics.machinePerformance.filter(m => m.taps >= 100 && m.taps <= 1000).length;
              const low = analytics.machinePerformance.filter(m => m.taps < 100 && m.taps > 0).length;
              const inactive = analytics.machinePerformance.filter(m => m.taps === 0).length;
              const total = analytics.machinePerformance.length;
              return [
                { range: "High Volume (>1000 taps)", count: high, percent: ((high/total)*100).toFixed(1), color: "bg-green-500" },
                { range: "Medium Volume (100-1000 taps)", count: medium, percent: ((medium/total)*100).toFixed(1), color: "bg-blue-500" },
                { range: "Low Volume (<100 taps)", count: low, percent: ((low/total)*100).toFixed(1), color: "bg-yellow-500" },
                { range: "Inactive (0 taps)", count: inactive, percent: ((inactive/total)*100).toFixed(1), color: "bg-gray-400" }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-2 text-gray-600">
                    <span>{item.range}</span>
                    <span>{item.count} machines ({item.percent}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full">
                    <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-2xl text-white">
            <FiAward className="text-2xl mb-2 opacity-80" />
            <h3 className="text-xs font-bold opacity-80">Peak Performance Day</h3>
            <p className="text-xl font-bold mt-1">{analytics.peakDay !== 'N/A' ? new Date(analytics.peakDay).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-5 rounded-2xl text-white">
            <FiTrendingUp className="text-2xl mb-2 opacity-80" />
            <h3 className="text-xs font-bold opacity-80">Best Performing Month</h3>
            <p className="text-xl font-bold mt-1">{analytics.peakMonth}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-5 rounded-2xl text-white">
            <FiActivity className="text-2xl mb-2 opacity-80" />
            <h3 className="text-xs font-bold opacity-80">Peak Year</h3>
            <p className="text-xl font-bold mt-1">{analytics.peakYear}</p>
          </div>
        </div>
      </div>

      {/* Machine Performance Table */}
      {/* Machine Performance Table */}
{/* Machine Performance Table */}
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
  <div className="p-5 border-b border-gray-100 flex justify-between items-center">
    <h3 className="font-bold text-gray-800 flex items-center gap-2">
      <FiCpu className="text-indigo-600" /> Machine Performance Breakdown
    </h3>
    <span className="text-xs text-gray-500">{analytics.machinePerformance.length} machines</span>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-100">
        <tr className="text-left">
          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Machine ID</th>
          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Location</th>
          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Total Taps</th>
          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Revenue</th>
          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Performance</th>
          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Sanitization</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {analytics.machinePerformance.map((machine) => (
          <tr key={machine.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-sm font-mono font-bold text-gray-900">{machine.id}</td>
            <td className="px-6 py-4 text-xs text-gray-500">{machine.state}, {machine.country}</td>
            <td className="px-6 py-4 text-sm font-bold text-gray-700">{machine.taps.toLocaleString()}</td>
            <td className="px-6 py-4 text-sm font-bold text-green-600">₹{machine.revenue.toLocaleString()}</td>
            <td className="px-6 py-4">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${machine.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {machine.status}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (machine.taps / analytics.totalTaps) * 100)}%` }} />
                </div>
                <span className="text-[10px] text-gray-500">{((machine.taps / analytics.totalTaps) * 100).toFixed(1)}%</span>
              </div>
            </td>
            <td className="px-6 py-4">
              <SanitizationIndicator 
                machineId={machine.id}
                totalTaps={machine.taps}
                containerSize={5}
                usagePerTap={0.012}
              />
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

export default Analytics;