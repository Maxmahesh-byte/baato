import { ESEWA_FORM_URL, ESEWA_STATUS_URL } from "./payments/esewa";
import { FONEPAY_API } from "./payments/fonepay";
import { KHALTI_API } from "./payments/khalti";
import { publicConfigFromEnv, type PublicShopConfig } from "./shop-config";
import { SITE } from "./site";

export function getPublicShopConfig(): PublicShopConfig {
  return publicConfigFromEnv(process.env);
}

export function sellerFromEnv() {
  return {
    legalName: process.env.SELLER_LEGAL_NAME?.trim() || "BAATO Parts",
    address: process.env.SELLER_ADDRESS?.trim() || "Kathmandu, Nepal",
    pan: process.env.SELLER_PAN?.trim() || "",
    phone: process.env.SELLER_PHONE?.trim() || SITE.phone,
  };
}

export function esewaEnv() {
  const productCode = process.env.ESEWA_PRODUCT_CODE?.trim() ?? "";
  const secret = process.env.ESEWA_SECRET_KEY?.trim() ?? "";
  const prod = process.env.ESEWA_ENV === "prod";
  return {
    enabled: Boolean(productCode && secret),
    productCode,
    secret,
    formUrl: process.env.ESEWA_FORM_URL?.trim() || (prod ? ESEWA_FORM_URL.prod : ESEWA_FORM_URL.uat),
    statusUrl: process.env.ESEWA_STATUS_URL?.trim() || (prod ? ESEWA_STATUS_URL.prod : ESEWA_STATUS_URL.uat),
  };
}

export function khaltiEnv() {
  const secret = process.env.KHALTI_SECRET_KEY?.trim() ?? "";
  const prod = process.env.KHALTI_ENV === "prod";
  return {
    enabled: Boolean(secret),
    secret,
    baseUrl: process.env.KHALTI_API_URL?.trim() || (prod ? KHALTI_API.prod : KHALTI_API.uat),
  };
}

export function fonepayEnv() {
  const merchantCode = process.env.FONEPAY_MERCHANT_CODE?.trim() ?? "";
  const username = process.env.FONEPAY_USERNAME?.trim() ?? "";
  const password = process.env.FONEPAY_PASSWORD?.trim() ?? "";
  const secret = process.env.FONEPAY_SECRET?.trim() ?? "";
  const prod = process.env.FONEPAY_ENV === "prod";
  const root = process.env.FONEPAY_API_URL?.trim() || (prod ? FONEPAY_API.prod : FONEPAY_API.uat);
  return {
    enabled: Boolean(merchantCode && username && password && secret),
    merchantCode,
    username,
    password,
    secret,
    qrUrl: `${root}/thirdPartyDynamicQrDownload`,
    statusUrl: `${root}/thirdPartyDynamicQrGetStatus`,
  };
}
