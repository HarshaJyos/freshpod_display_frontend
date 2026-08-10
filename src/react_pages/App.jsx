// App.jsx - PORTED FOR NEXT.JS
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components_portal/Sidebar';
import Header from '../components_portal/Header';
import Loading from './loading';
import LoginPage from './LoginPage';
import Unauthorized from './Unauthorized';
import Payments from './Payments';

// Admin Pages
import Dashboard from './Admin/Dashboard';
import Machine from './Admin/Machine';
import UserDirective from './Admin/UserDirective';
import Analytics from './Admin/Analytics';
import SystemHealth from './Admin/SystemHealth';
import Settings from './Admin/Settings';

// Customer Pages
import CustomerDashboard from './Customer/Dashboard';
import CustomerMachines from './Customer/Machines';
import CustomerAnalytics from './Customer/Analytics';

// Customer Report Pages
import CustomerReports from './Customer/Reports';
import CustomerCreateReport from './Customer/CreateReport';
import CustomerReportDetail from './Customer/ReportDetail';

// Dealership Pages
import DealershipDashboard from './Dealership/Dashboard';
import DealershipMachines from './Dealership/Machines';
import DealershipUsers from './Dealership/Users';
import DealershipAnalytics from './Dealership/Analytics';

// Operator Pages
import OperatorDashboard from './Operator/Dashboard';
import OperatorMachines from './Operator/Machines';
import OperatorHistory from './Operator/History';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, userRole, loading } = useAuth();
  
  if (loading) return <Loading />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

const Layout = ({ children }) => {
  const { userRole } = useAuth();
  const showSidebar = userRole === 'admin' || userRole === 'dealership' || userRole === 'customer' || userRole === 'operator';
  
  return (
    <div className="min-h-screen bg-gray-50">
      {showSidebar && <Sidebar />}
      {showSidebar && <Header />}
      <main className={`${showSidebar ? 'lg:pl-72 pt-20' : ''}`}>
        {children}
      </main>
    </div>
  );
};

function App() {
  const { loading, userRole } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin/machine" element={<ProtectedRoute allowedRoles={['admin']}><Layout><Machine /></Layout></ProtectedRoute>} />
      <Route path="/admin/user" element={<ProtectedRoute allowedRoles={['admin']}><Layout><UserDirective /></Layout></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><Layout><Analytics /></Layout></ProtectedRoute>} />
      <Route path="/admin/health" element={<ProtectedRoute allowedRoles={['admin']}><Layout><SystemHealth /></Layout></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['admin']}><Layout><Payments /></Layout></ProtectedRoute>} />
      
      {/* Dealership Routes */}
      <Route path="/dealership" element={<ProtectedRoute allowedRoles={['dealership']}><Layout><DealershipDashboard /></Layout></ProtectedRoute>} />
      <Route path="/dealership/machines" element={<ProtectedRoute allowedRoles={['dealership']}><Layout><DealershipMachines /></Layout></ProtectedRoute>} />
      <Route path="/dealership/users" element={<ProtectedRoute allowedRoles={['dealership']}><Layout><DealershipUsers /></Layout></ProtectedRoute>} />
      <Route path="/dealership/analytics" element={<ProtectedRoute allowedRoles={['dealership']}><Layout><DealershipAnalytics /></Layout></ProtectedRoute>} />
      <Route path="/dealership/settings" element={<ProtectedRoute allowedRoles={['dealership']}><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/dealership/payments" element={<ProtectedRoute allowedRoles={['dealership']}><Layout><Payments /></Layout></ProtectedRoute>} />
      
      {/* Customer Routes */}
      <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']}><Layout><CustomerDashboard /></Layout></ProtectedRoute>} />
      <Route path="/customer/machines" element={<ProtectedRoute allowedRoles={['customer']}><Layout><CustomerMachines /></Layout></ProtectedRoute>} />
      
      {/* Customer Report Routes */}
      <Route path="/customer/reports" element={<ProtectedRoute allowedRoles={['customer']}><Layout><CustomerReports /></Layout></ProtectedRoute>} />
      <Route path="/customer/reports/create" element={<ProtectedRoute allowedRoles={['customer']}><Layout><CustomerCreateReport /></Layout></ProtectedRoute>} />
      <Route path="/customer/reports/:reportId" element={<ProtectedRoute allowedRoles={['customer']}><Layout><CustomerReportDetail /></Layout></ProtectedRoute>} />
      
      <Route path="/customer/analytics" element={<ProtectedRoute allowedRoles={['customer']}><Layout><CustomerAnalytics /></Layout></ProtectedRoute>} />
      <Route path="/customer/settings" element={<ProtectedRoute allowedRoles={['customer']}><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/customer/payments" element={<ProtectedRoute allowedRoles={['customer']}><Layout><Payments /></Layout></ProtectedRoute>} />
      
      {/* Operator Routes */}
      <Route path="/operator" element={<ProtectedRoute allowedRoles={['operator']}><Layout><OperatorDashboard /></Layout></ProtectedRoute>} />
      <Route path="/operator/machines" element={<ProtectedRoute allowedRoles={['operator']}><Layout><OperatorMachines /></Layout></ProtectedRoute>} />
      <Route path="/operator/history" element={<ProtectedRoute allowedRoles={['operator']}><Layout><OperatorHistory /></Layout></ProtectedRoute>} />
      <Route path="/operator/payments" element={<ProtectedRoute allowedRoles={['operator']}><Layout><Payments /></Layout></ProtectedRoute>} />
      
      {/* Default Redirect based on role */}
      <Route path="/" element={
        userRole === 'admin' ? <Navigate to="/admin" replace /> :
        userRole === 'dealership' ? <Navigate to="/dealership" replace /> :
        userRole === 'customer' ? <Navigate to="/customer" replace /> :
        userRole === 'operator' ? <Navigate to="/operator" replace /> :
        <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;