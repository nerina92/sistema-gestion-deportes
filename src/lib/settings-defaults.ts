/** Configuración del negocio en formato serializable (números en vez de Decimal). */
export interface BusinessSettings {
  businessName: string;
  businessType: string;
  address: string;
  city: string;
  taxCondition: string;
  variantAttr1Label: string;
  variantAttr2Label: string;
  useVariants: boolean;
  defaultMarginCash: number;
  defaultSurchargeDebit: number;
  defaultSurchargeFinanced: number;
  priceRounding: number;
  defaultMinStockAlert: number;
  // Tienda online
  storeEnabled: boolean;
  storeWhatsapp: string;
  storePriceType: string;
  storeShowOutOfStock: boolean;
  storePickup: boolean;
  storeDelivery: boolean;
  storeMessage: string;
}

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: '',
  businessType: 'general',
  address: '',
  city: '',
  taxCondition: 'Monotributista',
  variantAttr1Label: 'Talle',
  variantAttr2Label: 'Color',
  useVariants: true,
  defaultMarginCash: 90,
  defaultSurchargeDebit: 5,
  defaultSurchargeFinanced: 20,
  priceRounding: 100,
  defaultMinStockAlert: 1,
  storeEnabled: false,
  storeWhatsapp: '',
  storePriceType: 'cash',
  storeShowOutOfStock: false,
  storePickup: true,
  storeDelivery: true,
  storeMessage: '',
};

/** Rubros sugeridos, con etiquetas de variantes pensadas para cada uno. */
export const BUSINESS_TYPE_PRESETS: Record<string, { label: string; attr1: string; attr2: string; useVariants: boolean }> = {
  general: { label: 'Comercio general', attr1: 'Variante', attr2: 'Presentación', useVariants: true },
  indumentaria: { label: 'Indumentaria y calzado', attr1: 'Talle', attr2: 'Color', useVariants: true },
  ferreteria: { label: 'Ferretería / corralón', attr1: 'Medida', attr2: 'Material', useVariants: true },
  almacen: { label: 'Almacén / kiosco / dietética', attr1: 'Tamaño', attr2: 'Sabor', useVariants: true },
  libreria: { label: 'Librería / juguetería', attr1: 'Modelo', attr2: 'Color', useVariants: true },
  electronica: { label: 'Electrónica / celulares', attr1: 'Modelo', attr2: 'Capacidad', useVariants: true },
  cosmetica: { label: 'Perfumería / cosmética', attr1: 'Tamaño', attr2: 'Fragancia/Tono', useVariants: true },
};

