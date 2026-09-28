/** Texto de una variante a partir de sus atributos, omitiendo los vacíos. */
export function variantLabel(attr1?: string | null, attr2?: string | null): string {
  const parts = [attr1, attr2].map((v) => (v ?? '').trim()).filter(Boolean);
  return parts.length > 0 ? parts.join(' - ') : 'Único';
}
