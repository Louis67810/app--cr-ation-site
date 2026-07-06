import { renderSection } from "@/components/site-sections";
import { demoHomePage } from "@/lib/demo-site";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#0f1112]">
      {demoHomePage.sections.map((section) => renderSection(section))}
    </main>
  );
}
