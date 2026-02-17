import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateProductInput, sanitizeProductInput } from '@/lib/validation';
import { ProductInput } from '@/types/products';

const prisma = new PrismaClient();

/**
 * GET /api/products/:id - Obtener un producto con todas sus variantes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID de producto requerido' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Formatear precios para respuesta
    const formattedProduct = {
      ...product,
      variants: product.variants.map(variant => ({
        ...variant,
        costPrice: Number(variant.costPrice),
        priceCash: Number(variant.priceCash),
        priceDebit: Number(variant.priceDebit),
        priceFinanced: Number(variant.priceFinanced)
      }))
    };

    return NextResponse.json(formattedProduct);

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener producto' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/:id - Actualizar producto y variantes
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID de producto requerido' },
        { status: 400 }
      );
    }

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Sanitizar datos de entrada
    const sanitizedData = sanitizeProductInput(body);
    
    // Validar datos de entrada
    const validation = validateProductInput(sanitizedData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Datos de entrada inválidos', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    const productData: ProductInput = sanitizedData;

    // Verificar SKUs únicos (excluyendo las variantes del producto actual)
    const variantsToCheck = productData.variants.filter(v => !v.id); // Solo nuevas variantes
    const existingSKUsFromOtherProducts = await prisma.productVariant.findMany({
      where: {
        sku: {
          in: variantsToCheck.map(v => v.sku)
        },
        productId: {
          not: id
        }
      },
      select: { sku: true }
    });

    if (existingSKUsFromOtherProducts.length > 0) {
      return NextResponse.json(
        { 
          error: 'SKUs duplicados',
          details: [`Los siguientes SKUs ya existen en otros productos: ${existingSKUsFromOtherProducts.map(s => s.sku).join(', ')}`]
        },
        { status: 400 }
      );
    }

    // Verificar SKUs duplicados dentro de las variantes del request
    const skuCounts = new Map<string, number>();
    productData.variants.forEach(variant => {
      const count = skuCounts.get(variant.sku) || 0;
      skuCounts.set(variant.sku, count + 1);
    });

    const duplicateSKUs = Array.from(skuCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([sku, _]) => sku);

    if (duplicateSKUs.length > 0) {
      return NextResponse.json(
        { 
          error: 'SKUs duplicados en las variantes',
          details: [`Los siguientes SKUs están duplicados: ${duplicateSKUs.join(', ')}`]
        },
        { status: 400 }
      );
    }

    // Actualizar en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar datos del producto
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name: productData.name,
          brand: productData.brand,
          category: productData.category,
          description: productData.description,
          barcode: productData.barcode,
          imageUrl: productData.imageUrl,
        }
      });

      // Obtener variantes existentes
      const existingVariants = existingProduct.variants;
      const existingVariantIds = new Set(existingVariants.map(v => v.id));
      
      // Separar variantes para actualizar, crear y eliminar
      const variantsToUpdate = productData.variants.filter(v => v.id && existingVariantIds.has(v.id));
      const variantsToCreate = productData.variants.filter(v => !v.id);
      const incomingVariantIds = new Set(productData.variants.filter(v => v.id).map(v => v.id!));
      const variantsToDelete = existingVariants.filter(v => !incomingVariantIds.has(v.id));

      // Verificar que las variantes a eliminar tengan stock 0
      const variantsWithStock = variantsToDelete.filter(v => v.stockQuantity > 0);
      if (variantsWithStock.length > 0) {
        throw new Error(`No se pueden eliminar variantes con stock. SKUs: ${variantsWithStock.map(v => v.sku).join(', ')}`);
      }

      // Eliminar variantes
      if (variantsToDelete.length > 0) {
        await tx.productVariant.deleteMany({
          where: {
            id: {
              in: variantsToDelete.map(v => v.id)
            }
          }
        });
      }

      // Actualizar variantes existentes
      const updatedVariants = await Promise.all(
        variantsToUpdate.map(variant =>
          tx.productVariant.update({
            where: { id: variant.id },
            data: {
              size: variant.size,
              color: variant.color,
              sku: variant.sku,
              costPrice: variant.costPrice,
              priceCash: variant.priceCash,
              priceDebit: variant.priceDebit,
              priceFinanced: variant.priceFinanced,
              stockQuantity: variant.stockQuantity,
              minStockAlert: variant.minStockAlert,
              tiendanubeProductId: (variant as any).tiendanubeProductId || null,
              tiendanubeVariantId: (variant as any).tiendanubeVariantId || null,
            }
          })
        )
      );

      // Crear nuevas variantes
      const createdVariants = await Promise.all(
        variantsToCreate.map(variant =>
          tx.productVariant.create({
            data: {
              productId: id,
              size: variant.size,
              color: variant.color,
              sku: variant.sku,
              costPrice: variant.costPrice,
              priceCash: variant.priceCash,
              priceDebit: variant.priceDebit,
              priceFinanced: variant.priceFinanced,
              stockQuantity: variant.stockQuantity,
              minStockAlert: variant.minStockAlert,
              tiendanubeProductId: (variant as any).tiendanubeProductId || null,
              tiendanubeVariantId: (variant as any).tiendanubeVariantId || null,
            }
          })
        )
      );

      return {
        ...updatedProduct,
        variants: [...updatedVariants, ...createdVariants]
      };
    });

    // Formatear precios para respuesta
    const formattedResult = {
      ...result,
      variants: result.variants.map(variant => ({
        ...variant,
        costPrice: Number(variant.costPrice),
        priceCash: Number(variant.priceCash),
        priceDebit: Number(variant.priceDebit),
        priceFinanced: Number(variant.priceFinanced)
      }))
    };

    return NextResponse.json({ success: true, ...formattedResult });

  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No se pueden eliminar variantes con stock')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Violación de restricción única (SKU o código de barras duplicado)' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al actualizar producto' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/:id - Eliminar producto
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID de producto requerido' },
        { status: 400 }
      );
    }

    // Verificar que el producto existe y obtener sus variantes
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que todas las variantes tengan stock 0
    const variantsWithStock = product.variants.filter(variant => variant.stockQuantity > 0);
    if (variantsWithStock.length > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar el producto porque tiene stock',
          details: [
            `El producto tiene ${variantsWithStock.length} variante(s) con stock:`,
            ...variantsWithStock.map(v => `- SKU: ${v.sku} (Stock: ${v.stockQuantity})`)
          ]
        },
        { status: 400 }
      );
    }

    // Eliminar producto (las variantes se eliminan en cascada por la configuración de Prisma)
    await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: `Producto "${product.name}" eliminado exitosamente`,
      deletedProduct: {
        id: product.id,
        name: product.name,
        variantsDeleted: product.variants.length
      }
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al eliminar producto' },
      { status: 500 }
    );
  }
}