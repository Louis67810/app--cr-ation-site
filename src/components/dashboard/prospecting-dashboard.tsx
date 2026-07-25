import {
  ChevronDown,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Search,
} from "lucide-react";

type ProspectStatus = "Nouveau" | "À contacter" | "Qualifié";

type Prospect = {
  company: string;
  activity: string;
  city: string;
  website: string;
  contact: string;
  phone: string;
  email: string;
  technology: string;
  performance: number;
  ssl: boolean;
  seo: number;
  opportunity: number;
  status: ProspectStatus;
};

const demoProspects: Prospect[] = [
  {
    company: "Jardins de la Vallée",
    activity: "Paysagiste · Création de jardins",
    city: "Périgueux",
    website: "jardins-vallee.example",
    contact: "Marc Delage",
    phone: "06 12 34 56 78",
    email: "contact@jardins-vallee.example",
    technology: "WordPress",
    performance: 42,
    ssl: true,
    seo: 51,
    opportunity: 78,
    status: "Nouveau",
  },
  {
    company: "Atelier Végétal",
    activity: "Paysagiste · Aménagement extérieur",
    city: "Bergerac",
    website: "atelier-vegetal.example",
    contact: "Élodie Martin",
    phone: "06 23 45 67 89",
    email: "bonjour@atelier-vegetal.example",
    technology: "Wix",
    performance: 58,
    ssl: true,
    seo: 44,
    opportunity: 71,
    status: "À contacter",
  },
  {
    company: "Paysages du Périgord",
    activity: "Paysagiste · Entretien",
    city: "Sarlat",
    website: "paysages-perigord.example",
    contact: "Thomas Roux",
    phone: "05 53 00 12 34",
    email: "contact@paysages-perigord.example",
    technology: "Joomla",
    performance: 64,
    ssl: true,
    seo: 57,
    opportunity: 63,
    status: "Nouveau",
  },
  {
    company: "Création Nature",
    activity: "Jardinier paysagiste",
    city: "Coulounieix",
    website: "creation-nature.example",
    contact: "Sophie Bernard",
    phone: "06 34 56 78 90",
    email: "sophie@creation-nature.example",
    technology: "Site maison",
    performance: 73,
    ssl: false,
    seo: 61,
    opportunity: 59,
    status: "Qualifié",
  },
  {
    company: "Horizon Jardin",
    activity: "Paysagiste · Terrasse et piscine",
    city: "Trélissac",
    website: "horizon-jardin.example",
    contact: "Julien Fabre",
    phone: "06 45 67 89 01",
    email: "contact@horizon-jardin.example",
    technology: "WordPress",
    performance: 81,
    ssl: true,
    seo: 72,
    opportunity: 48,
    status: "Nouveau",
  },
  {
    company: "Ligne Verte",
    activity: "Paysagiste concepteur",
    city: "Ribérac",
    website: "ligne-verte.example",
    contact: "Camille Moreau",
    phone: "05 53 11 22 33",
    email: "contact@ligne-verte.example",
    technology: "Squarespace",
    performance: 69,
    ssl: true,
    seo: 66,
    opportunity: 46,
    status: "À contacter",
  },
  {
    company: "Les Jardins Vivants",
    activity: "Paysagiste · Éco-conception",
    city: "Nontron",
    website: "jardins-vivants.example",
    contact: "Nicolas Perrin",
    phone: "06 56 78 90 12",
    email: "nicolas@jardins-vivants.example",
    technology: "Webflow",
    performance: 88,
    ssl: true,
    seo: 79,
    opportunity: 35,
    status: "Nouveau",
  },
];

function metricColor(value: number) {
  if (value >= 75) return "text-[#00a86b]";
  if (value >= 55) return "text-[#e17600]";
  return "text-[#d52626]";
}

function opportunityStyle(value: number) {
  if (value >= 70) {
    return "border-[#9e252f]/35 bg-[#9e252f]/8 text-[#9e252f]";
  }
  if (value >= 50) {
    return "border-[#d17800]/35 bg-[#d17800]/8 text-[#a85f00]";
  }
  return "border-[#003441]/20 bg-[#003441]/5 text-[#003441]";
}

function statusStyle(status: ProspectStatus) {
  if (status === "Qualifié") return "bg-[#dff7eb] text-[#187a4c]";
  if (status === "À contacter") return "bg-[#e9eefc] text-[#3857a5]";
  return "bg-[#ffbd35] text-[#3b2900]";
}

