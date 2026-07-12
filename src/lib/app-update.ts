import AppUpdate from '../plugins/AppUpdate';

/**
 * Strips the leading 'v' and compares two semver strings.
 * Returns a positive number when a > b, negative when a < b, 0 when equal.
 */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Cache check result so we don't re-prompt on every navigation. */
const CACHE_KEY = 'star-diary-update-check';
const CACHE_TTL = 1000 * 60 * 60 * 3; // 3 hours

interface CheckResult {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  downloadUrl?: string;
}

/** CloudBase static hosting — domestic CDN, no VPN needed. */
const BASE_URL = 'https://star-diary-d0gt774ca5a0cbd1d-1451273426.tcloudbaseapp.com';
const VERSION_URL = `${BASE_URL}/version.json`;

/**
 * IMPORTANT: Bump this constant on every release so the in-app update check
 * compares against the correct baseline.
 */
const APP_VERSION = '1.1.0';

/** Returns the current app version. */
async function getCurrentVersion(): Promise<string> {
  return APP_VERSION;
}

export async function checkForUpdate(): Promise<CheckResult> {
  const currentVersion = await getCurrentVersion();

  // Use session cache to avoid hammering CDN
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as CheckResult & { ts: number };
      if (Date.now() - parsed.ts < CACHE_TTL) {
        return parsed;
      }
    }
  } catch { /* ignore */ }

  try {
    const response = await fetch(VERSION_URL, { cache: 'no-cache' });
    if (!response.ok) {
      return { hasUpdate: false, latestVersion: currentVersion, currentVersion };
    }

    const info = (await response.json()) as { version: string; android?: string };
    const latestVersion = info.version.replace(/^v/, '');
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

    const result: CheckResult = {
      hasUpdate,
      latestVersion,
      currentVersion,
      downloadUrl: info.android,
    };

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...result, ts: Date.now() }));
    } catch { /* ignore */ }

    return result;
  } catch {
    return { hasUpdate: false, latestVersion: currentVersion, currentVersion };
  }
}

/**
 * Call on Android: downloads the APK via the native plugin and triggers install.
 * Falls back to opening the download URL in the browser.
 */
export async function downloadAndInstall(
  url: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  try {
    if (!AppUpdate.downloadAndInstall) {
      window.open(url, '_blank');
      return;
    }

    if (onProgress) {
      await AppUpdate.addListener('downloadProgress', (info) => {
        onProgress(info.value);
      });
    }

    await AppUpdate.downloadAndInstall({ url });
  } catch (error) {
    console.warn('[AppUpdate] 安装失败，跳转浏览器下载:', error);
    window.open(url, '_blank');
  }
}
