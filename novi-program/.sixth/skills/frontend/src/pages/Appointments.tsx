import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Appointment {
  id: number;
  clientId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
}

interface Client {
  id: string;
  fullName: string;
}

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    serviceId: '',
    start_time: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [appointmentsRes, clientsRes, servicesRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/clients'),
        api.get('/services'),
      ]);
      setAppointments(appointmentsRes.data);
      setClients(clientsRes.data);
      setServices(servicesRes.data);
      setError('');
    } catch (err: any) {
      setError('Greška pri učitavanju podataka');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const service = services.find((s) => s.id === formData.serviceId);
      if (!service) return;

      // Calculate end_time based on service duration
      const startDate = new Date(formData.start_time);
      const endDate = new Date(startDate.getTime() + service.durationMinutes * 60000);

      await api.post('/appointments', {
        clientId: formData.clientId,
        serviceId: formData.serviceId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        notes: formData.notes,
      });
      
      setFormData({ clientId: '', serviceId: '', start_time: '', notes: '' });
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri dodavanju termina');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (confirm('Da li si sigurna da želiš obrisati ovaj termin?')) {
      try {
        await api.delete(`/appointments/${id}`);
        fetchData();
      } catch (err: any) {
        setError('Greška pri brisanju termina');
      }
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.fullName || 'Nepoznat klijent';
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service?.name || 'Nepoznata usluga';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('sr-RS');
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Termini</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          + Dodaj novi termin
        </button>

        {showForm && (
          <form onSubmit={handleAddAppointment} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 gap-4">
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Odaberi klijenta</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName}
                  </option>
                ))}
              </select>

              <select
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                required
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Odaberi uslugu</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.durationMinutes} min)
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />

              <textarea
                placeholder="Napomene (opciono)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Spremi
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <p className="text-center text-gray-500">Učitavanje...</p>
        ) : appointments.length === 0 ? (
          <p className="text-center text-gray-500">Nema termina</p>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <li key={appointment.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getClientName(appointment.clientId)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {getServiceName(appointment.serviceId)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(appointment.startTime)}
                      </p>
                      {appointment.notes && (
                        <p className="text-sm text-gray-500">Napomena: {appointment.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.status}
                      </span>
                      <button
                        onClick={() => handleDeleteAppointment(appointment.id.toString())}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Obriši
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
