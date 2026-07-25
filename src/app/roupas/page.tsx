import type { Metadata } from "next";
import { getAllProducts } from "@/lib/products";
import { parseShopParams, filterSortProducts, shopCategoriesForKind } from "@/lib/shop";
import CollectionView from "@/components/shop/CollectionView";

export const metadata: Metadata = {
  title: "Roupas",
  description:
    "As roupas de crochê feitas à mão pela Nic. Busque pelo nome, filtre por tipo ou ordene por preço.",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function RoupasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const categories = shopCategoriesForKind("CLOTHING");
  const params = parseShopParams(await searchParams, categories);
  const all = (await getAllProducts()).filter((p) => p.kind === "CLOTHING");
  const shown = filterSortProducts(all, params);

  return (
    <CollectionView
      eyebrow="Feito à mão"
      title="Roupas de crochê"
      subtitle="Peças únicas para vestir. Busque pelo nome, filtre por tipo ou ordene por preço."
      basePath="/roupas"
      categories={categories}
      categoryLabel="Tipo de roupa"
      searchPlaceholder="Buscar por nome — ex: top, cropped..."
      params={params}
      shown={shown}
    />
  );
}
