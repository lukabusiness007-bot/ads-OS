import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  createdAt: string;
}

export const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    durationMinutes: '',
    price: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/services');
      setServices(response.data);
      setError('');
    } catch (err: any) {
      setError('Greška pri učitavanju usluga');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/services', {
        name: formData.name,
        durationMinutes: parseInt(formData.durationMinutes),
        price: parseFloat(formData.price),
      });
      setFormData({ name: '', durationMinutes: '', price: '' });
      setShowForm(false);
      fetchServices();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri dodavanju usluge');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (confirm('Da li si sigurna da želiš obrisati ovu uslugu?')) {
      try {
        await api.delete(`/services/${id}`);
        fetchServices();
      } catch (err: any) {
        setError('Greška pri brisanju usluge');
      }
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Usluge</h1>
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
          + Dodaj novu uslugu
        </button>

        {showForm && (
          <form onSubmit={handleAddService} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="Naziv usluge"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Trajanje (minute)"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: e.target.value })
                }
                required
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Cijena"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                step="0.01"
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
        ) : services.length === 0 ? (
          <p className="text-center text-gray-500">Nema usluga</p>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {services.map((service) => (
                <li key={service.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {service.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {service.durationMinutes} minuta • {service.price} KM
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteService(service.id)}
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
