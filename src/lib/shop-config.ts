import { SHIPPING } from "./checkout";

export type PublicShopConfig = {
  whatsappE164: string | null;
  methods: { cod: true; esewa: boolean; khalti: boolean; fonepay: boolean };
  sellerReady: boolean;
  shipping: {
    valleyFeePaisa: number;
    valleyFreeOverPaisa: number;
    outsideFeePaisa: number;
    outsideFreeOverPaisa: number;
  };
};

/** Public WhatsApp number. Returns null when the value is not a Nepal mobile. */
export function parseWhatsappE164(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (/^9779\d{9}$/.test(digits)) return digits;
  if (/^9\d{9}$/.test(digits)) return `977${digits}`;
  return null;
}

export function publicConfigFromEnv(env: Record<string, string | undefined>): PublicShopConfig {
  const pan = env.SELLER_PAN?.trim() ?? "";
  return {
    whatsappE164: parseWhatsappE164(env.WHATSAPP_E164),
    methods: {
      cod: true,
      esewa: Boolean(env.ESEWA_PRODUCT_CODE?.trim() && env.ESEWA_SECRET_KEY?.trim()),
      khalti: Boolean(env.KHALTI_SECRET_KEY?.trim()),
      fonepay: Boolean(
        env.FONEPAY_MERCHANT_CODE?.trim() &&
          env.FONEPAY_USERNAME?.trim() &&
          env.FONEPAY_PASSWORD?.trim() &&
          env.FONEPAY_SECRET?.trim(),
      ),
    },
    sellerReady: /^\d{9}$/.test(pan),
    shipping: { ...SHIPPING },
  };
}
