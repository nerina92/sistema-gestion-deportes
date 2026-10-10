-- Un barcode vacío ("") guardado en un producto bloquea, por la restricción UNIQUE,
-- la edición de cualquier otro producto que se guarde sin código de barras.
-- Se normaliza a NULL (NULL no participa en la restricción de unicidad).
UPDATE "products" SET "barcode" = NULL WHERE "barcode" = '';
