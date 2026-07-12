package com.stardiary.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String downloadUrl = call.getString("url");
        if (downloadUrl == null || downloadUrl.isEmpty()) {
            call.reject("缺少下载地址 url");
            return;
        }

        getBridge().executeOnMainThread(() -> {
            try {
                String fileName = "star-diary-update.apk";
                File dir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (dir == null) {
                    dir = getContext().getCacheDir();
                }
                if (!dir.exists()) dir.mkdirs();
                File apkFile = new File(dir, fileName);

                // Download APK
                URL url = new URL(downloadUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(30000);
                conn.setInstanceFollowRedirects(true);
                conn.connect();

                int fileLength = conn.getContentLength();
                InputStream input = conn.getInputStream();
                FileOutputStream output = new FileOutputStream(apkFile);
                byte[] buffer = new byte[4096];
                int bytesRead;
                int totalRead = 0;
                while ((bytesRead = input.read(buffer)) != -1) {
                    output.write(buffer, 0, bytesRead);
                    totalRead += bytesRead;
                    // Notify frontend of progress
                    if (fileLength > 0) {
                        JSObject progress = new JSObject();
                        progress.put("value", (double) totalRead / fileLength);
                        notifyListeners("downloadProgress", progress);
                    }
                }
                output.close();
                input.close();
                conn.disconnect();

                // Trigger install via FileProvider
                Uri apkUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    apkFile
                );

                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                // On API 26+ need to allow install from unknown sources
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    if (!getContext().getPackageManager().canRequestPackageInstalls()) {
                        Intent settingsIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                        settingsIntent.setData(Uri.parse("package:" + getContext().getPackageName()));
                        getContext().startActivity(settingsIntent);
                    }
                }

                getContext().startActivity(intent);

                JSObject result = new JSObject();
                result.put("installed", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("下载或安装失败: " + e.getMessage(), "INSTALL_FAILED");
            }
        });
    }
}
