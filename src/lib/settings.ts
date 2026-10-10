import type { TenantDb } from './tenant-db';
import type { PricingPercentages } from './pricing';
import { DEFAULT_SETTINGS, type BusinessSettings } from './settings-defaults';

export { DEFAULT_SETTINGS, BUSINESS_TYPE_PRESETS } from './settings-defaults';
export type { BusinessSettings } from './settings-defaults';

export async function getBusinessSettings(db: TenantDb): Promise<BusinessSettings> {
  const row = await db.tenantSettings.findUnique({ where: { id: 1 } });
  if (!row) return DEFAULT_SETTINGS;
  return {
    businessName: row.businessName,
    businessType: row.businessType,
    address: row.address,
    city: row.city,
    taxCondition: row.taxCondition,
    variantAttr1Label: row.variantAttr1Label,
    variantAttr2Label: row.variantAttr2Label,
    useVariants: row.useVariants,
    defaultMarginCash: Number(row.defaultMarginCash),
    defaultSurchargeDebit: Number(row.defaultSurchargeDebit),
    defaultSurchargeFinanced: Number(row.defaultSurchargeFinanced),
    priceRounding: row.priceRounding,
    defaultMinStockAlert: row.defaultMinStockAlert,
    storeEnabled: row.storeEnabled,
    storeWhatsapp: row.storeWhatsapp,
    storePriceType: row.storePriceType,
    storeShowOutOfStock: row.storeShowOutOfStock,
    storePickup: row.storePickup,
    storeDelivery: row.storeDelivery,
    storeMessage: row.storeMessage,
  };
}

export function defaultPricing(settings: BusinessSettings): PricingPercentages {
  return {
    marginCash: settings.defaultMarginCash,
    surchargeDebit: settings.defaultSurchargeDebit,
    surchargeFinanced: settings.defaultSurchargeFinanced,
  };
}
