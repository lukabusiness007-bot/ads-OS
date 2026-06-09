import { useEffect, useState } from 'react';
import axios from 'axios';

interface Client {
  id: string;
  fullName: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

interface InvoiceItem {
  serviceId: string;
  quantity: number;
}

interface InvoiceFormProps {
  invoiceId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function InvoiceForm({
  invoiceId,
  onSuccess,
  onCancel,
}: InvoiceFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    items: [] as InvoiceItem[],
    notes: '',
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClients();
    fetchServices();

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (err) {
      setError('Failed to fetch clients');
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/services');
      setServices(response.data);
    } catch (err) {
      setError('Failed to fetch services');
    }
  };

  const fetchInvoice = async () => {
    try {
      const response = await axios.get(`/api/invoices/${invoiceId}`);
      const invoiceData = response.data;
      setFormData({
        clientId: invoiceData.clientId,
        items: invoiceData.items.map((item: any) => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
        })),
        notes: invoiceData.notes || '',
        dueDate: invoiceData.dueDate ? invoiceData.dueDate.split('T')[0] : '',
      });
    } catch (err) {
      setError('Failed to fetch invoice');
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { serviceId: '', quantity: 1 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (
    index: number,
    field: 'serviceId' | 'quantity',
    value: any
  ) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'quantity' ? parseInt(value) : value,
    };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId || formData.items.length === 0) {
      setError('Molim popunite sve obavezne polje');
      return;
    }

    try {
      setLoading(true);
      const url = invoiceId
        ? `/api/invoices/${invoiceId}`
        : '/api/invoices';
      const method = invoiceId ? 'put' : 'post';

      await axios[method](url, {
        clientId: formData.clientId,
        items: formData.items,
        notes: formData.notes,
        dueDate: formData.dueDate || undefined,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const service = services.find((s) => s.id === item.serviceId);
      return total + (service?.price || 0) * item.quantity;
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">
        {invoiceId ? 'Uredi fakturu' : 'Nova faktura'}
      </h2>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">{error}</div>
      )}

      {/* Client Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Klijent *</label>
        <select
          value={formData.clientId}
          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
          className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Izaberite klijenta...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.fullName}
            </option>
          ))}
        </select>
      </div>

      {/* Invoice Items */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-3">Stavke na faktturi *</label>

        {formData.items.map((item, index) => (
          <div key={index} className="flex gap-3 mb-3">
            <select
              value={item.serviceId}
              onChange={(e) => handleItemChange(index, 'serviceId', e.target.value)}
              className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Izaberite uslugu...</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price.toFixed(2)}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) =>
                handleItemChange(index, 'quantity', e.target.value)
              }
              className="w-24 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              required
            />
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Ukloni
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddItem}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          + Dodaj stavku
        </button>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Napomene</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Due Date */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Rok plaćanja</label>
        <input
          type="date"
          value={formData.dueDate}
          onChange={(e) =>
            setFormData({ ...formData, dueDate: e.target.value })
          }
          className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Total */}
      <div className="mb-6 text-right">
        <p className="text-xl font-bold">
          Ukupno: <span className="text-green-600">${calculateTotal().toFixed(2)}</span>
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
        >
          Otkaži
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Čuvanje...' : 'Spremi fakturu'}
        </button>
      </div>
    </form>
  );
}
