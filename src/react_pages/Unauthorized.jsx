// pages/Unauthorized.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiHome } from 'react-icons/fi';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiAlertCircle className="text-4xl text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all"
        >
          <FiHome />
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;