export function ProspectingDashboard() {
  return (
    <div className="pb-16">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h1 className="font-serif text-[28px] leading-none tracking-[-0.04em] sm:text-[32px]">
            Prospection
          </h1>
          <span className="hidden h-[18px] w-px bg-black/10 sm:block" />
          <p className="font-serif text-[14px] leading-5 text-black/50 sm:text-[16px]">
            Identifiez et priorisez les paysagistes à contacter.
          </p>
        </div>
        <button
          type="button"
          disabled
          title="La recherche automatique sera connectée à la prochaine étape."
          className="flex h-9 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-[#323232] to-[#222] px-5 text-[13px] font-semibold text-white opacity-55 shadow-[0_2px_4px_-1px_rgba(13,13,13,.5),0_0_0_1px_#333,inset_0_.5px_1px_rgba(255,255,255,.15)] sm:w-auto"
        >
          <Search size={15} />
          Trouver de nouveaux prospects
        </button>
      </header>

      <div className="mt-10 overflow-hidden rounded-[20px] border border-[#003441]/20 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1380px] border-collapse text-left">
            <colgroup>
              <col className="w-[42px]" />
              <col className="w-[220px]" />
              <col className="w-[140px]" />
              <col className="w-[142px]" />
              <col className="w-[190px]" />
              <col className="w-[112px]" />
              <col className="w-[72px]" />
              <col className="w-[64px]" />
              <col className="w-[64px]" />
              <col className="w-[104px]" />
              <col className="w-[118px]" />
            </colgroup>
            <thead className="bg-[#003441] font-serif text-[12px] text-white">
              <tr className="h-14">
                {[
                  "#",
                  "Entreprise",
                  "Contact",
                  "Téléphone",
                  "E-mail",
                  "Technologie",
                  "Perf.",
                  "SSL",
                  "SEO",
                  "Opportunité",
                  "Statut",
                ].map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className="border-r border-white/[0.07] px-4 font-normal last:border-r-0"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-[var(--font-inter)] text-[12px]">
              {demoProspects.map((prospect, index) => (
                <tr
                  key={prospect.company}
                  className="h-[67px] border-b border-[#003441]/8 odd:bg-[#003441]/[0.025] last:border-b-0 hover:bg-[#003441]/[0.055]"
                >
                  <td className="px-4 text-center text-[#003441]/45">
                    {index + 1}
                  </td>
                  <td className="px-4">
                    <div className="flex min-w-0 items-start gap-2">
                      <ExternalLink
                        size={12}
                        className="mt-0.5 shrink-0 text-[#003441]/45"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#1c1c1c]">
                          {prospect.company}
                        </p>
                        <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-black/45">
                          <MapPin size={9} className="shrink-0" />
                          {prospect.activity} · {prospect.city}
                        </p>
                        <p className="mt-0.5 truncate text-[9px] text-[#003441]/55">
                          {prospect.website}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 font-medium text-black/70">
                    {prospect.contact}
                  </td>
                  <td className="px-4">
                    <span className="flex items-center gap-1.5 font-medium text-[#00a86b]">
                      <Phone size={12} />
                      {prospect.phone}
                    </span>
                  </td>
                  <td className="px-4 text-black/60">
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail size={12} className="shrink-0 text-black/35" />
                      {prospect.email}
                    </span>
                  </td>
                  <td className="px-4 text-black/55">
                    {prospect.technology}
                  </td>
                  <td
                    className={`px-4 text-center font-semibold ${metricColor(prospect.performance)}`}
                  >
                    {prospect.performance}
                  </td>
                  <td className="px-4 text-center text-black/60">
                    {prospect.ssl ? "oui" : "non"}
                  </td>
                  <td
                    className={`px-4 text-center font-semibold ${metricColor(prospect.seo)}`}
                  >
                    {prospect.seo}
                  </td>
                  <td className="px-4 text-center">
                    <span
                      className={`inline-flex min-w-9 items-center justify-center rounded-[8px] border px-2 py-1.5 text-[12px] font-semibold ${opportunityStyle(prospect.opportunity)}`}
                    >
                      {prospect.opportunity}
                    </span>
                  </td>
                  <td className="px-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-[9px] px-3 py-2 text-[11px] font-semibold ${statusStyle(prospect.status)}`}
                    >
                      {prospect.status}
                      <ChevronDown size={12} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-5 text-black/40">
        Données de démonstration. La recherche Google, l’analyse des sites et
        les actions d’appel seront connectées dans l’étape suivante.
      </p>
    </div>
  );
}
