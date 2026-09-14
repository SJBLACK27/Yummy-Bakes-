import QRCode from "qrcode";

/** Build a UPI deep-link payment payload for the exact bill value. */
export function buildUpiUri(amountInr: number, ref: string): string {
  const pa = process.env.UPI_ID || "yummybakes@okhdfcbank";
  const pn = encodeURIComponent("Yummy Bakes");
  const tn = encodeURIComponent(`Yummy Bakes ${ref}`);
  return `upi://pay?pa=${pa}&pn=${pn}&am=${amountInr.toFixed(2)}&cu=INR&tn=${tn}`;
}

/** Generate a scannable QR code (data-URL PNG) from any payload. */
export async function qrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    margin: 1,
    width: 560,
    errorCorrectionLevel: "M",
    color: { dark: "#2e1b0e", light: "#fffaf1" },
  });
}
