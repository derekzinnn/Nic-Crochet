import ComingSoon from "@/components/ComingSoon";

export const metadata = { title: "Área da Nic", robots: { index: false } };

export default function AreaDaNicPage() {
  return (
    <ComingSoon
      eyebrow="Painel"
      title="Área da Nic"
      note="O login real e o painel para cadastrar, editar e gerenciar as bolsas chegam na etapa de admin."
    />
  );
}
