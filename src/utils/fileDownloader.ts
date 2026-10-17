import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Universal File Downloader & Native Share Helper
 * Mendukung Browser Standar, PWA, dan Android APK (Capacitor / WebView).
 *
 * Pada Android WebView / APK offline, tautan <a download="blob:..."> sering diabaikan
 * tanpa respon karena WebView tidak memiliki DownloadListener bawaan.
 * Helper ini memprioritaskan Native Capacitor Filesystem + Share di Android APK,
 * lalu Web Share API, dan fallback ke tautan unduhan standar / clipboard.
 */

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

export async function downloadOrShareBlob(
  blob: Blob,
  fileName: string,
  title: string = 'Unduh File',
  mimeType: string = 'application/octet-stream'
): Promise<{ success: boolean; method: 'share' | 'download' | 'data-uri' | 'cancelled' | 'error'; message?: string }> {
  // 1. NATIVE ANDROID / IOS PLATFORM (CAPACITOR APK)
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);

      // Simpan berkas ke direktori Cache aplikasi agar memiliki FileProvider content:// URI
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Buka Native Android Intent Chooser / Share Sheet
      await Share.share({
        title: title || fileName,
        text: `File ${fileName} dari Kasir Virgio Celluler`,
        url: savedFile.uri,
        dialogTitle: 'Simpan atau Bagikan File',
      });

      return {
        success: true,
        method: 'share',
        message: 'Dialog penyimpanan berkas Android berhasil dibuka. Silakan pilih Simpan ke File, Drive, atau WhatsApp.',
      };
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.message?.toLowerCase().includes('cancel')) {
        return { success: true, method: 'cancelled', message: 'Penyimpanan berkas dibatalkan.' };
      }
      console.warn('Capacitor native share failed, falling back to Web API:', err);
    }
  }

  // 2. WEB SHARE API (Mobile Web, Chrome Android, Safari iOS)
  if (typeof navigator !== 'undefined' && navigator.canShare && typeof File !== 'undefined') {
    try {
      const file = new File([blob], fileName, { type: mimeType });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: `File ${fileName} dari Kasir Virgio Celluler`,
        });
        return { success: true, method: 'share', message: 'File berhasil dibagikan / disimpan!' };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { success: true, method: 'cancelled', message: 'Penyimpanan file dibatalkan.' };
      }
      console.warn('navigator.share failed, fallback to anchor download:', err);
    }
  }

  // 3. DESKTOP BROWSER ANCHOR DOWNLOAD
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
    return { success: true, method: 'download', message: `File ${fileName} berhasil diunduh.` };
  } catch (err) {
    console.warn('Anchor blob download failed, trying data URI fallback:', err);
  }

  // 4. DATA URI FALLBACK (Jika blob: diblokir)
  try {
    const base64 = await blobToBase64(blob);
    const dataUri = `data:${mimeType};base64,${base64}`;
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 1000);
    return { success: true, method: 'data-uri', message: `File ${fileName} siap disimpan.` };
  } catch (err: any) {
    return { success: false, method: 'error', message: err?.message || 'Gagal mengunduh file.' };
  }
}

/**
 * Salin teks langsung ke clipboard pengguna (100% bekerja di semua Android APK & WebView)
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback execCommand
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error('Copy to clipboard failed:', err);
    return false;
  }
}
