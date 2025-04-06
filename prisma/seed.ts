import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const DEFAULT_FORMS = {
  CONVENTIONAL: {
    name: "Conventional Cocoa Pod Count",
    description: "Default template for conventional cocoa pod counting",
    type: "CONVENTIONAL",
    fields: [
      {
        name: "farmer_id",
        type: "text",
        label: "Farmer ID",
        required: true
      },
      {
        name: "farmer_name",
        type: "text",
        label: "Farmer Name",
        required: true
      },
      {
        name: "national_id",
        type: "text",
        label: "National ID Number",
        required: true
      },
      {
        name: "phone_number",
        type: "tel",
        label: "Phone Number",
        required: true
      },
      {
        name: "operational_area",
        type: "text",
        label: "Operational Area",
        required: true
      },
      {
        name: "community",
        type: "text",
        label: "Community",
        required: true
      },
      {
        name: "small_cherelles",
        type: "number",
        label: "Small Cherelles (S)",
        required: true,
        min: 0
      },
      {
        name: "medium",
        type: "number",
        label: "Medium (M)",
        required: true,
        min: 0
      },
      {
        name: "large",
        type: "number",
        label: "Large (L)",
        required: true,
        min: 0
      },
      {
        name: "matured_unriped",
        type: "number",
        label: "Matured Unriped (MUR)",
        required: true,
        min: 0
      },
      {
        name: "matured_riped",
        type: "number",
        label: "Matured Riped (MR)",
        required: true,
        min: 0
      },
      {
        name: "diseased",
        type: "number",
        label: "Diseased (D)",
        required: true,
        min: 0
      },
      {
        name: "count_date",
        type: "date",
        label: "Count Date",
        required: true
      }
    ]
  },
  ORGANIC: {
    name: "Organic Cocoa Pod Count",
    description: "Default template for organic cocoa pod counting",
    type: "ORGANIC",
    fields: [
      {
        name: "farmer_id",
        type: "text",
        label: "Farmer ID",
        required: true
      },
      {
        name: "farmer_name",
        type: "text",
        label: "Farmer Name",
        required: true
      },
      {
        name: "national_id",
        type: "text",
        label: "National ID Number",
        required: true
      },
      {
        name: "phone_number",
        type: "tel",
        label: "Phone Number",
        required: true
      },
      {
        name: "operational_area",
        type: "text",
        label: "Operational Area",
        required: true
      },
      {
        name: "community",
        type: "text",
        label: "Community",
        required: true
      },
      {
        name: "organic_certification_id",
        type: "text",
        label: "Organic Certification ID",
        required: true
      },
      {
        name: "small_cherelles",
        type: "number",
        label: "Small Cherelles (S)",
        required: true,
        min: 0
      },
      {
        name: "medium",
        type: "number",
        label: "Medium (M)",
        required: true,
        min: 0
      },
      {
        name: "large",
        type: "number",
        label: "Large (L)",
        required: true,
        min: 0
      },
      {
        name: "matured_unriped",
        type: "number",
        label: "Matured Unriped (MUR)",
        required: true,
        min: 0
      },
      {
        name: "matured_riped",
        type: "number",
        label: "Matured Riped (MR)",
        required: true,
        min: 0
      },
      {
        name: "diseased",
        type: "number",
        label: "Diseased (D)",
        required: true,
        min: 0
      },
      {
        name: "count_date",
        type: "date",
        label: "Count Date",
        required: true
      }
    ]
  }
};

