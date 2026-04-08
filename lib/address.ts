export interface AddressData {
  street: string;
  subdivision: string;
  regionCode: string;
  regionName: string;
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
  barangayCode: string;
  barangayName: string;
}

export const EMPTY_ADDRESS: AddressData = {
  street: '',
  subdivision: '',
  regionCode: '',
  regionName: '',
  provinceCode: '',
  provinceName: '',
  cityCode: '',
  cityName: '',
  barangayCode: '',
  barangayName: '',
};

export function formatAddress(data: AddressData): string {
  const parts = [
    data.street,
    data.subdivision,
    data.barangayName ? `Brgy. ${data.barangayName}` : '',
    data.cityName,
    data.provinceName,
    data.regionName,
  ].filter(Boolean);
  return parts.join(', ');
}

export function parseAddress(raw: string | null | undefined): AddressData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && 'street' in parsed) {
      return parsed as AddressData;
    }
  } catch {
    // not valid JSON — treat as plain text
  }
  return null;
}

/** Returns the formatted address string, or the raw string if not structured JSON. */
export function displayAddress(raw: string | null | undefined): string {
  if (!raw) return '';
  const data = parseAddress(raw);
  return data ? formatAddress(data) : raw;
}

/** An address is complete when the required structured fields are all filled. */
export function isAddressComplete(raw: string | null | undefined): boolean {
  const data = parseAddress(raw);
  if (!data) return false;
  return !!(
    data.street.trim() &&
    data.regionCode &&
    data.provinceCode &&
    data.cityCode &&
    data.barangayCode
  );
}
