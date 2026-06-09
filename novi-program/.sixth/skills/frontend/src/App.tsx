import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { Services } from './pages/Services';
import { Appointments } from './pages/Appointments';
import InvoicesPage from './pages/Invoices';
import InvoiceDetailsPage from './pages/InvoiceDetails';
import ReportsPage from './pages/Reports';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute element={<Dashboard />} />}
          />
          <Route path="/clients" element={<ProtectedRoute element={<Clients />} />} />
          <Route path="/services" element={<ProtectedRoute element={<Services />} />} />
          <Route
            path="/appointments"
            element={<ProtectedRoute element={<Appointments />} />}
          />
          <Route
            path="/invoices"
            element={<ProtectedRoute element={<InvoicesPage />} />}
          />
          <Route
            path="/invoices/:id"
            element={<ProtectedRoute element={<InvoiceDetailsPage />} />}
          />
          <Route
            path="/reports"
            element={<ProtectedRoute element={<ReportsPage />} />}
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
