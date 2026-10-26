import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { pesos } from './pdfUtils';

const COMPANY = {
  name: 'Holygrail Inc.',
  tin: 'TIN: 669-334-054-00000',
  sec: 'SEC: 2026030240522-56',
  address: 'Lee Gardens Condominium, Lee St. Brgy. Addition Hills, Mandaluyong, Philippines. 1550',
  email: 'payments@holygrail.ph',
  website: 'www.holygrail.ph',
};

export interface InvoiceOrder {
  id: string;
  status: string;
  deliveryMethod: string;
  totalAmount: number;
  discountAmount: number;
  promoCode: string | null;
  reservationExpiry: string;
  createdAt: string;
  paymentMethodName: string | null;
  paymentMethod: {
    type: string;
    accountName: string | null;
    accountNumber: string | null;
  } | null;
  user: { name: string; email: string };
  items: Array<{ quantity: number; price: number; product: { name: string } }>;
  statusHistory?: Array<{ status: string; createdAt: string }>;
}

const PAID_STATUSES = ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'WAITING_FOR_ARRIVAL'];

export function isOrderPaid(status: string) {
  return PAID_STATUSES.includes(status);
}

// Payment is confirmed when staff verify the deposit (or when a walk-in order
// is created already paid) — that's the first paid status in the history.
function paymentDate(order: InvoiceOrder): string {
  const entry = order.statusHistory?.find((h) => PAID_STATUSES.includes(h.status));
  return entry?.createdAt ?? order.createdAt;
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function statusLabel(status: string) {
  if (isOrderPaid(status)) return 'Paid';
  if (status === 'CANCELLED') return 'Cancelled';
  return 'Pending Payment';
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch('/logo-mark-new.png');
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function buildInvoicePdf(order: InvoiceOrder, orderTypeLabel: string): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const invoiceNo = order.id.slice(-8).toUpperCase();
  const isPaid = statusLabel(order.status) === 'Paid';

  // Header — logo + company block (top-left)
  const logo = await loadLogoDataUrl();
  if (logo) {
    doc.addImage(logo, 'PNG', marginX, 36, 32, 32);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(COMPANY.name.toUpperCase(), marginX + 40, 54);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text(`${COMPANY.tin}   ${COMPANY.sec}`, marginX + 40, 65);
  doc.text(doc.splitTextToSize(COMPANY.address, 190), marginX + 40, 75);

  // Metadata block (top-right). Once paid this is a sales invoice dated at
  // payment; before that it's a payment request with a due date.
  const metaRows: [string, string][] = isPaid
    ? [
        ['Sales invoice no.:', `#${invoiceNo}`],
        ['Reference:', invoiceNo],
        ['Order date:', formatDate(order.createdAt)],
        ['Date paid:', formatDate(paymentDate(order))],
        ['Status:', 'Paid'],
        ['Order Type:', orderTypeLabel],
        ['Payment Method:', order.paymentMethodName || '—'],
        ['Total Paid:', pesos(order.totalAmount)],
      ]
    : [
        ['Invoice number:', `#${invoiceNo}`],
        ['Reference:', invoiceNo],
        ['Invoice date:', formatDate(order.createdAt)],
        ['Due date:', formatDate(order.reservationExpiry)],
        ['Status:', statusLabel(order.status)],
        ['Order Type:', orderTypeLabel],
        ['Payment Method:', order.paymentMethodName || '—'],
        ['Total Due:', pesos(order.totalAmount)],
      ];
  const metaLabelX = pageWidth - 230;
  const metaValueX = pageWidth - marginX;
  let metaY = 44;
  for (const [label, value] of metaRows) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(label, metaLabelX, metaY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(value, metaValueX, metaY, { align: 'right' });
    metaY += 15;
  }

  if (isPaid) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text('SALES INVOICE', marginX, 100);
    doc.setFontSize(9);
    doc.setTextColor(21, 128, 61);
    doc.text('PAID', marginX + 92, 100);
  }

  const ruleY = 128;
  doc.setDrawColor(210, 210, 210);
  doc.line(marginX, ruleY, pageWidth - marginX, ruleY);

  // FROM / TO
  const fromToY = ruleY + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text('FROM:', marginX, fromToY);
  doc.text('TO:', pageWidth / 2, fromToY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 60);
  doc.text([COMPANY.name, COMPANY.email, COMPANY.website], marginX, fromToY + 16);
  doc.text(
    [order.user.name, order.user.email, order.deliveryMethod].filter(Boolean),
    pageWidth / 2,
    fromToY + 16
  );

  // Line items
  const body = order.items.map((item) => [
    item.product.name,
    String(item.quantity),
    pesos(item.price),
    pesos(item.price * item.quantity),
  ]);
  if (order.discountAmount > 0) {
    body.push([`Discount${order.promoCode ? ` (${order.promoCode})` : ''}`, '', '', `-${pesos(order.discountAmount)}`]);
  }

  autoTable(doc, {
    startY: fromToY + 60,
    margin: { left: marginX, right: marginX },
    head: [['DESCRIPTION', 'QUANTITY', 'PRICE', 'AMOUNT']],
    body,
    theme: 'plain',
    styles: { fontSize: 9, textColor: [40, 40, 40], cellPadding: { top: 6, bottom: 6, left: 6, right: 6 } },
    headStyles: {
      textColor: [130, 130, 130],
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: { bottom: 0.75 },
      lineColor: [210, 210, 210],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 55, halign: 'right' },
      2: { cellWidth: 105, halign: 'right' },
      3: { cellWidth: 105, halign: 'right' },
    },
  });

  let y = (doc as any).lastAutoTable.finalY + 10;
  doc.setDrawColor(210, 210, 210);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 20);
  doc.text('Total', pageWidth / 2, y);
  doc.text(pesos(order.totalAmount), pageWidth - marginX, y, { align: 'right' });

  // Payment details box (bottom-left) + amount due (bottom-right)
  const boxY = y + 26;
  const boxWidth = pageWidth / 2 - marginX - 10;
  const boxHeight = 110;
  doc.setDrawColor(190, 190, 190);
  doc.rect(marginX, boxY, boxWidth, boxHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PAYMENT DETAILS', marginX + boxWidth / 2, boxY + 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  const paymentLines = [
    order.paymentMethodName ? `Method: ${order.paymentMethodName}` : null,
    order.paymentMethod?.accountName ? `Account Name: ${order.paymentMethod.accountName}` : null,
    order.paymentMethod?.accountNumber ? `Account Number: ${order.paymentMethod.accountNumber}` : null,
    `Payment Reference: ${invoiceNo}`,
  ].filter(Boolean) as string[];
  let payY = boxY + 42;
  for (const line of paymentLines) {
    doc.text(line, marginX + boxWidth / 2, payY, { align: 'center' });
    payY += 16;
  }

  const dueLabelX = pageWidth / 2 + 10;
  doc.setDrawColor(210, 210, 210);
  doc.line(dueLabelX, boxY + 30, pageWidth - marginX, boxY + 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text(isPaid ? 'Amount paid' : 'Amount due', dueLabelX, boxY + 22);
  doc.text(pesos(order.totalAmount), pageWidth - marginX, boxY + 22, { align: 'right' });

  return doc;
}
