import { renderSection } from "@/components/site-sections";
import { demoServicesHubPage } from "@/lib/demo-site";

export default function ServicesHubPage() {
  return (
    <main className="min-h-screen bg-white text-[#0f1112]">
      {demoServicesHubPage.sections.map((section) => (
        <div key={section.id}>{renderSection(section)}</div>
      ))}
    </main>
  );
}
