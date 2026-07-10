import { renderSection } from "@/components/site-sections";
import { demoAboutPage } from "@/lib/demo-site";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-[#0f1112]">
      {demoAboutPage.sections.map((section) => (
        <div key={section.id}>{renderSection(section)}</div>
      ))}
    </main>
  );
}
