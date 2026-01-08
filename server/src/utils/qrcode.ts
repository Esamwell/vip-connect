import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

/**
 * Gera um código QR único para o cliente VIP
 */
export const generateQRCode = (): string => {
  return 'VIP-' + uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
};

/**
 * Gera QR Code físico (fixo)
 */
export const generateQRCodeFisico = (): string => {
  return 'FISICO-' + uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
};

/**
 * Gera imagem QR Code em base64
 */
export const generateQRCodeImage = async (data: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    });
    return qrCodeDataURL;
  } catch (error) {
    throw new Error('Erro ao gerar QR Code');
  }
};

