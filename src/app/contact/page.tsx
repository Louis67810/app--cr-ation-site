import { renderSection } from "@/components/site-sections";
import { demoContactPage } from "@/lib/demo-site";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-[#0f1112]">
      {demoContactPage.sections.map((section) => (
        <div key={section.id}>{renderSection(section)}</div>
      ))}
    </main>
  );
}