async function main() {
  // Create factory locations
  const achiaseFactory = await prisma.factory.upsert({
    where: { id: "achiase-factory" },
    update: {},
    create: {
      id: "achiase-factory",
      name: "Achiase",
      location: "Eastern Region, Ghana",
    },
  });

  const akrofuomFactory = await prisma.factory.upsert({
    where: { id: "akrofuom-factory" },
    update: {},
    create: {
      id: "akrofuom-factory",
      name: "Akrofuom",
      location: "Ashanti Region, Ghana",
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@koa.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@koa.com",
      password: adminPassword,
      role: "ADMIN",
      fieldType: "OTHER",
      factoryId: achiaseFactory.id
    },
  });

  // Create a supervisor for each factory
  const supervisorPassword = await bcrypt.hash("supervisor123", 10);
  
  const achiaseSupervisor = await prisma.user.upsert({
    where: { email: "supervisor.achiase@koa.com" },
    update: {},
    create: {
      name: "Achiase Supervisor",
      email: "supervisor.achiase@koa.com",
      password: supervisorPassword,
      role: "SUPERVISOR",
      factoryId: achiaseFactory.id,
      fieldType: "COCOA_FIELD",
    },
  });

  const akrofuomSupervisor = await prisma.user.upsert({
    where: { email: "supervisor.akrofuom@koa.com" },
    update: {},
    create: {
      name: "Akrofuom Supervisor",
      email: "supervisor.akrofuom@koa.com",
      password: supervisorPassword,
      role: "SUPERVISOR",
      factoryId: akrofuomFactory.id,
      fieldType: "MIXED_CULTIVATION",
    },
  });

  // Create field officers
  const officerPassword = await bcrypt.hash("officer123", 10);
  
  const achiaseOfficer = await prisma.user.upsert({
    where: { email: "officer.achiase@koa.com" },
    update: {},
    create: {
      name: "Achiase Field Officer",
      email: "officer.achiase@koa.com",
      password: officerPassword,
      role: "FIELD_OFFICER",
      factoryId: achiaseFactory.id,
      fieldType: "COFFEE_FIELD",
    },
  });

  const akrofuomOfficer = await prisma.user.upsert({
    where: { email: "officer.akrofuom@koa.com" },
    update: {},
    create: {
      name: "Akrofuom Field Officer",
      email: "officer.akrofuom@koa.com",
      password: officerPassword,
      role: "FIELD_OFFICER",
      factoryId: akrofuomFactory.id,
      fieldType: "COCOA_FIELD",
    },
  });

  // Create guest users
  const guestPassword = await bcrypt.hash("guest123", 10);
  
  const achiaseGuest = await prisma.user.upsert({
    where: { email: "guest.achiase@koa.com" },
    update: {},
    create: {
      name: "Achiase Guest",
      email: "guest.achiase@koa.com",
      password: guestPassword,
      role: "GUEST",
      factoryId: achiaseFactory.id,
      fieldType: "OTHER",
    },
  });

  const akrofuomGuest = await prisma.user.upsert({
    where: { email: "guest.akrofuom@koa.com" },
    update: {},
    create: {
      name: "Akrofuom Guest",
      email: "guest.akrofuom@koa.com",
      password: guestPassword,
      role: "GUEST",
      factoryId: akrofuomFactory.id,
      fieldType: "OTHER",
    },
  });

  // Create default forms for each factory type
  if (admin) {
    // Create conventional form
    const conventionalForm = await prisma.form.upsert({
      where: {
        id: 'conventional-template'
      },
      update: {
        fields: JSON.stringify(DEFAULT_FORMS.CONVENTIONAL.fields)
      },
      create: {
        id: 'conventional-template',
        ...DEFAULT_FORMS.CONVENTIONAL,
        fields: JSON.stringify(DEFAULT_FORMS.CONVENTIONAL.fields),
        factoryId: akrofuomFactory.id,
        createdById: admin.id
      }
    });

    // Create organic form
    const organicForm = await prisma.form.upsert({
      where: {
        id: 'organic-template'
      },
      update: {
        fields: JSON.stringify(DEFAULT_FORMS.ORGANIC.fields)
      },
      create: {
        id: 'organic-template',
        ...DEFAULT_FORMS.ORGANIC,
        fields: JSON.stringify(DEFAULT_FORMS.ORGANIC.fields),
        factoryId: achiaseFactory.id,
        createdById: admin.id
      }
    });

    // Create form access for admin
    for (const form of [conventionalForm, organicForm]) {
      await prisma.formAccess.upsert({
        where: {
          userId_formId: {
            userId: admin.id,
            formId: form.id
          }
        },
        update: {
          canView: true,
          canEdit: true
        },
        create: {
          userId: admin.id,
          formId: form.id,
          canView: true,
          canEdit: true
        }
      });
    }

    // Supervisors have access to their factory's forms
    await prisma.formAccess.upsert({
      where: {
        userId_formId: {
          userId: achiaseSupervisor.id,
          formId: 'organic-template'
        }
      },
      update: {
        canView: true,
        canEdit: true,
        canDelete: false
      },
      create: {
        userId: achiaseSupervisor.id,
        formId: 'organic-template',
        canView: true,
        canEdit: true,
        canDelete: false
      }
    });

    await prisma.formAccess.upsert({
      where: {
        userId_formId: {
          userId: akrofuomSupervisor.id,
          formId: 'conventional-template'
        }
      },
      update: {
        canView: true,
        canEdit: true,
        canDelete: false
      },
      create: {
        userId: akrofuomSupervisor.id,
        formId: 'conventional-template',
        canView: true,
        canEdit: true,
        canDelete: false
      }
    });

    // Field officers have view and edit access
    await prisma.formAccess.upsert({
      where: {
        userId_formId: {
          userId: achiaseOfficer.id,
          formId: 'organic-template'
        }
      },
      update: {
        canView: true,
        canEdit: true,
        canDelete: false
      },
      create: {
        userId: achiaseOfficer.id,
        formId: 'organic-template',
        canView: true,
        canEdit: true,
        canDelete: false
      }
    });

    await prisma.formAccess.upsert({
      where: {
        userId_formId: {
          userId: akrofuomOfficer.id,
          formId: 'conventional-template'
        }
      },
      update: {
        canView: true,
        canEdit: true,
        canDelete: false
      },
      create: {
        userId: akrofuomOfficer.id,
        formId: 'conventional-template',
        canView: true,
        canEdit: true,
        canDelete: false
      }
    });

    // Guests have view-only access
    await prisma.formAccess.upsert({
      where: {
        userId_formId: {
          userId: achiaseGuest.id,
          formId: 'organic-template'
        }
      },
      update: {
        canView: true,
        canEdit: false,
        canDelete: false
      },
      create: {
        userId: achiaseGuest.id,
        formId: 'organic-template',
        canView: true,
        canEdit: false,
        canDelete: false
      }
    });

    await prisma.formAccess.upsert({
      where: {
        userId_formId: {
          userId: akrofuomGuest.id,
          formId: 'conventional-template'
        }
      },
      update: {
        canView: true,
        canEdit: false,
        canDelete: false
      },
      create: {
        userId: akrofuomGuest.id,
        formId: 'conventional-template',
        canView: true,
        canEdit: false,
        canDelete: false
      }
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 