// Pages/Customer/CreateReport.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../config_portal/axios'; 
import { useAuth } from '../../context/AuthContext';

const CustomerCreateReport = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    subject: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.subject.trim()) {
      setError('Subject is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (formData.subject.length > 200) {
      setError('Subject cannot exceed 200 characters');
      return;
    }
    if (formData.description.length > 1000) {
      setError('Description cannot exceed 1000 characters');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axiosInstance.post('/customer/report/create', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/customer/reports');
        }, 2000);
      }
    } catch (err) {
      console.error('Error creating report:', err);
      setError(err.response?.data?.message || 'Failed to create report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/customer/reports"
          className="text-gray-500 hover:text-gray-700 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Create Report</h2>
          <p className="text-sm text-gray-500">Submit a new support request</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-medium text-green-800">Report submitted successfully!</p>
              <p className="text-sm text-green-600">Redirecting to your reports...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
        {/* Subject Field */}
        <div className="mb-5">
          <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-500 transition ${
              error && !formData.subject.trim() ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Briefly describe your issue..."
            value={formData.subject}
            onChange={handleChange}
            maxLength="200"
            disabled={loading || success}
            autoFocus
          />
          <div className="flex justify-between mt-1">
            <p className="text-sm text-gray-500">
              {formData.subject.length}/200 characters
            </p>
            {formData.subject.length > 180 && (
              <p className="text-sm text-yellow-600">
                {200 - formData.subject.length} characters remaining
              </p>
            )}
          </div>
        </div>

        {/* Description Field */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows="6"
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-500 transition resize-none ${
              error && !formData.description.trim() ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Provide detailed information about your issue..."
            value={formData.description}
            onChange={handleChange}
            maxLength="1000"
            disabled={loading || success}
          />
          <div className="flex justify-between mt-1">
            <p className="text-sm text-gray-500">
              {formData.description.length}/1000 characters
            </p>
            {formData.description.length > 900 && (
              <p className="text-sm text-yellow-600">
                {1000 - formData.description.length} characters remaining
              </p>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">💡 Tips for a good report:</h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Be clear and specific about your issue</li>
            <li>Include any relevant order or payment IDs</li>
            <li>Mention what you expected vs what happened</li>
            <li>Include steps to reproduce the issue if applicable</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                Submitting...
              </span>
            ) : (
              'Submit Report'
            )}
          </button>
          <Link
            to="/customer/reports"
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition text-center font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default CustomerCreateReport;