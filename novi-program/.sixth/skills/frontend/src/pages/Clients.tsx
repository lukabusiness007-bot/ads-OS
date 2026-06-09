import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Client {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  createdAt: string;
}

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
  });
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/clients');
      setClients(response.data);
      setError('');
    } catch (err: any) {
      setError('Greška pri učitavanju klijenta');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      setFormData({ fullName: '', phone: '', email: '' });
      setShowForm(false);
      fetchClients();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri dodavanju klijenta');
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (confirm('Da li si sigurna da želiš obrisati ovog klijenta?')) {
      try {
        await api.delete(`/clients/${id}`);
        fetchClients();
      } catch (err: any) {
        setError('Greška pri brisanju klijenta');
      }
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Klijenti</h1>
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
          + Dodaj novog klijenta
        </button>

        {showForm && (
          <form onSubmit={handleAddClient} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="Ime i prezime"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="tel"
                placeholder="Telefon"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
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
        ) : clients.length === 0 ? (
          <p className="text-center text-gray-500">Nema klijentata</p>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {clients.map((client) => (
                <li key={client.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {client.fullName}
                        </p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                        <p className="text-sm text-gray-500">{client.phone}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Obriši
                    </button>
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
