import * as XLSX from 'xlsx';

// One column per editable product field. `key` is what the import API reads,
// `header` is what appears in the spreadsheet. SKU is the row's identity: an
// import row whose SKU already exists updates that product, a row with no SKU
// creates a new one. Stock "reserved" and image URLs are managed in the app.
export const PRODUCT_COLUMNS = [
  { key: 'sku', header: 'SKU' },
  { key: 'name', header: 'Name' },
  { key: 'category', header: 'Brand' },
  { key: 'itemType', header: 'Item Type' },
  { key: 'model', header: 'Model' },
  { key: 'subcategory', header: 'Subcategory' },
  { key: 'color', header: 'Color' },
  { key: 'dimension', header: 'Dimension' },
  { key: 'size', header: 'Size' },
  { key: 'hardware', header: 'Hardware' },
  { key: 'stamp', header: 'Stamp' },
  { key: 'inclusions', header: 'Inclusions' },
  { key: 'description', header: 'Description' },
  { key: 'price', header: 'Price' },
  { key: 'costPrice', header: 'Cost Price' },
  { key: 'stock', header: 'Stock' },
  { key: 'type', header: 'Type (ONHAND/PASABUY)' },
  { key: 'authenticated', header: 'Authenticated (YES/NO)' },
  { key: 'imageUrl', header: 'Image URL' },
] as const;

type ProductLike = Record<string, unknown>;

export function exportProductsToExcel(products: ProductLike[], fileName = 'holy-grail-products') {
  const rows = products.map((p) =>
    Object.fromEntries(
      PRODUCT_COLUMNS.map((c) => {
        const v = p[c.key];
        if (c.key === 'authenticated') return [c.header, v ? 'YES' : 'NO'];
        return [c.header, v ?? ''];
      })
    )
  );
  const sheet = XLSX.utils.json_to_sheet(rows, { header: PRODUCT_COLUMNS.map((c) => c.header) });
  sheet['!cols'] = PRODUCT_COLUMNS.map((c) => ({ wch: Math.max(c.header.length + 2, 16) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Products');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function downloadProductTemplate() {
  exportProductsToExcel([], 'holy-grail-products-template');
}

// Reads the first sheet and maps spreadsheet headers back to product keys.
export async function parseProductsFile(file: File): Promise<Record<string, unknown>[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return raw.map((row) => {
    const out: Record<string, unknown> = {};
    for (const c of PRODUCT_COLUMNS) {
      if (row[c.header] !== undefined) out[c.key] = row[c.header];
    }
    return out;
  });
}
