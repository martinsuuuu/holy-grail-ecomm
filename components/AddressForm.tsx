'use client';

import { useState, useEffect, useRef } from 'react';
import { AddressData } from '@/lib/address';

interface PsgcItem {
  code: string;
  name: string;
}

const PSGC = '/api/psgc';

async function psgcGet(path: string): Promise<PsgcItem[]> {
  const res = await fetch(`${PSGC}/${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

interface Props {
  value: AddressData;
  onChange: (data: AddressData) => void;
}

export default function AddressForm({ value, onChange }: Props) {
  const [regions, setRegions]     = useState<PsgcItem[]>([]);
  const [provinces, setProvinces] = useState<PsgcItem[]>([]);
  const [cities, setCities]       = useState<PsgcItem[]>([]);
  const [barangays, setBarangays] = useState<PsgcItem[]>([]);

  // true when the selected region has no provinces (e.g. NCR)
  const [skipProvince, setSkipProvince] = useState(false);

  const [loadingRegions,   setLoadingRegions]   = useState(true);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities,    setLoadingCities]    = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);
  const [error, setError] = useState('');

  const initRef = useRef({ ...value });

  // Load regions once on mount
  useEffect(() => {
    psgcGet('regions')
      .then(data => { setRegions(data); setLoadingRegions(false); })
      .catch(e => { setError(`Failed to load regions: ${e.message}`); setLoadingRegions(false); });
  }, []);

  // Pre-populate cascaded lists when editing an existing address
  useEffect(() => {
    const { regionCode, provinceCode, cityCode } = initRef.current;
    if (!regionCode) return;

    psgcGet(`regions/${regionCode}/provinces`).then(provs => {
      if (provs.length > 0) {
        setProvinces(provs);
        setSkipProvince(false);
        if (!provinceCode) return;
        psgcGet(`provinces/${provinceCode}/cities-municipalities`).then(cs => {
          setCities(cs);
          if (!cityCode) return;
          psgcGet(`cities-municipalities/${cityCode}/barangays`).then(setBarangays);
        });
      } else {
        // Region has no provinces (e.g. NCR) — load cities directly from region
        setSkipProvince(true);
        psgcGet(`regions/${regionCode}/cities-municipalities`).then(cs => {
          setCities(cs);
          if (!cityCode) return;
          psgcGet(`cities-municipalities/${cityCode}/barangays`).then(setBarangays);
        });
      }
    }).catch(e => setError(`Failed to pre-load address: ${e.message}`));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- handlers ---

  const handleRegionChange = async (regionCode: string) => {
    const r = regions.find(x => x.code === regionCode);
    onChange({
      ...value,
      regionCode,    regionName: r?.name ?? '',
      provinceCode: '', provinceName: '',
      cityCode: '',    cityName: '',
      barangayCode: '', barangayName: '',
    });
    setProvinces([]); setCities([]); setBarangays([]);
    setSkipProvince(false);
    if (!regionCode) return;

    setLoadingProvinces(true);
    try {
      const provs = await psgcGet(`regions/${regionCode}/provinces`);
      if (provs.length > 0) {
        setProvinces(provs);
        setSkipProvince(false);
      } else {
        // No provinces — load cities directly from region
        setSkipProvince(true);
        setLoadingCities(true);
        const cs = await psgcGet(`regions/${regionCode}/cities-municipalities`);
        setCities(cs);
        setLoadingCities(false);
      }
    } catch (e: any) {
      setError(`Failed to load: ${e.message}`);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const handleProvinceChange = async (provinceCode: string) => {
    const p = provinces.find(x => x.code === provinceCode);
    onChange({
      ...value,
      provinceCode, provinceName: p?.name ?? '',
      cityCode: '',  cityName: '',
      barangayCode: '', barangayName: '',
    });
    setCities([]); setBarangays([]);
    if (!provinceCode) return;
    setLoadingCities(true);
    try {
      const cs = await psgcGet(`provinces/${provinceCode}/cities-municipalities`);
      setCities(cs);
    } catch (e: any) {
      setError(`Failed to load cities: ${e.message}`);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleCityChange = async (cityCode: string) => {
    const c = cities.find(x => x.code === cityCode);
    onChange({
      ...value,
      cityCode, cityName: c?.name ?? '',
      barangayCode: '', barangayName: '',
    });
    setBarangays([]);
    if (!cityCode) return;
    setLoadingBarangays(true);
    try {
      const bs = await psgcGet(`cities-municipalities/${cityCode}/barangays`);
      setBarangays(bs);
    } catch (e: any) {
      setError(`Failed to load barangays: ${e.message}`);
    } finally {
      setLoadingBarangays(false);
    }
  };

  const handleBarangayChange = (barangayCode: string) => {
    const b = barangays.find(x => x.code === barangayCode);
    onChange({ ...value, barangayCode, barangayName: b?.name ?? '' });
  };

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>
      )}

      {/* 1. House/Unit No. + Street */}
      <div>
        <label className="label">
          House / Unit No. + Street <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.street}
          onChange={e => onChange({ ...value, street: e.target.value })}
          placeholder="e.g. 123 Rizal Street"
          className="input-field"
        />
      </div>

      {/* 2. Subdivision / Building */}
      <div>
        <label className="label">
          Subdivision / Building
          <span className="text-gray-400 font-normal text-xs ml-1">(optional)</span>
        </label>
        <input
          type="text"
          value={value.subdivision}
          onChange={e => onChange({ ...value, subdivision: e.target.value })}
          placeholder="e.g. Sunset Village"
          className="input-field"
        />
      </div>

      {/* 3-6: PSGC dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 3. Region */}
        <div className={skipProvince ? '' : ''}>
          <label className="label">Region <span className="text-red-500">*</span></label>
          <select
            value={value.regionCode}
            disabled={loadingRegions}
            onChange={e => handleRegionChange(e.target.value)}
            className="input-field disabled:opacity-50"
          >
            <option value="">{loadingRegions ? 'Loading regions…' : 'Select region…'}</option>
            {regions.map(r => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* 4. Province — hidden for regions like NCR that have no provinces */}
        {!skipProvince && (
          <div>
            <label className="label">Province <span className="text-red-500">*</span></label>
            <select
              value={value.provinceCode}
              disabled={!value.regionCode || loadingProvinces}
              onChange={e => handleProvinceChange(e.target.value)}
              className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{loadingProvinces ? 'Loading…' : 'Select province…'}</option>
              {provinces.map(p => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 5. City / Municipality */}
        <div className={skipProvince ? 'sm:col-span-2' : ''}>
          <label className="label">City / Municipality <span className="text-red-500">*</span></label>
          <select
            value={value.cityCode}
            disabled={(!skipProvince && !value.provinceCode) || loadingCities}
            onChange={e => handleCityChange(e.target.value)}
            className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{loadingCities ? 'Loading…' : 'Select city / municipality…'}</option>
            {cities.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* 6. Barangay */}
        <div className={skipProvince ? 'sm:col-span-2' : ''}>
          <label className="label">Barangay <span className="text-red-500">*</span></label>
          <select
            value={value.barangayCode}
            disabled={!value.cityCode || loadingBarangays}
            onChange={e => handleBarangayChange(e.target.value)}
            className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{loadingBarangays ? 'Loading…' : 'Select barangay…'}</option>
            {barangays.map(b => (
              <option key={b.code} value={b.code}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
