import { notFound } from "next/navigation";
import { renderSection } from "@/components/site-sections";
import {
  demoRealisationDetailPage,
  demoRealisationDetailSlug,
} from "@/lib/demo-site";

export function generateStaticParams() {
  return [{ slug: demoRealisationDetailSlug }];
}

export default async function RealisationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug !== demoRealisationDetailSlug) {
    notFound();
  }

  return (
    <main>
      {demoRealisationDetailPage.sections.map((section) => (
        <div key={section.id}>{renderSection(section)}</div>
      ))}
    </main>
  );
}
