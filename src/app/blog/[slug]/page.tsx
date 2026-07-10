import { notFound } from "next/navigation";
import { renderSection } from "@/components/site-sections";
import { demoArticlePage, demoBlogPosts } from "@/lib/demo-site";

export function generateStaticParams() {
  return demoBlogPosts.map((post) => ({
    slug: post.href.split("/").filter(Boolean).at(-1) ?? "",
  }));
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = demoBlogPosts.find(
    (item) => item.href.split("/").filter(Boolean).at(-1) === slug,
  );

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-[#0f1112]">
      {demoArticlePage.sections.map((section) => (
        <div key={section.id}>{renderSection(section)}</div>
      ))}
    </main>
  );
}
