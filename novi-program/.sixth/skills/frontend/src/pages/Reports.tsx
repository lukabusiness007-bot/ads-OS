import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueData {
  totalRevenue: number;
  totalPayments: number;
  revenueData: Array<{ date: string; amount: number }>;
}

interface AppointmentData {
  totalAppointments: number;
  appointmentsByStatus: Array<{ status: string; count: number }>;
  appointmentsByService: Array<{ serviceName: string; count: number }>;
}

interface ServiceData {
  totalServices: number;
  totalRevenue: number;
  totalBookings: number;
  services: Array<{
    name: string;
    price: number;
    duration: number;
    bookingCount: number;
    totalRevenue: number;
  }>;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30'); // days
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchReports();
  }, [isAuthenticated, navigate, period]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };

      const [revenue, appointments, services] = await Promise.all([
        axios.get('/api/reports/revenue', { params }),
        axios.get('/api/reports/appointments-summary', { params }),
        axios.get('/api/reports/services-summary', { params }),
      ]);

      setRevenueData(revenue.data);
      setAppointmentData(appointments.data);
      setServiceData(services.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Učitavanje izvještaja...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Izvještaji i Statistika</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Period selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center gap-4">
          <label className="font-semibold text-gray-700">Vremenski period:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Prošla sedmica (7 dana)</option>
            <option value="30">Prošli mjesec (30 dana)</option>
            <option value="90">Prošla tri mjeseca (90 dana)</option>
            <option value="365">Prošla godina (365 dana)</option>
          </select>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Ukupan Prihod</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              ${revenueData?.totalRevenue.toFixed(2) || '0.00'}
            </div>
            <div className="text-gray-500 text-sm mt-2">{revenueData?.totalPayments || 0} uplaćenih faktuma</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Broj Termina</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {appointmentData?.totalAppointments || 0}
            </div>
            <div className="text-gray-500 text-sm mt-2">Ukupno zakazanih termina</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Brojnih Servisa</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">
              {appointmentData?.appointmentsByService.length || 0}
            </div>
            <div className="text-gray-500 text-sm mt-2">Dostupnih servisa</div>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        {revenueData && revenueData.revenueData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Trend Prihoda</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: any) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  name="Prihod"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Appointments by Status and Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Appointments Status Pie Chart */}
          {appointmentData && appointmentData.appointmentsByStatus.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Termini po Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={appointmentData.appointmentsByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {appointmentData.appointmentsByStatus.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {appointmentData.appointmentsByStatus.map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-gray-700 capitalize">{item.status}</span>
                    </div>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services Popularity */}
          {appointmentData && appointmentData.appointmentsByService.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Popularnost Servisa</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={appointmentData.appointmentsByService}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="serviceName" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Broj Termina" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Services Table */}
        {serviceData && serviceData.services.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Detalji Servisa</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Naziv Servisa</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cijena</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trajanje (min)</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Broj Termina</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Prihod</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceData.services.map((service, index) => (
                    <tr key={service.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-3 text-gray-800">{service.name}</td>
                      <td className="px-6 py-3 text-gray-800">${service.price.toFixed(2)}</td>
                      <td className="px-6 py-3 text-gray-800">{service.duration}</td>
                      <td className="px-6 py-3 text-gray-800 font-semibold">{service.bookingCount}</td>
                      <td className="px-6 py-3 text-green-600 font-semibold">
                        ${service.totalRevenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between">
              <span className="font-semibold text-gray-700">Ukupno:</span>
              <div className="flex gap-12">
                <span className="font-semibold text-gray-700">{serviceData.totalBookings} termina</span>
                <span className="font-semibold text-green-600">${serviceData.totalRevenue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
