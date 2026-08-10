import React, { useState, useEffect } from 'react';
import axiosInstance from '../config_portal/axios';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Calendar, 
  Wifi, 
  User, 
  Mail, 
  Phone, 
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Coins
} from 'lucide-react';
import Loading from './loading';

export default function Payments() {
  const { userRole } = useAuth();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    mqttAmount: 0,
    razorpayAmount: 0,
    count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Manual verify states
  const [manualQrId, setManualQrId] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState(null); // { type: 'success' | 'info' | 'error', text: string }
  
  // Filters
  const [searchMachine, setSearchMachine] = useState('');
  const [filterMethod, setFilterMethod] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/admin/payments/history');
      if (response.data?.success) {
        setPayments(response.data.payments || []);
        setSummary(response.data.summary || {
          totalAmount: 0,
          mqttAmount: 0,
          razorpayAmount: 0,
          count: 0
        });
      } else {
        setError('Failed to fetch payment history.');
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.response?.data?.message || 'Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyManual = async (e) => {
    e.preventDefault();
    if (!manualQrId.trim()) return;

    setVerifyLoading(true);
    setVerifyMessage(null);
    try {
      const response = await axiosInstance.post('/api/payment/verify-manual', { qr_id: manualQrId.trim() });
      if (response.data?.success) {
        if (response.data.status === 'paid') {
          setVerifyMessage({ type: 'success', text: response.data.message || 'Payment successfully verified and logged!' });
          setManualQrId('');
          fetchPayments(); // Reload history logs
        } else {
          setVerifyMessage({ type: 'info', text: response.data.message || `Checked status: payment is ${response.data.status}.` });
        }
      }
    } catch (err) {
      console.error('Verification failed:', err);
      setVerifyMessage({ type: 'error', text: err.response?.data?.error || 'Failed to verify transaction ID.' });
    } finally {
      setVerifyLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filtered Payments
  const filteredPayments = payments
    .filter(payment => {
      const matchesMachine = payment.machineId?.toLowerCase().includes(searchMachine.toLowerCase());
      const matchesMethod = filterMethod === 'All' || payment.method === filterMethod;
      const matchesStatus = filterStatus === 'All' || payment.status === filterStatus;
      return matchesMachine && matchesMethod && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  if (loading) return <Loading />;

  const isAdmin = userRole === 'admin';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="text-blue-600" /> Transaction History
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isAdmin 
              ? 'View all global telemetry and online payment links logs'
              : 'Audit transactions and telemetry payments for your assigned kiosks'}
          </p>
        </div>
        
        {/* Verify Action & Refresh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleVerifyManual} className="flex gap-2 bg-white p-1.5 border border-gray-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500 max-w-md w-full">
            <input
              type="text"
              placeholder="Verify Payment Link ID..."
              value={manualQrId}
              onChange={(e) => setManualQrId(e.target.value)}
              className="px-3 py-1.5 outline-none text-sm w-full bg-transparent"
              disabled={verifyLoading}
            />
            <button
              type="submit"
              disabled={verifyLoading || !manualQrId.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {verifyLoading ? 'Verifying...' : 'Verify Link'}
            </button>
          </form>
          
          <button
            onClick={fetchPayments}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-all animate-hover"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {verifyMessage && (
        <div className={`p-4 border rounded-xl text-sm flex items-center justify-between gap-3 ${
          verifyMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
          verifyMessage.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-700' :
          'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <span>{verifyMessage.text}</span>
          </div>
          <button 
            onClick={() => setVerifyMessage(null)}
            className="text-xs font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3 text-sm">
          <AlertCircle size={20} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-sm text-gray-500 font-medium">Total Volume</p>
            <h3 className="text-3xl font-black text-gray-900">₹{summary.totalAmount.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 font-normal">All successful pours & orders</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-sm text-gray-500 font-medium">Razorpay Gateway</p>
            <h3 className="text-3xl font-black text-emerald-600">₹{summary.razorpayAmount.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 font-normal">Online payment link collection</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CreditCard size={24} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-sm text-gray-500 font-medium">Operator Telemetry (MQTT)</p>
            <h3 className="text-3xl font-black text-indigo-600">₹{summary.mqttAmount.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 font-normal">Manual & direct operator pours</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Coins size={24} />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search by Machine */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search Machine ID..."
              value={searchMachine}
              onChange={(e) => setSearchMachine(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Filter by Method */}
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 shrink-0" size={16} />
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="All">All Methods</option>
              <option value="Razorpay">Razorpay</option>
              <option value="MQTT">MQTT Telemetry</option>
            </select>
          </div>

          {/* Filter by Status */}
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-400 shrink-0" size={16} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="All">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs shrink-0 font-medium">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tables View */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500 uppercase font-semibold tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Machine ID</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Transaction ID</th>
                {isAdmin && (
                  <>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Contact</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(payment.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-gray-900">
                    {payment.machineId}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ₹{payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      payment.method === 'Razorpay' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }`}>
                      {payment.method === 'Razorpay' ? <CreditCard size={12} /> : <Wifi size={12} />}
                      {payment.method === 'Razorpay' ? 'Razorpay' : 'MQTT'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {payment.paymentId}
                  </td>
                  {isAdmin && (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-gray-900 font-medium">
                          <User size={14} className="text-gray-400" />
                          {payment.customerName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs text-gray-500">
                          {payment.customerEmail && payment.customerEmail !== 'N/A' && (
                            <div className="flex items-center gap-1">
                              <Mail size={12} className="text-gray-400" />
                              <span>{payment.customerEmail}</span>
                            </div>
                          )}
                          {payment.customerPhone && payment.customerPhone !== 'N/A' && (
                            <div className="flex items-center gap-1">
                              <Phone size={12} className="text-gray-400" />
                              <span>{payment.customerPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <AlertCircle className="mx-auto text-gray-300 mb-2" size={40} />
            <p className="font-medium text-sm">No transaction records found</p>
          </div>
        )}
      </div>
    </div>
  );
}
