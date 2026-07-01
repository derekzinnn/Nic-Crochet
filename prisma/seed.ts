import { PrismaClient } from "@prisma/client";
import { seedProducts } from "../src/data/seed-products";

const prisma = new PrismaClient();

async function main() {
  for (const p of seedProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { colors: p.colors },
      create: {
        name: p.name,
        slug: p.slug,
        category: p.category,
        priceCents: p.priceCents,
        description: p.description,
        details: p.details,
        photos: p.photos,
        status: p.status,
        tag: p.tag,
        featured: p.featured,
        colors: p.colors,
      },
    });
    console.log(`✓ seeded ${p.name}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
