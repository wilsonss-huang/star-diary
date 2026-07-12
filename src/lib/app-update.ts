import AppUpdate from '../plugins/AppUpdate';

interface GitHubRelease {
  tag_name: string;
  name: string;
  assets: Array<{ name: string; browser_download_url: string; size: number }>;
}

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

function cleanTag(tag: string): string {
  return tag.replace(/^v/, '');
}

/** Cache check result in sessionStorage so we don't re-prompt on every navigation. */
const CACHE_KEY = 'star-diary-update-check';
const CACHE_TTL = 1000 * 60 * 60 * 3; // 3 hours

interface CheckResult {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  downloadUrl?: string;
}

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

  // Use session cache to avoid hitting API rate limits too often
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
    const response = await fetch(
      'https://api.github.com/repos/wilsonss-huang/star-diary/releases/latest',
      { headers: { Accept: 'application/vnd.github.v3+json' } },
    );
    if (!response.ok) {
      return { hasUpdate: false, latestVersion: currentVersion, currentVersion };
    }

    const release: GitHubRelease = await response.json();
    const latestVersion = cleanTag(release.tag_name);
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

    const apkAsset = release.assets.find(
      (asset) => asset.name.endsWith('.apk') && asset.name.includes('android'),
    );

    const result: CheckResult = {
      hasUpdate,
      latestVersion,
      currentVersion,
      downloadUrl: apkAsset?.browser_download_url,
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
 * The user must confirm the system install dialog.
 */
export async function downloadAndInstall(
  url: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  try {
    // Only available on Android
    if (!AppUpdate.downloadAndInstall) {
      // Web/desktop fallback: open download page in browser
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
    console.warn('[AppUpdate] 原生安装失败，降级到浏览器下载:', error);
    window.open(url, '_blank');
  }
}
