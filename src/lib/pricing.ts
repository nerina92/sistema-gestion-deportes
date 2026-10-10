export interface PricingPercentages {
  /** % de margen sobre el costo para el precio contado (default 90) */
  marginCash: number;
  /** % de recargo sobre el contado para débito (default 5) */
  surchargeDebit: number;
  /** % de recargo sobre el contado para financiado/crédito (default 20) */
  surchargeFinanced: number;
}

export const DEFAULT_PRICING: PricingPercentages = {
  marginCash: 90,
  surchargeDebit: 5,
  surchargeFinanced: 20,
};

/** Redondea al múltiplo de 100 más cercano (.5 hacia arriba). */
export function roundToHundred(value: number): number {
  if (!isFinite(value) || value <= 0) return 0;
  return Math.round(value / 100) * 100;
}

export interface ComputedPrices {
  priceCash: number;
  priceDebit: number;
  priceFinanced: number;
}

/**
 * Calcula los 3 precios a partir del costo y los porcentajes.
 * Débito y financiado se calculan sobre el contado SIN redondear,
 * y luego cada precio final se redondea de forma independiente.
 */
export function computeVariantPrices(
  costPrice: number,
  pct: PricingPercentages = DEFAULT_PRICING
): ComputedPrices {
  const cost = Number(costPrice) || 0;
  const rawCash = cost * (1 + (Number(pct.marginCash) || 0) / 100);
  const rawDebit = rawCash * (1 + (Number(pct.surchargeDebit) || 0) / 100);
  const rawFinanced = rawCash * (1 + (Number(pct.surchargeFinanced) || 0) / 100);
  return {
    priceCash: roundToHundred(rawCash),
    priceDebit: roundToHundred(rawDebit),
    priceFinanced: roundToHundred(rawFinanced),
  };
}
