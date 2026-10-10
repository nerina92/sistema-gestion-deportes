'use client';

import { useState, useEffect } from 'react';
import { FaFileInvoice, FaDownload, FaCheckCircle, FaExclamationCircle, FaClock } from 'react-icons/fa';

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  cae: string | null;
  caeExpiration: string | null;
  totalAmount: string;
  customerName: string | null;
  customerDni: string | null;
  status: string;
  pdfPath: string | null;
  sale: {
    id: string;
    saleDate: string;
  };
}

export default function FacturasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, [filterStatus]);

  const fetchInvoices = async () => {
    try {
      const url = filterStatus === 'all'
        ? '/api/invoices'
        : `/api/invoices?status=${filterStatus}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setInvoices(data.data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'issued':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center w-fit">
            <FaCheckCircle className="mr-1" />
            Emitida
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center w-fit">
            <FaExclamationCircle className="mr-1" />
            Error
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center w-fit">
            <FaClock className="mr-1" />
            Pendiente
          </span>
        );
      default:
        return status;
    }
  };

  const calculateStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);

    const issuedInvoices = invoices.filter(i => i.status === 'issued');
    const todayInvoices = issuedInvoices.filter(i => i.invoiceDate.startsWith(today));
    const monthInvoices = issuedInvoices.filter(i => i.invoiceDate.startsWith(thisMonth));

    return {
      total: invoices.length,
      issued: issuedInvoices.length,
      todayTotal: todayInvoices.reduce((sum, i) => sum + parseFloat(i.totalAmount), 0),
      monthTotal: monthInvoices.reduce((sum, i) => sum + parseFloat(i.totalAmount), 0)
    };
  };

  const stats = calculateStats();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaFileInvoice className="mr-3 text-blue-600" />
              Facturas Electrónicas
            </h1>
            <p className="mt-2 text-gray-600">
              Gestiona todas las facturas emitidas a través de AFIP
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaFileInvoice className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Facturas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaCheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Emitidas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.issued}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaFileInvoice className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hoy</p>
              <p className="text-2xl font-bold text-gray-900">${stats.todayTotal.toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FaFileInvoice className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mes</p>
              <p className="text-2xl font-bold text-gray-900">${stats.monthTotal.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas</option>
            <option value="issued">Emitidas</option>
            <option value="error">Con Error</option>
            <option value="pending">Pendientes</option>
          </select>
        </div>
      </div>

      {/* Invoices table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Listado de Facturas</h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Cargando facturas...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaFileInvoice className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No hay facturas registradas
              </h3>
              <p className="text-gray-600">
                Las facturas aparecerán aquí cuando emitas tu primera factura desde el módulo de ventas
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nº Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CAE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(invoice.invoiceDate).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {invoice.customerName || 'Consumidor Final'}
                      {invoice.customerDni && (
                        <span className="block text-xs text-gray-500">DNI: {invoice.customerDni}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {invoice.cae || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${parseFloat(invoice.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {invoice.pdfPath && invoice.status === 'issued' ? (
                        <a
                          href={`/api/invoices/${invoice.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 font-medium flex items-center"
                        >
                          <FaDownload className="mr-1" />
                          Descargar PDF
                        </a>
                      ) : (
                        <span className="text-gray-400">No disponible</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
