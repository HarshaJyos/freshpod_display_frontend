// Pages/Operator/Dashboard.jsx - CORRECTED VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../config_portal/axios';
import { 
  FiShield, FiActivity, FiDollarSign, FiPlay, FiSquare, 
  FiMapPin, FiRefreshCw, FiCheckCircle, FiAlertCircle, 
  FiBarChart2, FiClock, FiZap, FiTrendingUp,
    // ← Added missing import
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const OperatorDashboard = () => {
  const { user, accessToken } = useAuth();
  const [machines, setMachines] = useState([]);
  const [stats, setStats] = useState({
    totalMachines: 0,
    activeMachines: 0,
    totalCyclesToday: 0,
    totalRevenueToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [activeSessions, setActiveSessions] = useState({});
  const [countdowns, setCountdowns] = useState({});

  // Estimated cycle time in seconds (based on ESP32 code: ~5.5 minutes = 330 seconds)
  const CYCLE_DURATION_SECONDS = 330; // 5 minutes 30 seconds

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const updatedCountdowns = {};
      
      Object.keys(countdowns).forEach(machineId => {
        const endTime = countdowns[machineId];
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        
        if (remaining > 0) {
          updatedCountdowns[machineId] = endTime;
        } else {
          // Countdown finished - session should be auto-completed
          handleAutoComplete(machineId);
        }
      });
      
      setCountdowns(updatedCountdowns);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [countdowns]);

  // Auto-complete cycle when countdown reaches zero
  const handleAutoComplete = async (machineId) => {
    const machine = machines.find(m => m._id === machineId);
    if (machine && activeSessions[machineId]?.running) {
      console.log(`⏰ Countdown finished for ${machine.machineId}`);
      toast.success(`✅ ${machine.machineId} disinfection cycle completed automatically!`);
      
      // Update local state
      setActiveSessions(prev => {
        const newState = { ...prev };
        delete newState[machineId];
        return newState;
      });
      
      fetchData();
    }
  };

  // Format countdown time (MM:SS)
  const formatCountdown = (endTime) => {
    const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get progress percentage
  const getProgressPercentage = (startTime) => {
    const elapsed = (Date.now() - startTime) / 1000;
    const progress = Math.min(100, (elapsed / CYCLE_DURATION_SECONDS) * 100);
    return Math.max(0, progress);
  };

  // Fetch machines and stats
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch machines
      const machinesRes = await axiosInstance.get('/operator/machines', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setMachines(machinesRes.data);
      
      // Fetch stats
      const statsRes = await axiosInstance.get('/operator/dashboard', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setStats(statsRes.data);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Start disinfection cycle
  const handleStartCycle = async () => {
    if (!selectedMachine) return;
    
    setActionInProgress(true);
    try {
      const response = await axiosInstance.post('/operator/machine/start', 
        { machineId: selectedMachine._id },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      if (response.data.success) {
        const startTime = Date.now();
        const endTime = startTime + (CYCLE_DURATION_SECONDS * 1000);
        
        toast.success(`🛡️ ${selectedMachine.machineId} disinfection started!`);
        toast(`⏱️ Cycle will complete in ~${Math.floor(CYCLE_DURATION_SECONDS / 60)} minutes`, {
          duration: 5000,
          icon: '⏰'
        });
        
        setShowStartModal(false);
        
        // Update local state with timer
        setActiveSessions(prev => ({
          ...prev,
          [selectedMachine._id]: { 
            running: true, 
            cycles: 0,
            startTime: startTime
          }
        }));
        
        setCountdowns(prev => ({
          ...prev,
          [selectedMachine._id]: endTime
        }));
        
        fetchData();
      } else {
        toast.error(response.data.message || 'Failed to start machine');
      }
    } catch (error) {
      console.error('Error starting cycle:', error);
      toast.error(error.response?.data?.message || 'Failed to start disinfection');
    } finally {
      setActionInProgress(false);
      setSelectedMachine(null);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Helmet Disinfection Dashboard
              </h1>
              <p className="text-gray-500 mt-1">
                Welcome back, {user?.name || 'Operator'}!
              </p>
              <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                <FiShield size={14} /> Monitor and manage helmet disinfection machines
              </p>
            </div>
            <button 
              onClick={fetchData}
              className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2"
            >
              <FiRefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiShield className="text-blue-600 text-xl" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats.totalMachines}</span>
            </div>
            <p className="text-gray-600 text-sm">Total Machines</p>
            <p className="text-xs text-green-600 mt-2">{stats.activeMachines} active</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiZap className="text-green-600 text-xl" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats.totalCyclesToday}</span>
            </div>
            <p className="text-gray-600 text-sm">Disinfections Today</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiDollarSign className="text-purple-600 text-xl" />
              </div>
              <span className="text-2xl font-bold text-gray-800">₹{stats.totalRevenueToday}</span>
            </div>
            <p className="text-gray-600 text-sm">Today's Revenue</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FiTrendingUp className="text-orange-600 text-xl" />
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {stats.totalMachines > 0 ? Math.round((stats.activeMachines / stats.totalMachines) * 100) : 0}%
              </span>
            </div>
            <p className="text-gray-600 text-sm">Utilization Rate</p>
          </div>
        </div>

        {/* Machines Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {machines.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl p-12 text-center border border-gray-100">
              <FiShield className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No machines assigned to you</p>
              <p className="text-sm text-gray-400 mt-1">Contact your administrator</p>
            </div>
          ) : (
            machines.map((machine) => {
              const isRunning = activeSessions[machine._id]?.running;
              const sessionCycles = activeSessions[machine._id]?.cycles || 0;
              const startTime = activeSessions[machine._id]?.startTime;
              const progress = startTime ? getProgressPercentage(startTime) : 0;
              const countdownEnd = countdowns[machine._id];
              
              return (
                <div
                  key={machine._id}
                  className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
                    isRunning ? 'border-green-300 ring-1 ring-green-300' : 'border-gray-100'
                  }`}
                >
                  <div className={`h-1 w-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <FiShield className={isRunning ? 'text-green-500' : 'text-gray-400'} size={20} />
                          <h3 className="font-bold text-gray-900">{machine.machineId}</h3>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <FiMapPin size={12} /> {machine.location}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        isRunning ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isRunning ? (
                          <>
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            DISINFECTING
                          </>
                        ) : (
                          'READY'
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-gray-500">Today's Cycles</p>
                        <p className="text-lg font-bold text-gray-800">{machine.todaysCycles || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-gray-500">Price/Cycle</p>
                        <p className="text-sm font-bold text-blue-600">₹{machine.costPerCycle || 0}</p>
                      </div>
                    </div>

                    {/* COUNTDOWN TIMER DISPLAY */}
                    {isRunning && countdownEnd && (
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 mb-4 text-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {/* <FiTimer size={16} /> */}
                            <p className="text-[10px] font-bold uppercase">Time Remaining</p>
                          </div>
                          <p className="text-lg font-mono font-bold">{formatCountdown(countdownEnd)}</p>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-blue-400/30 rounded-full h-1.5 mt-2">
                          <div 
                            className="bg-white rounded-full h-1.5 transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        
                        <p className="text-[9px] text-blue-100 mt-2 text-center">
                          {Math.floor(progress)}% complete - Auto-records when finished
                        </p>
                      </div>
                    )}

                    {isRunning && (
                      <div className="bg-green-50 rounded-lg p-2 mb-4 text-center">
                        <p className="text-[10px] text-green-600 font-bold">CURRENT SESSION</p>
                        <p className="text-sm font-bold text-green-700">{sessionCycles} cycles completed</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {isRunning ? (
                        <>
                          <button
                            disabled
                            className="flex-1 py-2 bg-gray-400 text-white rounded-lg text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <FiCheckCircle size={14} /> Auto-Recording
                          </button>
                          <button
                            disabled
                            className="flex-1 py-2 bg-gray-400 text-white rounded-lg text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <FiSquare size={14} /> Auto-Stop
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedMachine(machine);
                            setShowStartModal(true);
                          }}
                          className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <FiPlay size={14} /> Start Disinfection
                        </button>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 text-[10px] text-gray-400">
                      <FiClock size={10} />
                      <span>Last disinfection: {machine.lastActive ? new Date(machine.lastActive).toLocaleString() : 'Not yet'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Start Modal */}
      {showStartModal && selectedMachine && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-5 border-b">
              <h2 className="text-xl font-bold">Start Disinfection</h2>
              <p className="text-sm text-gray-500">{selectedMachine.machineId}</p>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 mb-4">
                <p className="font-bold">⏱️ Estimated Time: ~5.5 minutes</p>
                <p>The machine will automatically record the cycle when complete.</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-xs text-yellow-700 mb-4">
                <p className="font-bold">⚠️ Before Starting:</p>
                <p>• Ensure helmet is placed properly</p>
                <p>• Check UV lamps are working</p>
                <p>• Close the door securely</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowStartModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button onClick={handleStartCycle} disabled={actionInProgress} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
                  {actionInProgress ? 'Starting...' : 'Start Disinfection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorDashboard;