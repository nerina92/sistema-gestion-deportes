import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import bwipjs from 'bwip-js';

interface InvoiceData {
  cae: string;
  caeExpiration: string;
  invoiceNumber: string;
  customerName?: string;
  customerDni?: string;
}

interface AfipConfig {
  cuit: string;
  puntoVenta: number;
}

export async function generateInvoicePDF(
  invoiceId: string,
  sale: any,
  config: AfipConfig,
  invoiceData: InvoiceData
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Crear directorio para PDFs
      const pdfsDir = path.join(process.cwd(), 'public', 'invoices');
      await mkdir(pdfsDir, { recursive: true });

      const pdfPath = path.join(pdfsDir, `${invoiceId}.pdf`);
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      doc.pipe(createWriteStream(pdfPath));

      // Header - Factura B
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('FACTURA B', { align: 'center' });

      doc.moveDown(0.5);

      // Línea divisoria
      doc.moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .stroke();

      doc.moveDown();

      // Datos fiscales del emisor
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('DEPORTES LABOULAYE', { align: 'left' });

      doc.fontSize(10)
         .font('Helvetica')
         .text(`CUIT: ${config.cuit}`)
         .text('IVA Responsable Inscripto')
         .text('Dirección: Av. Principal 1234, Laboulaye, Córdoba')
         .text('Tel: (03385) 123456');

      doc.moveDown();

      // Línea divisoria
      doc.moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .stroke();

      doc.moveDown();

      // Número de factura y fecha en dos columnas
      const leftColumn = 50;
      const rightColumn = 320;
      const startY = doc.y;

      // Columna izquierda - Fecha
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('FECHA DE EMISIÓN:', leftColumn, startY)
         .font('Helvetica')
         .text(new Date().toLocaleDateString('es-AR', {
           day: '2-digit',
           month: '2-digit',
           year: 'numeric'
         }), leftColumn, doc.y);

      // Columna derecha - Número de factura
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('COMPROBANTE Nº:', rightColumn, startY)
         .font('Helvetica')
         .text(invoiceData.invoiceNumber, rightColumn, doc.y);

      doc.moveDown(2);

      // Datos del cliente
      if (invoiceData.customerName || invoiceData.customerDni) {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('DATOS DEL CLIENTE');

        doc.fontSize(10)
           .font('Helvetica');

        if (invoiceData.customerName) {
          doc.text(`Nombre: ${invoiceData.customerName}`);
        }

        if (invoiceData.customerDni) {
          doc.text(`DNI: ${invoiceData.customerDni}`);
        }
      } else {
        doc.fontSize(10)
           .font('Helvetica')
           .text('Cliente: CONSUMIDOR FINAL');
      }

      doc.moveDown(1.5);

      // Tabla de items
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('DETALLE DE PRODUCTOS');

      doc.moveDown(0.5);

      // Headers de tabla
      const tableTop = doc.y;
      const itemX = 50;
      const qtyX = 320;
      const priceX = 380;
      const totalX = 480;

      doc.fontSize(9)
         .font('Helvetica-Bold');

      doc.text('Producto', itemX, tableTop, { width: 260 });
      doc.text('Cant.', qtyX, tableTop, { width: 50, align: 'right' });
      doc.text('P.Unit', priceX, tableTop, { width: 80, align: 'right' });
      doc.text('Subtotal', totalX, tableTop, { width: 65, align: 'right' });

      // Línea bajo header
      doc.moveTo(50, doc.y + 5)
         .lineTo(545, doc.y + 5)
         .stroke();

      doc.moveDown(0.5);

      // Items
      doc.fontSize(9).font('Helvetica');

      for (const item of sale.items) {
        const itemY = doc.y;
        const productName = item.productVariant.product.name;
        const variantInfo = `${item.productVariant.size} - ${item.productVariant.color}`;
        const itemDescription = `${productName}\n${variantInfo}`;

        doc.text(itemDescription, itemX, itemY, { width: 260 });
        doc.text(item.quantity.toString(), qtyX, itemY, { width: 50, align: 'right' });
        doc.text(`$${parseFloat(item.unitPrice).toFixed(2)}`, priceX, itemY, { width: 80, align: 'right' });
        doc.text(`$${parseFloat(item.subtotal).toFixed(2)}`, totalX, itemY, { width: 65, align: 'right' });

        doc.moveDown(1.5);
      }

      // Línea antes del total
      doc.moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .stroke();

      doc.moveDown(0.5);

      // Total
      const totalY = doc.y;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('TOTAL:', 400, totalY)
         .text(`$${parseFloat(sale.totalAmount).toFixed(2)}`, 480, totalY, { width: 65, align: 'right' });

      doc.moveDown(2);

      // CAE Section
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('DATOS DE AUTORIZACIÓN AFIP', { align: 'center' });

      doc.moveDown(0.5);

      doc.fontSize(10)
         .font('Helvetica')
         .text(`CAE: ${invoiceData.cae}`, { align: 'center' })
         .text(`Fecha de Vencimiento CAE: ${new Date(invoiceData.caeExpiration).toLocaleDateString('es-AR')}`, {
           align: 'center'
         });

      doc.moveDown(1);

      // Generar código de barras
      try {
        const barcodeBuffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: invoiceData.cae,
          scale: 2,
          height: 10,
          includetext: false
        });

        // Centrar código de barras
        const barcodeWidth = 200;
        const barcodeX = (doc.page.width - barcodeWidth) / 2;

        doc.image(barcodeBuffer, barcodeX, doc.y, {
          width: barcodeWidth,
          align: 'center'
        });

        doc.moveDown(3);
      } catch (barcodeError) {
        console.error('Error generating barcode:', barcodeError);
        doc.moveDown(1);
      }

      // Footer
      doc.fontSize(8)
         .font('Helvetica')
         .text('Comprobante Autorizado por AFIP', { align: 'center' })
         .text('Esta administración no se hace responsable de los datos ingresados en el detalle de la operación', {
           align: 'center'
         });

      doc.end();

      resolve(`/invoices/${invoiceId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
}
