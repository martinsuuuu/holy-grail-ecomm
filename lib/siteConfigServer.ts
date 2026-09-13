import { db } from '@/lib/db';
import { storeSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { DEFAULT_SITE_CONFIG, SiteConfig, mergeSiteConfig } from '@/lib/siteConfig';

const SETTINGS_KEY = 'site_config';

export async function fetchSiteConfig(): Promise<SiteConfig> {
  try {
    const row = await db.select().from(storeSettings).where(eq(storeSettings.key, SETTINGS_KEY)).limit(1);
    if (!row[0]) return DEFAULT_SITE_CONFIG;
    return mergeSiteConfig(JSON.parse(row[0].value));
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

export async function saveSiteConfig(config: SiteConfig): Promise<void> {
  const value = JSON.stringify(config);
  await db.insert(storeSettings)
    .values({ key: SETTINGS_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: storeSettings.key, set: { value, updatedAt: new Date() } });
}
