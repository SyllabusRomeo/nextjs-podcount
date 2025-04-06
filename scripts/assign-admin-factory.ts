import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Find admin user
    const admin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (!admin) {
      console.error('No admin user found');
      return;
    }

    // Find or create a factory
    let factory = await prisma.factory.findFirst();
    
    if (!factory) {
      factory = await prisma.factory.create({
        data: {
          name: 'Main Factory',
          type: 'CONVENTIONAL',
          location: 'Main Location'
        }
      });
      console.log('Created new factory:', factory);
    }

    // Assign admin to factory
    const updatedAdmin = await prisma.user.update({
      where: {
        id: admin.id
      },
      data: {
        factoryId: factory.id
      }
    });

    console.log('Successfully assigned admin to factory:', {
      adminId: updatedAdmin.id,
      adminEmail: updatedAdmin.email,
      factoryId: factory.id,
      factoryName: factory.name
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 