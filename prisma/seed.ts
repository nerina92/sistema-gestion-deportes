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