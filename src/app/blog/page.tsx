import { renderSection } from "@/components/site-sections";
import { demoBlogPage } from "@/lib/demo-site";

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white text-[#0f1112]">
      {demoBlogPage.sections.map((section) => (
        <div key={section.id}>{renderSection(section)}</div>
      ))}
    </main>
  );
}
