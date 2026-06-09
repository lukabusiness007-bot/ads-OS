import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

interface InvoiceItem {
  id: string;
  serviceId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  service: {
    name: string;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  notes?: string;
  dueDate?: string;
  createdAt: string;
  client: {
    name: string;
    email: string;
    phone: string;
  };
  items: InvoiceItem[];
}

export default function InvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (id) {
      fetchInvoice();
    }
  }, [id, isAuthenticated, navigate]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/invoices/${id}`);
      setInvoice(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!invoice || invoice.status === 'paid') return;

    try {
      setPaymentLoading(true);
      const response = await axios.post('/api/payments/create-checkout-session', {
        invoiceId: invoice.id,
      });

      // Redirect to Stripe Checkout
      if (response.data.sessionUrl) {
        window.location.href = response.data.sessionUrl;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create payment session');
    } finally {
      setPaymentLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!invoice) return;

    try {
      const response = await axios.get(`/api/invoices/${invoice.id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Učitavanje fakture...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">Faktura nije pronađena</div>
      </div>
    );
  }

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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded shadow-lg p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Faktura</h1>
            <p className="text-2xl font-mono text-gray-700">{invoice.invoiceNumber}</p>
          </div>
          <span className={`px-4 py-2 rounded text-lg font-semibold ${getStatusColor(invoice.status)}`}>
            {invoice.status}
          </span>
        </div>

        {error && <div className="bg-red-100 text-red-800 p-4 rounded mb-4">{error}</div>}

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">FAKTURIRAN KO:</h3>
            <p className="font-semibold text-lg">{invoice.client.name}</p>
            <p className="text-gray-600">{invoice.client.email}</p>
            <p className="text-gray-600">{invoice.client.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Datum:</span> {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
            {invoice.dueDate && (
              <p className="text-gray-600 mb-2">
                <span className="font-semibold">Rok plaćanja:</span>{' '}
                {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left p-3 font-semibold">Usluga</th>
                <th className="text-center p-3 font-semibold">Količina</th>
                <th className="text-right p-3 font-semibold">Cijena</th>
                <th className="text-right p-3 font-semibold">Iznos</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="p-3">{item.service.name}</td>
                  <td className="text-center p-3">{item.quantity}</td>
                  <td className="text-right p-3">${item.unitPrice.toFixed(2)}</td>
                  <td className="text-right p-3">${item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8">
            <h3 className="font-semibold mb-2">Napomene:</h3>
            <p className="text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Total */}
        <div className="text-right mb-8 border-t-2 border-gray-800 pt-4">
          <p className="text-3xl font-bold">
            Ukupno: <span className="text-green-600">${invoice.total.toFixed(2)}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-start">
          <button
            onClick={downloadPDF}
            className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600"
          >
            ⬇️ Preuzmi PDF
          </button>

          {invoice.status !== 'paid' && (
            <button
              onClick={handlePayment}
              disabled={paymentLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {paymentLoading ? 'Procesiranje...' : '💳 Plati sa Stripe'}
            </button>
          )}

          <button
            onClick={() => navigate('/invoices')}
            className="bg-gray-500 text-white px-6 py-3 rounded hover:bg-gray-600"
          >
            Nazad
          </button>
        </div>
      </div>
    </div>
  );
}
