import { registerPlugin } from '@capacitor/core';

export interface AppUpdatePlugin {
  /**
   * Downloads an APK from the given URL and triggers the system package installer.
   * Emits `downloadProgress` events with `{ value: 0..1 }`.
   */
  downloadAndInstall(options: { url: string }): Promise<{ installed: boolean }>;
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (info: { value: number }) => void,
  ): Promise<{ remove: () => void }> & { remove: () => void };
}

const AppUpdate = registerPlugin<AppUpdatePlugin>('AppUpdate');

export default AppUpdate;
