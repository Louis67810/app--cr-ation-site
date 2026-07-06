import { SiteBuilderShell } from "@/components/builder/site-builder-shell";
import { demoHomePage } from "@/lib/demo-site";

export default function BuilderPage() {
  return <SiteBuilderShell initialPage={demoHomePage} />;
}
