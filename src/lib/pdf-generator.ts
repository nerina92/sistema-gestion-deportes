import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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

/**
 * Genera un PDF de factura en memoria usando pdf-lib.
 * 100% compatible con Vercel (sin dependencias de filesystem).
 * Devuelve el PDF como string base64.
 */
export async function generateInvoicePDF(
  invoiceId: string,
  sale: any,
  config: AfipConfig,
  invoiceData: InvoiceData
): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const black = rgb(0, 0, 0);
  const gray = rgb(0.3, 0.3, 0.3);

  // Helper: dibujar texto
  const drawText = (text: string, x: number, yPos: number, options: {
    font?: typeof helvetica;
    size?: number;
    color?: typeof black;
  } = {}) => {
    const font = options.font || helvetica;
    const size = options.size || 10;
    const color = options.color || black;
    page.drawText(text, { x, y: yPos, size, font, color });
  };

  // Helper: dibujar texto alineado a derecha
  const drawTextRight = (text: string, rightX: number, yPos: number, options: {
    font?: typeof helvetica;
    size?: number;
  } = {}) => {
    const font = options.font || helvetica;
    const size = options.size || 10;
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: rightX - textWidth, y: yPos, size, font, color: black });
  };

  // Helper: dibujar texto centrado
  const drawTextCenter = (text: string, yPos: number, options: {
    font?: typeof helvetica;
    size?: number;
  } = {}) => {
    const font = options.font || helvetica;
    const size = options.size || 10;
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y: yPos, size, font, color: black });
  };

  // Helper: dibujar línea horizontal
  const drawLine = (yPos: number) => {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
  };

  // ========== HEADER ==========
  drawTextCenter('FACTURA C', y, { font: helveticaBold, size: 24 });
  y -= 35;

  drawLine(y);
  y -= 20;

  // ========== DATOS DEL EMISOR ==========
  drawText('DEPORTES LABOULAYE', margin, y, { font: helveticaBold, size: 14 });
  y -= 18;
  drawText(`CUIT: ${config.cuit}`, margin, y, { size: 10 });
  y -= 14;
  drawText('Monotributista', margin, y, { size: 10 });
  y -= 14;
  drawText('Laboulaye, Córdoba', margin, y, { size: 10, color: gray });
  y -= 20;

  drawLine(y);
  y -= 20;

  // ========== FECHA Y COMPROBANTE ==========
  drawText('FECHA DE EMISIÓN:', margin, y, { font: helveticaBold, size: 10 });
  drawText('COMPROBANTE Nº:', 320, y, { font: helveticaBold, size: 10 });
  y -= 14;

  const dateStr = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  drawText(dateStr, margin, y, { size: 10 });
  drawText(invoiceData.invoiceNumber, 320, y, { size: 10 });
  y -= 25;

  // ========== DATOS DEL CLIENTE ==========
  if (invoiceData.customerName || invoiceData.customerDni) {
    drawText('DATOS DEL CLIENTE', margin, y, { font: helveticaBold, size: 12 });
    y -= 16;

    if (invoiceData.customerName) {
      drawText(`Nombre: ${invoiceData.customerName}`, margin, y, { size: 10 });
      y -= 14;
    }
    if (invoiceData.customerDni) {
      drawText(`DNI: ${invoiceData.customerDni}`, margin, y, { size: 10 });
      y -= 14;
    }
  } else {
    drawText('Cliente: CONSUMIDOR FINAL', margin, y, { size: 10 });
    y -= 14;
  }

  y -= 15;

  // ========== DETALLE DE PRODUCTOS ==========
  drawText('DETALLE DE PRODUCTOS', margin, y, { font: helveticaBold, size: 12 });
  y -= 20;

  // Headers de tabla
  const colProduct = margin;
  const colQty = 320;
  const colPrice = 400;
  const colSubtotal = width - margin;

  drawText('Producto', colProduct, y, { font: helveticaBold, size: 9 });
  drawTextRight('Cant.', colQty + 40, y, { font: helveticaBold, size: 9 });
  drawTextRight('P.Unit', colPrice + 60, y, { font: helveticaBold, size: 9 });
  drawTextRight('Subtotal', colSubtotal, y, { font: helveticaBold, size: 9 });
  y -= 8;

  drawLine(y);
  y -= 14;

  // Items
  for (const item of sale.items) {
    const productName = item.productVariant?.product?.name || 'Producto';
    const size = item.productVariant?.size || '';
    const color = item.productVariant?.color || '';
    const variantInfo = [size, color].filter(Boolean).join(' - ');

    drawText(productName, colProduct, y, { size: 9 });
    if (variantInfo) {
      y -= 12;
      drawText(variantInfo, colProduct, y, { size: 8, color: gray });
    }

    // Datos numéricos alineados a la derecha en la línea del producto
    const dataY = variantInfo ? y + 12 : y;
    drawTextRight(item.quantity.toString(), colQty + 40, dataY, { size: 9 });
    drawTextRight(`$${parseFloat(item.unitPrice).toFixed(2)}`, colPrice + 60, dataY, { size: 9 });
    drawTextRight(`$${parseFloat(item.subtotal).toFixed(2)}`, colSubtotal, dataY, { size: 9 });

    y -= 18;
  }

  // Línea antes del total
  drawLine(y + 5);
  y -= 15;

  // ========== TOTAL ==========
  drawTextRight('TOTAL:', colPrice + 60, y, { font: helveticaBold, size: 14 });
  drawTextRight(`$${parseFloat(sale.totalAmount).toFixed(2)}`, colSubtotal, y, { font: helveticaBold, size: 14 });
  y -= 40;

  // ========== CAE ==========
  drawTextCenter('DATOS DE AUTORIZACIÓN AFIP', y, { font: helveticaBold, size: 12 });
  y -= 20;

  drawTextCenter(`CAE: ${invoiceData.cae}`, y, { size: 10 });
  y -= 16;

  const caeExpDate = new Date(invoiceData.caeExpiration).toLocaleDateString('es-AR');
  drawTextCenter(`Fecha de Vencimiento CAE: ${caeExpDate}`, y, { size: 10 });
  y -= 30;

  // ========== FOOTER ==========
  drawTextCenter('Comprobante Autorizado por AFIP', y, { size: 8 });
  y -= 12;
  drawTextCenter('Esta administración no se hace responsable de los datos ingresados en el detalle de la operación', y, { size: 7 });

  // Generar PDF
  const pdfBytes = await pdfDoc.save();
  const base64 = Buffer.from(pdfBytes).toString('base64');

  return base64;
}
