'use client';

import { useEffect, useState } from 'react';
import { COUNTRIES, DEFAULT_COUNTRY } from '@/lib/countries';

export interface LocationValue {
  country: string;
  region: string;
  city: string;
}

interface PsgcItem {
  code: string;
  name: string;
}

async function psgcGet(path: string): Promise<PsgcItem[]> {
  const res = await fetch(`/api/psgc/${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// Country → Region → City. Philippine locations come from the PSGC list; for any
// other country there's no such list, so region and city are typed in.
export default function RegistrationLocation({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}) {
  const isPH = value.country === DEFAULT_COUNTRY;
  const [regions, setRegions] = useState<PsgcItem[]>([]);
  const [cities, setCities] = useState<PsgcItem[]>([]);
  const [regionCode, setRegionCode] = useState('');
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isPH || regions.length > 0) return;
    psgcGet('regions')
      .then(setRegions)
      .catch(() => setError('Could not load regions. Please refresh and try again.'));
  }, [isPH, regions.length]);

  const handleCountry = (country: string) => {
    setRegionCode('');
    setCities([]);
    onChange({ country, region: '', city: '' });
  };

  const handleRegion = async (code: string) => {
    const region = regions.find((r) => r.code === code);
    setRegionCode(code);
    setCities([]);
    onChange({ ...value, region: region?.name ?? '', city: '' });
    if (!code) return;
    setLoadingCities(true);
    try {
      setCities(await psgcGet(`regions/${code}/cities-municipalities`));
    } catch {
      setError('Could not load cities. Please try again.');
    } finally {
      setLoadingCities(false);
    }
  };

  return (
    <>
      <div>
        <label className="label">Country</label>
        <select
          value={value.country}
          onChange={(e) => handleCountry(e.target.value)}
          required
          className="input-field"
        >
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {isPH ? (
        <>
          <div>
            <label className="label">Region</label>
            <select value={regionCode} onChange={(e) => handleRegion(e.target.value)} required className="input-field">
              <option value="">{regions.length === 0 && !error ? 'Loading regions…' : 'Select region'}</option>
              {regions.map((r) => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">City / Municipality</label>
            <select
              value={value.city}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              required
              disabled={!regionCode || loadingCities}
              className="input-field disabled:opacity-60"
            >
              <option value="">{loadingCities ? 'Loading cities…' : 'Select city'}</option>
              {cities.map((c) => (
                <option key={c.code} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </>
      ) : (
        <>
          <div>
            <label className="label">Region / State</label>
            <input
              type="text"
              value={value.region}
              onChange={(e) => onChange({ ...value, region: e.target.value })}
              required
              maxLength={100}
              placeholder="e.g. California"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">City</label>
            <input
              type="text"
              value={value.city}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              required
              maxLength={100}
              placeholder="e.g. Los Angeles"
              className="input-field"
            />
          </div>
        </>
      )}
    </>
  );
}
