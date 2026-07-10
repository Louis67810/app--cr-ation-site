import { renderSection } from "@/components/site-sections";
import { demoRealisationsPage } from "@/lib/demo-site";

export default function RealisationsPage() {
  return (
    <main>
      {demoRealisationsPage.sections.map((section) => (
        <div key={section.id}>{renderSection(section)}</div>
      ))}
    </main>
  );
}
