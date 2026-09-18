'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Palette, Type, MessageSquare, Layout, Check, RefreshCw, ExternalLink, AlertCircle, ImageUp,
  Megaphone, GalleryHorizontal, ShieldCheck, Search, Grid3x3, Sparkles, PanelBottom, Zap, BarChart3,
  Plus, Trash2, ChevronUp, ChevronDown, RotateCcw, Sparkle,
} from 'lucide-react';
import {
  THEME_PRESETS,
  FONT_OPTIONS,
  DEFAULT_SITE_CONFIG,
  MAX_IMAGE_BYTES,
  MAX_HERO_SLIDES,
  SiteConfig,
  HeroSlide,
} from '@/lib/siteConfig';

type Tab = 'theme' | 'content';

type SectionId = 'announcement' | 'hero' | 'quickActions' | 'trust' | 'sourcing' | 'brandGrid' | 'stats' | 'cta' | 'footer';

const CONTENT_SECTIONS: { id: SectionId; label: string; icon: typeof Megaphone }[] = [
  { id: 'announcement', label: 'Announcement Bar', icon: Megaphone },
  { id: 'hero', label: 'Hero Carousel', icon: GalleryHorizontal },
  { id: 'quickActions', label: 'Quick Actions', icon: Zap },
  { id: 'trust', label: 'Trust Strip', icon: ShieldCheck },
  { id: 'sourcing', label: 'Personal Sourcing', icon: Search },
  { id: 'brandGrid', label: 'Shop by Brand', icon: Grid3x3 },
  { id: 'stats', label: 'By the Numbers', icon: BarChart3 },
  { id: 'cta', label: 'Experience CTA', icon: Sparkles },
  { id: 'footer', label: 'Footer', icon: PanelBottom },
];

function readImageFile(file: File, onLoaded: (dataUrl: string) => void, onError: (msg: string) => void) {
  if (file.size > MAX_IMAGE_BYTES) {
    onError(`Image is too large (${(file.size / 1_000_000).toFixed(1)} MB). Please use one under ${(MAX_IMAGE_BYTES / 1_000_000).toFixed(1)} MB.`);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onLoaded(reader.result as string);
  reader.onerror = () => onError('Could not read that file — please try a different image.');
  reader.readAsDataURL(file);
}

function newSlide(): HeroSlide {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `slide-${Date.now()}-${Math.random()}`,
    image: null,
    eyebrow: '',
    caption: '',
    subcaption: '',
    link: '',
  };
}

