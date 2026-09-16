'use client';

import { useState, useEffect } from 'react';
import { Palette, Type, MessageSquare, Layout, Check, RefreshCw, ExternalLink, AlertCircle, ImageUp } from 'lucide-react';
import {
  THEME_PRESETS,
  FONT_PAIRINGS,
  DEFAULT_SITE_CONFIG,
  MAX_BANNER_IMAGE_BYTES,
  SiteConfig,
} from '@/lib/siteConfig';

type Tab = 'theme' | 'content';

export default function SiteEditorPage() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [savedConfig, setSavedConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [bannerError, setBannerError] = useState('');
  const [tab, setTab] = useState<Tab>('theme');
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    fetch('/api/admin/site-config')
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        setSavedConfig(data);
        setIsLoading(false);
      });
  }, []);

  const hasUnsavedChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);

  const update = <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const updateMessage = (index: number, value: string) => {
    const next = [...config.announcementMessages];
    next[index] = value;
    update('announcementMessages', next);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        setSavedConfig(updated);
        setSaved(true);
        setPreviewKey((k) => k + 1);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setSaveError('Save failed — please try again.');
      }
    } catch {
      setSaveError('Save failed — check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-stone-200 rounded animate-pulse mb-6" />
        <div className="h-96 bg-stone-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Editor panel */}
      <div className="w-[420px] flex-shrink-0 border-r border-stone-200/70 bg-white flex flex-col h-screen">
        <div className="p-6 border-b border-stone-200/70">
          <h1 className="text-xl font-display font-black text-espresso flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary-600" />
            Site Editor
          </h1>
          <p className="text-sm text-stone-500 mt-1">Customize your storefront's look and copy</p>
        </div>

        <div className="flex border-b border-stone-200/70">
          <button
            onClick={() => setTab('theme')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              tab === 'theme' ? 'text-espresso border-b-2 border-espresso' : 'text-stone-400 hover:text-espresso'
            }`}
          >
            <Palette className="h-4 w-4" />
            Theme
          </button>
          <button
            onClick={() => setTab('content')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              tab === 'content' ? 'text-espresso border-b-2 border-espresso' : 'text-stone-400 hover:text-espresso'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Content
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {tab === 'theme' && (
            <>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Color Theme</h3>
                <div className="grid grid-cols-1 gap-2">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => update('themePresetId', preset.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                        config.themePresetId === preset.id ? 'border-primary-500 bg-primary-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex -space-x-1.5 flex-shrink-0">
                        {preset.swatches.map((c, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-white" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-espresso">{preset.name}</p>
                        <p className="text-xs text-stone-500 truncate">{preset.description}</p>
                      </div>
                      {config.themePresetId === preset.id && <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5" /> Typography
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {FONT_PAIRINGS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => update('fontPairingId', f.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all ${
                        config.fontPairingId === f.id ? 'border-primary-500 bg-primary-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-espresso">{f.name}</p>
                        <p className="text-xs text-stone-500">{f.description}</p>
                      </div>
                      {config.fontPairingId === f.id && <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'content' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Announcement Bar</h3>
                  <label className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.announcementEnabled}
                      onChange={(e) => update('announcementEnabled', e.target.checked)}
                      className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                    />
                    Enabled
                  </label>
                </div>
                <div className="space-y-2">
                  {config.announcementMessages.map((msg, i) => (
                    <input
                      key={i}
                      type="text"
                      value={msg}
                      onChange={(e) => updateMessage(i, e.target.value)}
                      placeholder={`Message ${i + 1}`}
                      className="input-field text-sm"
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Shop Hero</h3>
                <div className="space-y-3">
                  <div>
                    <label className="label text-xs">Eyebrow text</label>
                    <input type="text" value={config.heroEyebrow} onChange={(e) => update('heroEyebrow', e.target.value)} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="label text-xs">Headline</label>
                    <input type="text" value={config.heroHeadline} onChange={(e) => update('heroHeadline', e.target.value)} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="label text-xs">Subtext</label>
                    <textarea value={config.heroSubtext} onChange={(e) => update('heroSubtext', e.target.value)} rows={3} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="label text-xs">Banner image</label>
                    <p className="text-xs text-stone-400 mb-2">
                      Optional — uploading a photo replaces the auto-rotating brand carousel with this single image. Max 1.2 MB.
                    </p>
                    {config.heroBannerImage ? (
                      <div className="relative rounded-xl overflow-hidden border border-stone-200">
                        <img src={config.heroBannerImage} alt="Banner preview" className="w-full h-32 object-cover" />
                        <button
                          type="button"
                          onClick={() => update('heroBannerImage', null)}
                          className="absolute top-2 right-2 bg-espresso/80 hover:bg-espresso text-cream text-xs px-2.5 py-1 rounded-full"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-stone-200 rounded-xl py-6 cursor-pointer hover:border-primary-300 hover:bg-primary-50/40 transition-colors text-center">
                        <ImageUp className="h-5 w-5 text-stone-400" />
                        <span className="text-xs text-stone-500">Click to upload an image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (!file) return;
                            setBannerError('');
                            if (file.size > MAX_BANNER_IMAGE_BYTES) {
                              setBannerError(`Image is too large (${(file.size / 1_000_000).toFixed(1)} MB). Please use one under 1.2 MB.`);
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => update('heroBannerImage', reader.result as string);
                            reader.onerror = () => setBannerError('Could not read that file — please try a different image.');
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    )}
                    {bannerError && (
                      <p className="flex items-center gap-1.5 text-xs text-red-700 mt-2">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {bannerError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Footer</h3>
                <div>
                  <label className="label text-xs">Newsletter tagline</label>
                  <textarea value={config.footerTagline} onChange={(e) => update('footerTagline', e.target.value)} rows={2} className="input-field text-sm" />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Layout</h3>
                <label className="flex items-center gap-2 text-sm text-espresso/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showBrandGrid}
                    onChange={(e) => update('showBrandGrid', e.target.checked)}
                    className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                  />
                  Show "Shop by Brand" section
                </label>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-stone-200/70 space-y-2">
          {hasUnsavedChanges && !isSaving && (
            <p className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              You have unsaved changes — click Save to publish them live.
            </p>
          )}
          {saveError && (
            <p className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {saveError}
            </p>
          )}
          <button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges} className="w-full btn-primary flex items-center justify-center gap-2">
            {saved ? <><Check className="h-4 w-4" /> Saved!</> : isSaving ? 'Saving…' : hasUnsavedChanges ? 'Save Changes' : 'No Changes to Save'}
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="flex-1 flex flex-col bg-stone-100">
        <div className="flex items-center justify-between px-4 py-2 border-b border-stone-200/70 bg-white">
          <p className="text-xs text-stone-500">Preview — reflects your last saved changes</p>
          <div className="flex items-center gap-4">
            <a
              href="/shop"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-espresso/70 hover:text-espresso"
            >
              <ExternalLink className="h-3 w-3" /> View Live Site
            </a>
            <button
              onClick={() => setPreviewKey((k) => k + 1)}
              className="flex items-center gap-1.5 text-xs text-espresso/70 hover:text-espresso"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        </div>
        <iframe key={previewKey} src="/shop" className="flex-1 w-full border-0" title="Site preview" />
      </div>
    </div>
  );
}
