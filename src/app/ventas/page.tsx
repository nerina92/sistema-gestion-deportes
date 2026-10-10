'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaPlus, FaEye } from 'react-icons/fa';
import { variantLabel } from '@/lib/variant-label';
import { formatMoney, formatDate, formatDateTime } from '@/lib/format';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  pdfPath: string | null;
}

interface Sale {
  id: string;
  saleDate: string;
  paymentMethod: string;
  priceType: string;
  totalAmount: string;
  itemCount: number;
  notes: string | null;
  createdAt: string;
  invoice?: Invoice | null;
}

export default function VentasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceSaleId, setInvoiceSaleId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerDni, setCustomerDni] = useState('');
  const [issuingInvoice, setIssuingInvoice] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales');
      const data = await response.json();
      if (data.success) {
        setSales(data.data);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSaleDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/sales/${id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedSale(data.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching sale detail:', error);
    }
  };

  const handleIssueInvoice = (saleId: string) => {
    setInvoiceSaleId(saleId);
    setCustomerName('');
    setCustomerDni('');
    setShowInvoiceModal(true);
  };

  const issueInvoice = async () => {
    setIssuingInvoice(true);

    try {
      const response = await fetch('/api/invoices/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: invoiceSaleId,
          customerName: customerName || undefined,
          customerDni: customerDni || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Factura emitida exitosamente!\n\nNúmero: ${data.invoice.number}\nCAE: ${data.invoice.cae}`);
        setShowInvoiceModal(false);
        fetchSales(); // Recargar ventas
      } else {
        alert(`Error al emitir factura:\n${data.error}\n${data.details || ''}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIssuingInvoice(false);
    }
  };

  const calculateStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);

    const salesToday = sales.filter(s => s.saleDate.startsWith(today));
    const salesThisMonth = sales.filter(s => s.saleDate.startsWith(thisMonth));

    return {
      today: salesToday.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0),
      month: salesThisMonth.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0),
      total: sales.length,
      average: sales.length > 0 ? sales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0) / sales.length : 0
    };
  };

  const stats = calculateStats();

  const paymentMethodLabels: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia'
  };

  const priceTypeLabels: Record<string, string> = {
    cash: 'Contado',
    debit: 'Débito',
    financed: 'Financiado'
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 flex items-center gap-3">
              <FaShoppingCart className="size-6 shrink-0 text-brand-600" />
              Ventas
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Gestiona y registra todas las ventas del negocio
            </p>
          </div>
          <Link
            href="/ventas/nueva"
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Nueva Venta
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
        <div className="bg-white p-6 rounded-card shadow-card border border-zinc-200">
          <div className="flex items-center">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <FaShoppingCart className="h-6 w-6 text-zinc-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-600">Ventas Hoy</p>
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 tabular">{formatMoney(stats.today)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-card shadow-card border border-zinc-200">
          <div className="flex items-center">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <FaShoppingCart className="h-6 w-6 text-zinc-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-600">Ventas Mes</p>
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 tabular">{formatMoney(stats.month)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-card shadow-card border border-zinc-200">
          <div className="flex items-center">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <FaShoppingCart className="h-6 w-6 text-zinc-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-600">Total Ventas</p>
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 tabular">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-card shadow-card border border-zinc-200">
          <div className="flex items-center">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <FaShoppingCart className="h-6 w-6 text-zinc-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-600">Promedio</p>
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 tabular">{formatMoney(stats.average)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales table */}
      <div className="bg-white rounded-card shadow-card border border-zinc-200">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">Historial de Ventas</h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-zinc-500">
            Cargando ventas...
          </div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShoppingCart className="h-7 w-7 text-zinc-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3">
                No hay ventas registradas
              </h3>
              <p className="text-zinc-600 mb-6">
                Comienza registrando tu primera venta
              </p>
              <Link
                href="/ventas/nueva"
                className="inline-flex items-center bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <FaPlus className="mr-2" />
                Nueva Venta
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Método de Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Tipo de Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-zinc-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                      {formatDate(sale.saleDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200 rounded-full text-xs font-medium">
                        {paymentMethodLabels[sale.paymentMethod]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200 rounded-full text-xs font-medium">
                        {priceTypeLabels[sale.priceType]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                      {sale.itemCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-zinc-900">
                      {formatMoney(parseFloat(sale.totalAmount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {sale.invoice ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-zinc-900 font-medium">
                            {sale.invoice.invoiceNumber}
                          </span>
                          {sale.invoice.pdfPath && (
                            <a
                              href={`/api/invoices/${sale.invoice.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-600 hover:text-brand-800 text-xs underline"
                            >
                              PDF
                            </a>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleIssueInvoice(sale.id)}
                          className="border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 px-2.5 py-1 rounded-md text-xs font-medium shadow-xs"
                        >
                          Emitir Factura
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                      <button
                        onClick={() => fetchSaleDetail(sale.id)}
                        className="text-brand-700 hover:text-brand-900 font-medium flex items-center"
                      >
                        <FaEye className="mr-1" />
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for sale detail */}
      {showModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 tabular">Detalle de Venta</h2>
                  <p className="text-sm text-zinc-600 mt-1">
                    {formatDateTime(selectedSale.saleDate)}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Sale info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-zinc-600">Método de Pago</p>
                  <p className="font-medium">{paymentMethodLabels[selectedSale.paymentMethod]}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-600">Tipo de Precio</p>
                  <p className="font-medium">{priceTypeLabels[selectedSale.priceType]}</p>
                </div>
                {selectedSale.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-zinc-600">Notas</p>
                    <p className="font-medium">{selectedSale.notes}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Productos</h3>
                <div className="space-y-3">
                  {selectedSale.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                      <div>
                        <p className="font-medium text-zinc-900">{item.productName}</p>
                        <p className="text-sm text-zinc-600">
                          {variantLabel(item.size, item.color)} • SKU: {item.sku}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatMoney(item.unitPrice)} x {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-zinc-900">{formatMoney(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="mt-6 pt-6 border-t border-zinc-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-zinc-900">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatMoney(parseFloat(selectedSale.totalAmount))}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-200 bg-zinc-50">
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-zinc-600 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for invoice issuance */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-zinc-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 tabular">Emitir Factura B</h2>
                  <p className="text-sm text-zinc-600 mt-1">
                    Datos del cliente (opcional)
                  </p>
                </div>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 text-2xl"
                  disabled={issuingInvoice}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Consumidor Final"
                    disabled={issuingInvoice}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    DNI del Cliente
                  </label>
                  <input
                    type="text"
                    value={customerDni}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 8) setCustomerDni(value);
                    }}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="12345678"
                    disabled={issuingInvoice}
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Opcional - Solo números, sin puntos
                  </p>
                </div>

                <div className="bg-brand-50 border border-brand-200 rounded-md p-3">
                  <p className="text-xs text-brand-800">
                    <strong>Nota:</strong> Los datos del cliente son opcionales.
                    Si no se ingresan, se emitirá como "Consumidor Final".
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-200 bg-zinc-50 flex space-x-3">
              <button
                onClick={() => setShowInvoiceModal(false)}
                disabled={issuingInvoice}
                className="flex-1 bg-zinc-600 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={issueInvoice}
                disabled={issuingInvoice}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {issuingInvoice ? 'Emitiendo...' : 'Emitir Factura'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}