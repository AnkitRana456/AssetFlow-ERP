import QRCode from 'qrcode';

/**
 * Generate a QR Code as a base64 Data URI
 * @param text The payload to embed inside the QR Code (e.g. asset URL or tag)
 */
export async function generateQRCodeDataURI(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      width: 300
    });
  } catch (err) {
    console.error('❌ Failed to generate QR Code:', err);
    throw err;
  }
}
