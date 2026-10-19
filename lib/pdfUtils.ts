// jsPDF's standard (non-embedded) fonts don't include the ₱ glyph — it comes
// out as a garbled character. "PHP" reads fine in any PDF viewer without
// having to embed a custom font just for one symbol. Shared by every
// jsPDF-based export (invoices, sales summary, …).
export function pesos(amount: number) {
  return `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
