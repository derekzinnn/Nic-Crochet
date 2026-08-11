// One-off: translate product.colors from the old placeholder ids to the new
// official palette codes, so existing bags keep their colors and show the right
// chips as selected in the wizard. Run: `node scripts/migrate-yarn-colors.mjs`
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

nextEnv.loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

const LEGACY = {
  cru: "010",
  bege: "028",
  caramelo: "018",
  terracota: "020",
  mostarda: "024",
  ferrugem: "019",
  "verde-salvia": "029",
  "verde-oliva": "029",
  "rosa-antigo": "007",
  vinho: "086",
  "azul-petroleo": "001",
  cinza: "039",
  "off-white": "006",
  preto: "040",
};
const CODES = new Set([
  "001","002","004","005","006","007","009","010","011","012","013","015","016",
  "018","019","020","021","023","024","025","028","029","030","039","040","042",
  "043","044","045","048","061","062","064","065","066","067","068","069","070",
  "082","083","084","085","086","088","089","090",
]);

const products = await prisma.product.findMany({ select: { id: true, name: true, colors: true } });
let changed = 0;
for (const p of products) {
  const next = [];
  for (const c of p.colors) {
    const mapped = CODES.has(c) ? c : LEGACY[c];
    if (mapped && !next.includes(mapped)) next.push(mapped);
  }
  const same = next.length === p.colors.length && next.every((c, i) => c === p.colors[i]);
  if (!same) {
    await prisma.product.update({ where: { id: p.id }, data: { colors: next } });
    changed++;
    console.log(`  ✓ ${p.name}: [${p.colors.join(", ")}] → [${next.join(", ")}]`);
  }
}
console.log(`\nPronto. ${changed} peça(s) atualizada(s), ${products.length - changed} já ok.`);
await prisma.$disconnect();
