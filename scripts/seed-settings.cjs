const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.appSetting.upsert({
      where: { key: "meta_pixel_enabled" },
      create: { key: "meta_pixel_enabled", value: "false" },
      update: {},
    });

    await prisma.appSetting.upsert({
      where: { key: "meta_pixel_id" },
      create: { key: "meta_pixel_id", value: null },
      update: {},
    });

    console.log("settings ok");
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