export default function SiteEditorPage() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [savedConfig, setSavedConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [imageError, setImageError] = useState('');
  const [tab, setTab] = useState<Tab>('theme');
  const [section, setSection] = useState<SectionId>('announcement');
  const [previewKey, setPreviewKey] = useState(0);
  const [autoSlides, setAutoSlides] = useState<{ category: string; name: string; imageUrl: string }[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // What the live carousel currently auto-generates when no custom slides
  // are set — shown so admins can see what's already there before deciding
  // whether/how to customize it.
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: { category: string | null; name: string; imageUrl: string | null }[]) => {
        const seen = new Set<string>();
        const result: { category: string; name: string; imageUrl: string }[] = [];
        for (const p of data) {
          if (p.category && p.imageUrl && !seen.has(p.category)) {
            seen.add(p.category);
            result.push({ category: p.category, name: p.name, imageUrl: p.imageUrl });
          }
        }
        setAutoSlides(result);
      })
      .catch(() => {});
  }, []);

  // Push the in-progress (unsaved) config into the preview iframe on every
  // change, so the admin can see edits live before saving — the iframe only
  // ever fetches the real saved state on its own for a genuinely fresh load.
  const postPreview = (cfg: SiteConfig) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'HOLY_GRAIL_PREVIEW_CONFIG', config: cfg }, window.location.origin);
  };

  useEffect(() => {
    postPreview(config);
  }, [config]);

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

  const updateTrustItem = (index: number, patch: Partial<{ label: string; desc: string }>) => {
    const next = config.trustItems.map((item, i) => (i === index ? { ...item, ...patch } : item));
    update('trustItems', next);
  };

  const updateQuickAction = (index: number, patch: Partial<{ label: string; desc: string; href: string }>) => {
    const next = config.quickActions.map((item, i) => (i === index ? { ...item, ...patch } : item));
    update('quickActions', next);
  };

  const updateStatItem = (index: number, patch: Partial<{ value: string; label: string }>) => {
    const next = config.statsItems.map((item, i) => (i === index ? { ...item, ...patch } : item));
    update('statsItems', next);
  };

  const updateSlide = (id: string, patch: Partial<HeroSlide>) => {
    update('heroSlides', config.heroSlides.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };
  const addSlide = () => {
    if (config.heroSlides.length >= MAX_HERO_SLIDES) return;
    update('heroSlides', [...config.heroSlides, newSlide()]);
  };
  const removeSlide = (id: string) => update('heroSlides', config.heroSlides.filter((s) => s.id !== id));
  const seedSlidesFromAuto = () => {
    const seeded: HeroSlide[] = autoSlides.slice(0, MAX_HERO_SLIDES).map((p) => ({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `slide-${Date.now()}-${Math.random()}`,
      image: p.imageUrl,
      eyebrow: 'Now Featuring',
      caption: p.category,
      subcaption: p.name,
      link: `/shop?category=${encodeURIComponent(p.category)}`,
    }));
    update('heroSlides', seeded);
  };
  const moveSlide = (id: string, dir: -1 | 1) => {
    const idx = config.heroSlides.findIndex((s) => s.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= config.heroSlides.length) return;
    const next = [...config.heroSlides];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    update('heroSlides', next);
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
      <div className="w-[440px] flex-shrink-0 border-r border-stone-200/70 bg-white flex flex-col h-screen">
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

        {tab === 'content' && (
          <div className="flex flex-wrap gap-1.5 p-3 border-b border-stone-200/70 bg-stone-50/60">
            {CONTENT_SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  section === s.id
                    ? 'bg-espresso text-cream border-espresso'
                    : 'bg-white text-espresso/70 border-stone-200 hover:border-primary-300'
                }`}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>
        )}

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
                  <Type className="h-3.5 w-3.5" /> Heading Font
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => update('headingFontId', f.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all ${
                        config.headingFontId === f.id ? 'border-primary-500 bg-primary-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div>
                        <p className={`text-base text-espresso ${f.previewClass}`} style={{ fontFamily: `var(${f.cssVar})` }}>{f.name}</p>
                        <p className="text-xs text-stone-500">{f.description}</p>
                      </div>
                      {config.headingFontId === f.id && <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5" /> Body Font
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => update('bodyFontId', f.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all ${
                        config.bodyFontId === f.id ? 'border-primary-500 bg-primary-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div>
                        <p className="text-sm text-espresso" style={{ fontFamily: `var(${f.cssVar})` }}>{f.name} — the quick brown fox</p>
                        <p className="text-xs text-stone-500">{f.description}</p>
                      </div>
                      {config.bodyFontId === f.id && <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'content' && section === 'announcement' && (
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
          )}

          {tab === 'content' && section === 'hero' && (
            <>
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
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Carousel Slides</h3>
                  <span className="text-[11px] text-stone-400">{config.heroSlides.length}/{MAX_HERO_SLIDES}</span>
                </div>
                <p className="text-xs text-stone-400 mb-3">
                  Leave empty to auto-rotate one photo per brand. Add slides here to take full control — each can have its own image, caption, and link.
                </p>

                {config.heroSlides.length === 0 && autoSlides.length > 0 && (
                  <div className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                    <p className="text-xs font-semibold text-espresso mb-2">Currently showing (auto-rotating)</p>
                    <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                      {autoSlides.slice(0, MAX_HERO_SLIDES).map((s) => (
                        <div key={s.category} className="relative aspect-[5/2] rounded-lg overflow-hidden border border-stone-200">
                          <img src={s.imageUrl} alt={s.category} className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={seedSlidesFromAuto}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium text-espresso/80 hover:border-primary-300 hover:text-primary-700 transition-colors"
                    >
                      <Sparkle className="h-3.5 w-3.5" /> Use these as a starting point
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  {config.heroSlides.map((slide, i) => (
                    <div key={slide.id} className="border border-stone-200 rounded-2xl p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-espresso">Slide {i + 1}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => moveSlide(slide.id, -1)} disabled={i === 0} className="p-1 rounded text-stone-400 hover:text-espresso disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => moveSlide(slide.id, 1)} disabled={i === config.heroSlides.length - 1} className="p-1 rounded text-stone-400 hover:text-espresso disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => removeSlide(slide.id)} className="p-1 rounded text-red-500 hover:text-red-700">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {slide.image ? (
                        <div className="relative aspect-[5/2] rounded-xl overflow-hidden border border-stone-200">
                          <img src={slide.image} alt={`Slide ${i + 1} preview`} className="absolute inset-0 w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => updateSlide(slide.id, { image: null })}
                            className="absolute top-2 right-2 bg-espresso/80 hover:bg-espresso text-cream text-xs px-2.5 py-1 rounded-full"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-1 aspect-[5/2] border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-primary-50/40 transition-colors text-center">
                          <ImageUp className="h-4 w-4 text-stone-400" />
                          <span className="text-xs text-stone-500">Upload an image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              if (!file) return;
                              setImageError('');
                              readImageFile(file, (url) => updateSlide(slide.id, { image: url }), setImageError);
                            }}
                          />
                        </label>
                      )}

                      <input
                        type="text"
                        value={slide.eyebrow}
                        onChange={(e) => updateSlide(slide.id, { eyebrow: e.target.value })}
                        placeholder="Eyebrow (e.g. Now Featuring)"
                        className="input-field text-xs"
                      />
                      <input
                        type="text"
                        value={slide.caption}
                        onChange={(e) => updateSlide(slide.id, { caption: e.target.value })}
                        placeholder="Caption (e.g. Chanel)"
                        className="input-field text-xs"
                      />
                      <input
                        type="text"
                        value={slide.subcaption}
                        onChange={(e) => updateSlide(slide.id, { subcaption: e.target.value })}
                        placeholder="Subcaption (e.g. product name)"
                        className="input-field text-xs"
                      />
                      <input
                        type="text"
                        value={slide.link}
                        onChange={(e) => updateSlide(slide.id, { link: e.target.value })}
                        placeholder="Link when clicked (e.g. /shop?category=Chanel)"
                        className="input-field text-xs"
                      />
                    </div>
                  ))}
                </div>

                {imageError && (
                  <p className="flex items-center gap-1.5 text-xs text-red-700 mt-2">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {imageError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={addSlide}
                  disabled={config.heroSlides.length >= MAX_HERO_SLIDES}
                  className="w-full flex items-center justify-center gap-1.5 mt-3 py-2.5 rounded-xl border-2 border-dashed border-stone-200 text-sm text-espresso/70 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add Slide
                </button>
              </div>
            </>
          )}

          {tab === 'content' && section === 'quickActions' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Quick Actions</h3>
              <p className="text-xs text-stone-400 mb-3">Three clickable cards directly under the hero banner.</p>
              <div className="space-y-3">
                {config.quickActions.map((action, i) => (
                  <div key={i} className="border border-stone-200 rounded-2xl p-3 space-y-2">
                    <input
                      type="text"
                      value={action.label}
                      onChange={(e) => updateQuickAction(i, { label: e.target.value })}
                      placeholder="Label"
                      className="input-field text-sm"
                    />
                    <input
                      type="text"
                      value={action.desc}
                      onChange={(e) => updateQuickAction(i, { desc: e.target.value })}
                      placeholder="Description"
                      className="input-field text-xs"
                    />
                    <input
                      type="text"
                      value={action.href}
                      onChange={(e) => updateQuickAction(i, { href: e.target.value })}
                      placeholder="Link (e.g. /contact)"
                      className="input-field text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'content' && section === 'trust' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Trust Strip</h3>
              <p className="text-xs text-stone-400 mb-3">The four icons under the hero banner.</p>
              <div className="space-y-3">
                {config.trustItems.map((item, i) => (
                  <div key={i} className="border border-stone-200 rounded-2xl p-3 space-y-2">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateTrustItem(i, { label: e.target.value })}
                      placeholder="Label"
                      className="input-field text-sm"
                    />
                    <input
                      type="text"
                      value={item.desc}
                      onChange={(e) => updateTrustItem(i, { desc: e.target.value })}
                      placeholder="Description"
                      className="input-field text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'content' && section === 'sourcing' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Personal Sourcing</h3>
              <div className="space-y-3">
                <div>
                  <label className="label text-xs">Eyebrow text</label>
                  <input type="text" value={config.sourcingEyebrow} onChange={(e) => update('sourcingEyebrow', e.target.value)} className="input-field text-sm" />
                </div>
                <div>
                  <label className="label text-xs">Headline</label>
                  <input type="text" value={config.sourcingHeadline} onChange={(e) => update('sourcingHeadline', e.target.value)} className="input-field text-sm" />
                </div>
                <div>
                  <label className="label text-xs">Body text</label>
                  <textarea value={config.sourcingText} onChange={(e) => update('sourcingText', e.target.value)} rows={4} className="input-field text-sm" />
                </div>
                <div>
                  <label className="label text-xs">Image</label>
                  <div className="relative rounded-xl overflow-hidden border border-stone-200 mb-2">
                    <img src={config.sourcingImage} alt="Sourcing preview" className="w-full h-32 object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-1.5 border-2 border-dashed border-stone-200 rounded-xl py-2.5 cursor-pointer hover:border-primary-300 hover:bg-primary-50/40 transition-colors text-center">
                      <ImageUp className="h-4 w-4 text-stone-400" />
                      <span className="text-xs text-stone-500">Change image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          setImageError('');
                          readImageFile(file, (url) => update('sourcingImage', url), setImageError);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => update('sourcingImage', DEFAULT_SITE_CONFIG.sourcingImage)}
                      className="px-3 py-2.5 rounded-xl border border-stone-200 text-xs text-espresso/70 hover:border-primary-300"
                    >
                      Reset
                    </button>
                  </div>
                  {imageError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-700 mt-2">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      {imageError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'content' && section === 'brandGrid' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Shop by Brand</h3>
              <label className="flex items-center gap-2 text-sm text-espresso/80 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={config.showBrandGrid}
                  onChange={(e) => update('showBrandGrid', e.target.checked)}
                  className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                />
                Show this section
              </label>
              <div className="space-y-3">
                <div>
                  <label className="label text-xs">Eyebrow text</label>
                  <input type="text" value={config.brandGridEyebrow} onChange={(e) => update('brandGridEyebrow', e.target.value)} className="input-field text-sm" />
                </div>
                <div>
                  <label className="label text-xs">Headline</label>
                  <input type="text" value={config.brandGridHeading} onChange={(e) => update('brandGridHeading', e.target.value)} className="input-field text-sm" />
                </div>
                <div>
                  <label className="label text-xs">Subheading</label>
                  <input type="text" value={config.brandGridSubheading} onChange={(e) => update('brandGridSubheading', e.target.value)} className="input-field text-sm" />
                </div>
              </div>
            </div>
          )}

          {tab === 'content' && section === 'stats' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">By the Numbers</h3>
              <div className="mb-3">
                <label className="label text-xs">Eyebrow text</label>
                <input type="text" value={config.statsEyebrow} onChange={(e) => update('statsEyebrow', e.target.value)} className="input-field text-sm" />
              </div>
              <div className="space-y-3">
                {config.statsItems.map((stat, i) => (
                  <div key={i} className="border border-stone-200 rounded-2xl p-3 flex gap-2">
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => updateStatItem(i, { value: e.target.value })}
                      placeholder="500+"
                      className="input-field text-sm w-24"
                    />
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => updateStatItem(i, { label: e.target.value })}
                      placeholder="Label"
                      className="input-field text-sm flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'content' && section === 'cta' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Experience CTA</h3>
              <div className="space-y-3">
                <div>
                  <label className="label text-xs">Eyebrow text</label>
                  <input type="text" value={config.ctaEyebrow} onChange={(e) => update('ctaEyebrow', e.target.value)} className="input-field text-sm" />
                </div>
                <div>
                  <label className="label text-xs">Headline</label>
                  <input type="text" value={config.ctaHeadline} onChange={(e) => update('ctaHeadline', e.target.value)} className="input-field text-sm" />
                </div>
                <div>
                  <label className="label text-xs">Body text</label>
                  <textarea value={config.ctaText} onChange={(e) => update('ctaText', e.target.value)} rows={3} className="input-field text-sm" />
                </div>
              </div>
            </div>
          )}

          {tab === 'content' && section === 'footer' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Footer</h3>
              <label className="label text-xs">Newsletter tagline</label>
              <textarea value={config.footerTagline} onChange={(e) => update('footerTagline', e.target.value)} rows={2} className="input-field text-sm" />
            </div>
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
          <div className="flex gap-2">
            <button
              onClick={() => setConfig(savedConfig)}
              disabled={isSaving || !hasUnsavedChanges}
              title="Discard unsaved changes and go back to what's currently live"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-stone-200 text-sm font-medium text-espresso/70 hover:border-red-300 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Revert
            </button>
            <button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges} className="flex-1 btn-primary flex items-center justify-center gap-2">
              {saved ? <><Check className="h-4 w-4" /> Saved!</> : isSaving ? 'Saving…' : hasUnsavedChanges ? 'Save Changes' : 'No Changes to Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="flex-1 flex flex-col bg-stone-100">
        <div className="flex items-center justify-between px-4 py-2 border-b border-stone-200/70 bg-white">
          <p className="text-xs text-stone-500 flex items-center gap-1.5">
            {hasUnsavedChanges ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                Live preview — showing your unsaved edits
              </>
            ) : (
              'Live preview — matches what\'s currently saved'
            )}
          </p>
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
        <iframe
          key={previewKey}
          ref={iframeRef}
          src="/shop"
          onLoad={() => postPreview(config)}
          className="flex-1 w-full border-0"
          title="Site preview"
        />
      </div>
    </div>
  );
}
