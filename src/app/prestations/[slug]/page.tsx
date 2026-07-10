import { notFound } from "next/navigation";
import { renderSection } from "@/components/site-sections";
import { demoServiceDetailPages } from "@/lib/demo-site";

export function generateStaticParams() {
  return demoServiceDetailPages.map((page) => ({
    slug: page.slug.split("/").filter(Boolean).at(-1) ?? "",
  }));
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = demoServiceDetailPages.find(
    (item) => item.slug.split("/").filter(Boolean).at(-1) === slug,
  );

  if (!page) notFound();

  return (
    <main className="min-h-screen bg-white text-[#0f1112]">
      {page.sections.map((section) => (
        <div key={section.id}>{renderSection(section)}</div>
      ))}
    </main>
  );
}
