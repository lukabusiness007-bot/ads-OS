import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import InvoiceForm from '../components/InvoiceForm';

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  client: {
    name: string;
  };
  createdAt: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchInvoices();
  }, [isAuthenticated, navigate, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/api/invoices?status=${statusFilter}`
        : '/api/invoices';
      const response = await axios.get(url);
      setInvoices(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati fakturu?')) {
      return;
    }

    try {
      await axios.delete(`/api/invoices/${id}`);
      setInvoices(invoices.filter((i) => i.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete invoice');
    }
  };

  const downloadPDF = async (id: string, invoiceNumber: string) => {
    try {
      const response = await axios.get(`/api/invoices/${id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  const sendInvoice = async (id: string) => {
    try {
      await axios.post(`/api/invoices/${id}/send`);
      fetchInvoices();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send invoice');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fakture</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? '✕ Zatvori' : '+ Nova Faktura'}
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-800 p-4 rounded mb-4">{error}</div>}

      {showForm && (
        <InvoiceForm
          onSuccess={() => {
            setShowForm(false);
            fetchInvoices();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Filter po statusu:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Svi statusu</option>
          <option value="draft">Nacrt</option>
          <option value="sent">Poslana</option>
          <option value="paid">Plaćena</option>
          <option value="overdue">Istekla</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Učitavanje...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center text-gray-500 py-8">Nema faktura</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-3 text-left">Broj fakture</th>
                <th className="border p-3 text-left">Klijent</th>
                <th className="border p-3 text-right">Iznos</th>
                <th className="border p-3 text-center">Status</th>
                <th className="border p-3 text-left">Datum</th>
                <th className="border p-3 text-center">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                  <td className="border p-3 font-mono">{invoice.invoiceNumber}</td>
                  <td className="border p-3">{invoice.client.name}</td>
                  <td className="border p-3 text-right font-semibold">
                    ${invoice.total.toFixed(2)}
                  </td>
                  <td className="border p-3 text-center">
                    <span className={`px-3 py-1 rounded text-sm ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="border p-3">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </td>
                  <td className="border p-3 text-center space-x-2">
                    <button
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      className="text-blue-500 hover:underline text-sm"
                    >
                      Pregled
                    </button>
                    <button
                      onClick={() => downloadPDF(invoice.id, invoice.invoiceNumber)}
                      className="text-green-500 hover:underline text-sm"
                    >
                      PDF
                    </button>
                    {invoice.status === 'draft' && (
                      <>
                        <button
                          onClick={() => sendInvoice(invoice.id)}
                          className="text-orange-500 hover:underline text-sm"
                        >
                          Pošalji
                        </button>
                        <button
                          onClick={() => deleteInvoice(invoice.id)}
                          className="text-red-500 hover:underline text-sm"
                        >
                          Obriši
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
