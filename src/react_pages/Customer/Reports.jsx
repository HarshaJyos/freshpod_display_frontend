// Pages/Customer/Reports.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../config_portal/axios'; 
import { useAuth } from '../../context/AuthContext';

const CustomerReports = () => {
  const { user } = useAuth(); // We don't need token anymore, axiosInstance handles it
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, pending: 0, solved: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/customer/reports');
      
      console.log("📊 Reports response:", response.data);
      
      if (response.data.success) {
        setReports(response.data.reports);
        setStats(response.data.statistics);
      }
    } catch (err) {
      console.error("❌ Error fetching reports:", err);
      setError(err.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReports = () => {
    if (filter === 'all') return reports;
    return reports.filter(report => report.status === filter);
  };

  const getStatusBadge = (status) => {
    if (status === 'solved') {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          ✅ Solved
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium animate-pulse">
        ⏳ Pending
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredReports = getFilteredReports();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Reports</h2>
          <p className="text-sm text-gray-500 mt-1">Track your support requests</p>
        </div>
        <Link
          to="/customer/reports/create"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span>+</span> New Report
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Reports</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Solved</p>
          <p className="text-2xl font-bold text-green-600">{stats.solved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pending ({stats.pending})
        </button>
        <button
          onClick={() => setFilter('solved')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'solved' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Solved ({stats.solved})
        </button>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 text-lg">No reports found</p>
          {reports.length === 0 && (
            <Link
              to="/customer/reports/create"
              className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create your first report
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Link
              key={report.reportId}
              to={`/customer/reports/${report.reportId}`}
              className="block bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {report.subject}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {report.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      {getStatusBadge(report.status)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-400">
                    <span>ID: {report.reportId}</span>
                    <span>•</span>
                    <span>Submitted: {formatDate(report.createdAt)}</span>
                    {report.resolvedAt && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">Resolved: {formatDate(report.resolvedAt)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-gray-400 self-center sm:self-start">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerReports;