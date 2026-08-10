// Pages/Customer/ReportDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../config_portal/axios'; 
import { useAuth } from '../../context/AuthContext';

const CustomerReportDetail = () => {
  const { reportId } = useParams();
  const { token } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReportDetail();
  }, [reportId]);

  const fetchReportDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get(`/customer/report/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setReport(response.data.report);
      } else {
        setError('Report not found');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.message || 'Failed to fetch report details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'solved') {
      return (
        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium flex items-center gap-2">
          <span>✅</span> Solved
        </span>
      );
    }
    return (
      <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-medium flex items-center gap-2 animate-pulse">
        <span>⏳</span> Pending
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading report details...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Report Not Found</h3>
          <p className="text-gray-500 mb-4">{error || 'The report you are looking for does not exist.'}</p>
          <Link
            to="/customer/reports"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Back Button */}
      <Link
        to="/customer/reports"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Reports
      </Link>

      {/* Report Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-800">{report.subject}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {getStatusBadge(report.status)}
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-500">ID: {report.reportId}</span>
              </div>
            </div>
            <div className="text-sm text-gray-500 text-left sm:text-right">
              <div>Submitted: {formatDate(report.createdAt)}</div>
              {report.resolvedAt && (
                <div className="text-green-600">Resolved: {formatDate(report.resolvedAt)}</div>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">Customer Information</h4>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-500">Name:</span> {report.customer?.name || 'N/A'}</p>
              <p><span className="text-gray-500">Email:</span> {report.customer?.email || 'N/A'}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Description</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
            </div>
          </div>

          {/* Resolution (if solved) */}
          {report.status === 'solved' && report.resolutionNotes && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <span>✅</span> Resolution
              </h4>
              <p className="text-gray-700">{report.resolutionNotes}</p>
              {report.resolvedAt && (
                <p className="text-sm text-green-600 mt-2">
                  Resolved on: {formatDate(report.resolvedAt)}
                </p>
              )}
            </div>
          )}

          {/* Status Message for Pending */}
          {report.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <span>⏳</span> Status
              </h4>
              <p className="text-gray-700">
                Your report is currently being reviewed. You will be notified once it's resolved.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerReportDetail;