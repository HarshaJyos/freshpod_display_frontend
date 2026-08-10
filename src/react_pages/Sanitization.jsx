import React, { useState, useEffect, useMemo } from 'react';
import { FiDroplet, FiX, FiRefreshCw, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import axiosInstance from '../config_portal/axios';

// Ultra Compact Indicator
const SanitizationIndicator = ({ totalTaps, machineId, containerSize = 5, usagePerTap = 0.012 }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refillData, setRefillData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Calculate percentage based on refill data
  const calculateCurrentPercentage = () => {
    if (!refillData || !refillData.hasRefill) {
      // If no refill, calculate from total taps
      const usedLiquid = totalTaps * usagePerTap;
      const remaining = Math.max(0, containerSize - usedLiquid);
      return Math.min(100, (remaining / containerSize) * 100);
    }
    
    // If refill exists, calculate from last refill
    const startTapCount = refillData.startTapCount || 0;
    const tapsSinceRefill = Math.max(0, totalTaps - startTapCount);
    const usedLiquid = tapsSinceRefill * usagePerTap;
    const remaining = Math.max(0, containerSize - usedLiquid);
    return Math.min(100, (remaining / containerSize) * 100);
  };

  const percentage = calculateCurrentPercentage();

  useEffect(() => {
    const fetchRefillData = async () => {
      if (!machineId) {
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/api/refill/${machineId}/start-tapcount`);
        const data = response.data;
        
        if (data.success && data.data && data.data.hasRefill) {
          setRefillData(data.data);
        } else {
          setRefillData({ hasRefill: false, startTapCount: 0 });
        }
      } catch (error) {
        console.error('Error fetching refill data:', error);
        setRefillData({ hasRefill: false, startTapCount: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchRefillData();
  }, [machineId]);

  const hasRefill = refillData?.hasRefill || false;

  const getStatusDot = () => {
    if (loading) return '⏳';
    if (percentage > 60) return '🟦';
    if (percentage > 30) return '🟨';
    return '🟥';
  };

  const getStatusColor = () => {
    if (percentage > 60) return 'text-blue-600';
    if (percentage > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 cursor-default">
        <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-400">Loading</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
        title="Click for sanitization details"
      >
        <span className="text-sm">{getStatusDot()}</span>
        <span className={`text-xs font-bold ${getStatusColor()}`}>
          {Math.round(percentage)}%
        </span>
        <FiDroplet className={`text-[10px] ${
          percentage > 60 ? 'text-blue-400' : 
          percentage > 30 ? 'text-yellow-400' : 
          'text-red-400'
        } group-hover:opacity-100 opacity-50 transition-opacity`} />
        {hasRefill && (
          <span className="text-[8px] text-green-400 ml-0.5">✓</span>
        )}
      </button>

      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  percentage > 60 ? 'bg-blue-100' : 
                  percentage > 30 ? 'bg-yellow-100' : 
                  'bg-red-100'
                }`}>
                  <FiDroplet className={`text-base ${
                    percentage > 60 ? 'text-blue-600' : 
                    percentage > 30 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Sanitization</h3>
                  <p className="text-[10px] text-gray-500 font-mono">#{machineId}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <FiX className="text-lg text-gray-500" />
              </button>
            </div>
            
            <div className="p-4">
              <SanitizationLevel 
                machineId={machineId}
                totalTaps={totalTaps}
                containerSize={containerSize}
                usagePerTap={usagePerTap}
                externalRefillData={refillData}
                onRefillComplete={() => {
                  window.location.reload();
                }}
              />
            </div>
            
            <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 rounded-b-2xl flex justify-between items-center">
              <span className="text-[10px] text-gray-400">
                {new Date().toLocaleString()}
              </span>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// SanitizationLevel Component
const SanitizationLevel = ({ 
  machineId, 
  totalTaps, 
  containerSize = 5, 
  usagePerTap = 0.012,
  externalRefillData = null,
  onRefillComplete
}) => {
  const [liquidLevel, setLiquidLevel] = useState(containerSize);
  const [isRefilling, setIsRefilling] = useState(false);
  const [refillProgress, setRefillProgress] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [startTapCount, setStartTapCount] = useState(0);
  const [refillStartTime, setRefillStartTime] = useState(null);
  const [hasRefill, setHasRefill] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refillSuccess, setRefillSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [refillQuantity, setRefillQuantity] = useState(containerSize);

  useEffect(() => {
    if (externalRefillData) {
      setStartTapCount(externalRefillData.startTapCount || 0);
      setRefillStartTime(externalRefillData.refillStartTime || null);
      setHasRefill(externalRefillData.hasRefill || false);
      setIsLoading(false);
      if (externalRefillData.containerSize) {
        setRefillQuantity(externalRefillData.containerSize);
      }
    } else {
      fetchRefillData();
    }
  }, [machineId, externalRefillData]);

  const fetchRefillData = async () => {
    if (!machineId) return;
    
    try {
      const response = await axiosInstance.get(`/api/refill/${machineId}/start-tapcount`);
      const data = response.data;

      if (data.success && data.data && data.data.hasRefill) {
        setStartTapCount(data.data.startTapCount);
        setRefillStartTime(data.data.refillStartTime);
        setHasRefill(true);
        if (data.data.containerSize) {
          setRefillQuantity(data.data.containerSize);
        }
      } else {
        setStartTapCount(0);
        setRefillStartTime(null);
        setHasRefill(false);
      }
    } catch (error) {
      console.error('Error fetching refill data:', error);
      setStartTapCount(0);
      setRefillStartTime(null);
      setHasRefill(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Calculate liquid level based on refill
  useEffect(() => {
    if (!isLoading && totalTaps !== undefined) {
      if (hasRefill) {
        // Calculate from last refill
        const tapsSinceRefill = Math.max(0, totalTaps - startTapCount);
        const usedLiquid = tapsSinceRefill * usagePerTap;
        const remaining = Math.max(0, refillQuantity - usedLiquid);
        setLiquidLevel(remaining);
        setShowWarning(remaining < refillQuantity * 0.2);
      } else {
        // No refill, calculate from total taps
        const usedLiquid = totalTaps * usagePerTap;
        const remaining = Math.max(0, refillQuantity - usedLiquid);
        setLiquidLevel(remaining);
        setShowWarning(remaining < refillQuantity * 0.2);
      }
    }
  }, [totalTaps, usagePerTap, isLoading, refillQuantity, hasRefill, startTapCount]);

  const percentage = useMemo(() => {
    return Math.min(100, (liquidLevel / refillQuantity) * 100);
  }, [liquidLevel, refillQuantity]);

  const tapsSinceRefill = useMemo(() => {
    if (hasRefill) {
      return Math.max(0, totalTaps - startTapCount);
    }
    return totalTaps;
  }, [totalTaps, startTapCount, hasRefill]);

  const estimatedTapsRemaining = useMemo(() => {
    if (usagePerTap === 0) return 0;
    return Math.floor(liquidLevel / usagePerTap);
  }, [liquidLevel, usagePerTap]);

  const usedLiters = useMemo(() => {
    return refillQuantity - liquidLevel;
  }, [refillQuantity, liquidLevel]);

  const handleRefill = async () => {
    if (isRefilling) return;
    
    setError(null);
    setIsRefilling(true);
    setRefillProgress(0);
    setRefillSuccess(false);
    
    try {
      const currentTapCount = totalTaps || 0;
      
      console.log('🔄 Starting refill for:', { 
        machineId, 
        currentTapCount, 
        refillQuantity
      });
      
      const response = await axiosInstance.post(`/api/refill/${machineId}`, {
        tapCount: currentTapCount,
        containerSize: refillQuantity,
        usagePerTap: usagePerTap
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Failed to start refill');
      }

      console.log('✅ Refill response:', data);

      // Update state - set to 100%
      setStartTapCount(currentTapCount);
      setRefillStartTime(new Date().toISOString());
      setHasRefill(true);
      setRefillSuccess(true);
      setLiquidLevel(refillQuantity);

      // Show refill progress animation
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setRefillProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setIsRefilling(false);
          if (onRefillComplete) {
            setTimeout(onRefillComplete, 1500);
          }
        }
      }, 50);

    } catch (error) {
      console.error('❌ Refill error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to start refill');
      setIsRefilling(false);
    }
  };

  const getLiquidColor = () => {
    if (percentage > 60) return 'from-blue-500 to-blue-400';
    if (percentage > 30) return 'from-yellow-500 to-yellow-400';
    return 'from-red-500 to-red-400';
  };

  const getGlowColor = () => {
    if (percentage > 60) return 'shadow-blue-500/20';
    if (percentage > 30) return 'shadow-yellow-500/20';
    return 'shadow-red-500/20';
  };

  const formatLiters = (liters) => {
    if (liters < 0.001) return '0 mL';
    if (liters < 1) return `${Math.round(liters * 1000)} mL`;
    return `${liters.toFixed(2)} L`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {refillSuccess && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <FiCheckCircle className="text-green-500 text-sm" />
          <p className="text-[10px] text-green-700 font-medium">✅ Refill completed! Tank is 100% full.</p>
        </div>
      )}

      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            percentage > 60 ? 'bg-blue-500' : 
            percentage > 30 ? 'bg-yellow-500' : 
            'bg-red-500'
          } animate-pulse`} />
          <span className="text-xs font-medium text-gray-700">
            {percentage > 60 ? 'Good' : percentage > 30 ? 'Moderate' : 'Critical'}
          </span>
        </div>
        <span className="text-sm font-bold text-gray-900">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FiDroplet className="text-blue-500 text-sm" />
            <span className="text-xs font-medium text-gray-700">Container</span>
          </div>
          <span className="text-xs font-bold text-gray-800">{refillQuantity}L</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {usagePerTap * 1000}ml/tap • {Math.round(refillQuantity / usagePerTap).toLocaleString()} taps/tank
        </p>
      </div>

      <div className="p-2 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          Total taps: <span className="font-bold">{totalTaps.toLocaleString()}</span>
        </p>
        {hasRefill && (
          <>
            <p className="text-xs text-blue-700">
              Taps since refill: <span className="font-bold">{tapsSinceRefill.toLocaleString()}</span>
            </p>
            <p className="text-xs text-blue-700">
              Refilled at: <span className="font-bold">{startTapCount.toLocaleString()}</span> taps
            </p>
          </>
        )}
        <p className="text-xs text-blue-700">
          Used: <span className="font-bold">{formatLiters(usedLiters)}</span>
        </p>
      </div>

      <div className="relative">
        <div className="relative bg-gray-100 rounded-xl p-0.5 border-2 border-gray-300">
          <div 
            className={`relative h-12 rounded-lg bg-gradient-to-r ${getLiquidColor()} transition-all duration-1000 ease-in-out ${getGlowColor()} shadow-lg`}
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse" />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 animate-wave" />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${
            percentage > 60 ? 'text-blue-700' : 
            percentage > 30 ? 'text-yellow-700' : 
            'text-red-700'
          }`}>
            {Math.round(percentage)}%
          </span>
        </div>

        <div className="absolute -top-2 right-3 w-6 h-2 bg-gray-300 rounded-t border-x-2 border-t-2 border-gray-300" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-[8px] text-gray-400 font-bold uppercase">Remaining</p>
          <p className={`text-xs font-bold ${
            percentage > 60 ? 'text-blue-600' : 
            percentage > 30 ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {formatLiters(liquidLevel)}
          </p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-[8px] text-gray-400 font-bold uppercase">Used</p>
          <p className="text-xs font-bold text-gray-700">{formatLiters(usedLiters)}</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-[8px] text-gray-400 font-bold uppercase">Taps Left</p>
          <p className="text-xs font-bold text-gray-700">{estimatedTapsRemaining.toLocaleString()}</p>
        </div>
      </div>

      {showWarning && !isRefilling && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-1.5 animate-pulse">
          <FiAlertTriangle className="text-red-500 text-sm" />
          <p className="text-[10px] text-red-700 font-medium">
            ⚠️ Only {formatLiters(liquidLevel)} left ({estimatedTapsRemaining} taps)
          </p>
        </div>
      )}

      <button
        onClick={handleRefill}
        disabled={isRefilling}
        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
          isRefilling 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg transform hover:scale-[1.01]'
        }`}
      >
        {isRefilling ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white" />
            Refilling... {Math.round(refillProgress)}%
          </>
        ) : (
          <>
            <FiRefreshCw className="text-sm" />
            {hasRefill ? 'Refill' : 'Start Refill'} ({refillQuantity}L)
          </>
        )}
      </button>

      {isRefilling && (
        <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${refillProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export { SanitizationIndicator, SanitizationLevel };