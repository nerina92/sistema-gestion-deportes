import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding de la base de datos...');

  try {
    // Crear usuario administrador por defecto
    const adminEmail = 'admin@deporteslaboulaye.com';
    const adminPassword = 'Admin123!';
    
    // Verificar si el usuario admin ya existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('✅ Usuario admin ya existe, saltando creación...');
    } else {
      // Hashear la contraseña
      console.log('🔐 Hasheando contraseña del administrador...');
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      // Crear usuario admin
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash: hashedPassword,
          name: 'Administrador',
          role: 'admin',
        },
      });

      console.log('✅ Usuario administrador creado exitosamente:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Nombre: ${admin.name}`);
      console.log(`   Rol: ${admin.role}`);
    }

    // Verificar conteo de usuarios
    const userCount = await prisma.user.count();
    console.log(`📊 Total de usuarios en la base de datos: ${userCount}`);

    // Crear proveedores de ejemplo
    console.log('🏢 Creando proveedores de ejemplo...');
    
    const suppliersData = [
      {
        name: 'Nike Argentina',
        email: 'contacto@nike.com.ar',
        phone: '+54 11 4444-5555',
        address: 'Av. Corrientes 1000, CABA, Argentina',
        notes: 'Proveedor oficial de productos Nike para Argentina'
      },
      {
        name: 'Adidas Proveedor',
        email: 'ventas@adidas.com.ar',
        phone: '+54 11 6666-7777',
        address: 'Av. Santa Fe 2000, CABA, Argentina',
        notes: 'Distribuidor autorizado de productos Adidas'
      },
      {
        name: 'Distribuidor Local',
        email: 'info@distribuidorlocal.com',
        phone: '+54 358 123-4567',
        address: 'Calle Principal 123, Laboulaye, Córdoba',
        notes: 'Distribuidor local con productos de varias marcas'
      }
    ];

    for (const supplierData of suppliersData) {
      // Verificar si el proveedor ya existe
      const existingSupplier = await prisma.supplier.findFirst({
        where: { name: supplierData.name }
      });

      if (existingSupplier) {
        console.log(`⏭️ Proveedor "${supplierData.name}" ya existe, saltando...`);
      } else {
        const supplier = await prisma.supplier.create({
          data: supplierData
        });
        console.log(`✅ Proveedor creado: ${supplier.name}`);
      }
    }

    const supplierCount = await prisma.supplier.count();
    console.log(`📊 Total de proveedores en la base de datos: ${supplierCount}`);

    // Crear categorías por defecto
    console.log('🏷️  Creando categorías por defecto...');
    const categoryNames = [
      'Remeras', 'Pantalones', 'Shorts', 'Buzos', 'Camperas',
      'Zapatillas', 'Medias', 'Accesorios', 'Equipamiento', 'Paletas', 'Otros',
    ];
    for (const name of categoryNames) {
      await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
    const categoryCount = await prisma.category.count();
    console.log(`📊 Total de categorías: ${categoryCount}`);

    console.log('🎉 Seeding completado exitosamente!');
    
    if (!existingAdmin) {
      console.log('\n📋 Credenciales de acceso:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Contraseña: ${adminPassword}`);
      console.log('\n⚠️  Por favor, cambia estas credenciales después del primer login en producción.');
    }

  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Error fatal en el seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });