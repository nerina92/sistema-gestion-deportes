// Tipos para la API de productos
export interface ProductVariantInput {
  id?: string; // Para updates
  size: string;
  color: string;
  sku: string;
  costPrice: number;
  priceCash?: number;
  priceDebit?: number;
  priceFinanced?: number;
  stockQuantity: number;
  minStockAlert: number;
}

export interface ProductInput {
  name: string;
  brand?: string;
  categoryId: string;
  marginCash?: number;
  surchargeDebit?: number;
  surchargeFinanced?: number;
  description?: string;
  barcode?: string;
  imageUrl?: string;
  variants: ProductVariantInput[];
}

export interface ProductWithVariants {
  id: string;
  name: string;
  brand?: string | null;
  categoryId: string;
  category?: { id: string; name: string } | null;
  marginCash: number;
  surchargeDebit: number;
  surchargeFinanced: number;
  description?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  variants: ProductVariantResponse[];
}

export interface ProductVariantResponse {
  id: string;
  productId: string;
  size: string;
  color: string;
  sku: string;
  costPrice: number;
  priceCash: number;
  priceDebit: number;
  priceFinanced: number;
  stockQuantity: number;
  minStockAlert: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductsListResponse {
  products: ProductWithVariants[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
  filters?: {
    categories: { id: string; name: string }[];
    brands: string[];
  };
}

export interface ProductsQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  brand?: string;
  lowStock?: string;
}