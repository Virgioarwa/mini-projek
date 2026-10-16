/**
 * Universal File Downloader & Native Share Helper
 * Mendukung Browser Standar, PWA, dan Android APK (Capacitor / WebView).
 *
 * Pada Android WebView / APK offline, tautan <a download="blob:..."> sering diabaikan
 * tanpa respon karena WebView tidak memiliki DownloadListener bawaan.
 * Helper ini memprioritaskan Web Share API (navigator.share dengan File),
 * sehingga memunculkan lembar simpan/berbagi Android ("Simpan ke Perangkat / File Manager / Drive / WA"),
 * serta menyediakan fallback clipboard dan tautan unduhan standar.
 */

export async function downloadOrShareBlob(
  blob: Blob,
  fileName: string,
  title: string = 'Unduh File',
  mimeType: string = 'application/octet-stream'
): Promise<{ success: boolean; method: 'share' | 'download' | 'data-uri' | 'cancelled' | 'error'; message?: string }> {
  // 1. Coba gunakan Web Share API jika didukung untuk file (Sangat ampuh di Android APK & Mobile)
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
      if (err.name === 'AbortError') {
        // Pengguna membatalkan dialog share Android
        return { success: true, method: 'cancelled', message: 'Penyimpanan file dibatalkan.' };
      }
      console.warn('navigator.share failed, fallback to anchor download:', err);
    }
  }

  // 2. Fallback untuk Desktop Browser & PWA: Standar anchor <a download>
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

  // 3. Fallback Data URI (Jika blob: diblokir oleh WebView)
  try {
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onloadend = () => {
        try {
          const dataUri = reader.result as string;
          const a = document.createElement('a');
          a.href = dataUri;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => document.body.removeChild(a), 1000);
          resolve({ success: true, method: 'data-uri', message: `File ${fileName} siap disimpan.` });
        } catch (e: any) {
          resolve({ success: false, method: 'error', message: 'Gagal mengunduh file secara otomatis.' });
        }
      };
      reader.readAsDataURL(blob);
    });
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
