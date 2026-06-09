import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  BarChart3,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  Clock,
} from 'lucide-react';

interface DashboardStats {
  todayAppointments: Array<{
    id: string;
    startTime: string;
    client: { fullName: string };
    service: { name: string };
  }>;
  todayAppointmentCount: number;
  newClientsThisWeek: number;
  pendingInvoices: number;
  unpaidAmount: number;
  monthlyRevenue: number;
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/reports/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/clients', label: 'Klijenti', icon: Users },
    { to: '/services', label: 'Usluge', icon: Settings },
    { to: '/appointments', label: 'Termini', icon: Calendar },
    { to: '/invoices', label: 'Fakture', icon: FileText },
    { to: '/reports', label: 'Izvještaji', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{user?.salonName || 'Salon'}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-4 py-2 text-slate-300 hover:text-white flex items-center gap-2 transition rounded-lg hover:bg-slate-700/50"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-slate-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Odjava</span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Dobrodošao nazad! 👋</h1>
          <p className="text-slate-400">Evo pregleda vašeg salona</p>
        </div>

        {/* Statistics */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full"></div>
              </div>
            </div>
            <p className="text-slate-400 mt-4">Učitavanje statistike...</p>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Revenue Card */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition group">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-400 text-sm font-medium">Mjesečni prihod</p>
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20 transition">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-2">
                  ${stats.monthlyRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-slate-400">Prošlih 30 dana</p>
              </div>

              {/* Appointments Card */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition group">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-400 text-sm font-medium">Termini danas</p>
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-2">{stats.todayAppointmentCount}</p>
                <p className="text-xs text-slate-400">Zakazani termini</p>
              </div>

              {/* Pending Invoices Card */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition group">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-400 text-sm font-medium">Neplaćene fakture</p>
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/20 transition">
                    <FileText className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-2">{stats.pendingInvoices}</p>
                <p className="text-xs text-slate-400">${stats.unpaidAmount.toFixed(2)} do naplate</p>
              </div>

              {/* New Clients Card */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition group">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-400 text-sm font-medium">Novi klijenti</p>
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-2">{stats.newClientsThisWeek}</p>
                <p className="text-xs text-slate-400">Ove sedmice</p>
              </div>
            </div>

            {/* Today's Appointments */}
            {stats.todayAppointments.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-bold text-white">Termini danas</h2>
                </div>
                <div className="space-y-3">
                  {stats.todayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition"
                    >
                      <div>
                        <p className="font-semibold text-white">{appointment.client.fullName}</p>
                        <p className="text-sm text-slate-400">{appointment.service.name}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="font-semibold text-blue-400">
                          {new Date(appointment.startTime).toLocaleTimeString('sr-RS', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(appointment.startTime).toLocaleDateString('sr-RS')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Brze akcije</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {navLinks.slice(0, 4).map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="group bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 hover:border-slate-600 hover:bg-slate-800 transition"
                    >
                      <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center group-hover:bg-slate-600 transition mb-4">
                        <Icon className="w-6 h-6 text-slate-300 group-hover:text-white transition" />
                      </div>
                      <h3 className="font-semibold text-white mb-2">{link.label}</h3>
                      <p className="text-sm text-slate-400 group-hover:text-slate-300 transition">
                        Upravljaj {link.label.toLowerCase()}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
