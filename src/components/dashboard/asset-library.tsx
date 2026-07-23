"use client";

import { ImagePlus, LoaderCircle, Mail, MapPin, Palette, Save, Search, Sparkles, Type, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardAsset, DashboardProject } from "@/components/dashboard/dashboard-shell";
import { prepareImageForUpload } from "@/lib/client-images";
import { applySiteBrand, DEFAULT_SITE_BRAND, getSiteBrand, normalizeSiteBrand } from "@/lib/site-brand";
import type { SiteBrandSettings } from "@/lib/site-template";

function hexToHsl(hex: string) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let h = 0; const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  if (delta) { if (max === r) h = ((g - b) / delta) % 6; else if (max === g) h = (b - r) / delta + 2; else h = (r - g) / delta + 4; h *= 60; if (h < 0) h += 360; }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s; const x = c * (1 - Math.abs((h / 60) % 2 - 1)); const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return `#${[r, g, b].map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function synchronizedAccent(primary: string, previousAccent: string) {
  try {
    const primaryHsl = hexToHsl(primary); const defaultPrimary = hexToHsl(DEFAULT_SITE_BRAND.primaryColor); const accent = hexToHsl(previousAccent);
    return hslToHex((primaryHsl.h + accent.h - defaultPrimary.h + 360) % 360, accent.s, accent.l);
  } catch { return previousAccent; }
}

export function AssetLibrary({ project, initialAssets }: { project: DashboardProject; initialAssets: DashboardAsset[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const darkLogoInputRef = useRef<HTMLInputElement>(null);
  const lightLogoInputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState(initialAssets);
  const [selected, setSelected] = useState<DashboardAsset | null>(null);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [message, setMessage] = useState("");
  const [brand, setBrand] = useState<SiteBrandSettings>(() => getSiteBrand(project.pages));
  const [savingBrand, setSavingBrand] = useState(false);
  const filteredAssets = useMemo(() => assets.filter((asset) => `${asset.title} ${asset.alt_text}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr"))), [assets, query]);

  useEffect(() => {
    if (!selected) return;
    function close(event: KeyboardEvent) { if (event.key === "Escape") setSelected(null); }
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [selected]);

  async function uploadFiles(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (!images.length) return [] as DashboardAsset[];
    setUploading(true);
    setProgress({ current: 0, total: images.length });
    setMessage("");
    const added: DashboardAsset[] = [];
    const warnings: string[] = [];

    for (let index = 0; index < images.length; index += 1) {
      setProgress({ current: index + 1, total: images.length });
      try {
        const prepared = await prepareImageForUpload(images[index]);
        const body = new FormData();
        body.append("file", prepared);
        body.append("projectKey", project.key);
        body.append("projectOwnerId", project.ownerId);
        const response = await fetch("/api/assets", { method: "POST", body });
        const result = await response.json() as { asset?: DashboardAsset; warning?: string | null; error?: string };
        if (!response.ok || !result.asset) throw new Error(result.error ?? "Import impossible");
        added.push(result.asset);
        if (result.warning) warnings.push(result.warning);
      } catch (error) {
        warnings.push(error instanceof Error ? error.message : "Une image n’a pas pu être importée.");
      }
    }

    setAssets((current) => [...added.reverse(), ...current]);
    setUploading(false);
    setMessage(warnings.length ? `${added.length} image(s) ajoutée(s). ${warnings[0]}` : `${added.length} image(s) ajoutée(s) et décrite(s) par IA.`);
    if (inputRef.current) inputRef.current.value = "";
    return added;
  }

  async function uploadLogo(files: FileList | null, mode: "dark" | "light") {
    const added = await uploadFiles(Array.from(files ?? []));
    const url = added.at(-1)?.public_url;
    if (url) updateBrand(mode === "dark" ? { logoOnDarkUrl: url } : { logoOnLightUrl: url });
  }

  function updateBrand(patch: Partial<SiteBrandSettings>) { setBrand((current) => normalizeSiteBrand({ ...current, ...patch })); }
  async function saveBrand() {
    setSavingBrand(true); setMessage("");
    try {
      const response = await fetch("/api/projects/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectKey: project.key, projectOwnerId: project.ownerId, projectName: project.name, pages: applySiteBrand(project.pages, brand) }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Enregistrement impossible");
      setMessage("Identité du site enregistrée. Toutes les pages utilisent maintenant ces réglages."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Enregistrement impossible"); }
    finally { setSavingBrand(false); }
  }

  return (
    <div className="pb-8 font-[var(--font-inter)] sm:pb-16">
      <header><div className="flex items-center gap-2"><h1 className="font-serif text-[27px] tracking-[-0.05em] sm:text-[30px]">Assets</h1><span className="rounded-full bg-[#eef9ff] px-2 py-1 text-[9px] font-semibold text-[#008fc5]">IA</span></div><p className="mt-2 text-[13px] font-medium leading-5 text-black/55 sm:text-[14px]">Gérez l’identité de {project.name}, puis centralisez ses photos et leurs textes alternatifs.</p></header>

      <section className="mt-7 border-y border-black/[0.11] py-7 sm:mt-9 sm:py-9">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="font-serif text-[23px] tracking-[-.045em]">Identité du site</h2><p className="mt-1 text-[12px] leading-5 text-black/48">Ces réglages s’appliquent à chaque page et à chaque CTA.</p></div><button type="button" onClick={saveBrand} disabled={savingBrand} className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] bg-[linear-gradient(180deg,#323232,#222)] px-4 text-[12px] font-semibold text-white disabled:opacity-60"><Save size={14}/>{savingBrand ? "Enregistrement…" : "Enregistrer"}</button></div>
        <div className="mt-7 grid gap-0 divide-y divide-black/[.11] border-y border-black/[.11] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <div className="space-y-5 p-5 sm:p-6"><div className="flex items-center gap-2"><Palette size={17}/><h3 className="font-serif text-[20px]">Couleurs</h3></div><div className="flex flex-wrap gap-5"><label className="flex items-center gap-3 text-[12px] font-medium">Fond principal<span className="relative size-12 overflow-hidden rounded-full border-2 border-white shadow"><span className="absolute inset-0" style={{ backgroundColor: brand.primaryColor }}/><input aria-label="Couleur principale" type="color" value={brand.primaryColor} onChange={(event) => setBrand((current) => ({ ...current, primaryColor: event.target.value.toUpperCase(), accentColor: synchronizedAccent(event.target.value, current.accentColor) }))} className="absolute inset-0 h-full w-full cursor-pointer opacity-0"/></span><span className="text-black/45">{brand.primaryColor}</span></label><label className="flex items-center gap-3 text-[12px] font-medium">Accent<span className="relative size-12 overflow-hidden rounded-full border-2 border-white shadow"><span className="absolute inset-0" style={{ backgroundColor: brand.accentColor }}/><input aria-label="Couleur accent" type="color" value={brand.accentColor} onChange={(event) => updateBrand({ accentColor: event.target.value.toUpperCase() })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0"/></span><span className="text-black/45">{brand.accentColor}</span></label></div></div>
          <div className="space-y-5 p-5 sm:p-6"><div className="flex items-center gap-2"><Type size={17}/><h3 className="font-serif text-[20px]">Styles</h3></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-[11px] font-semibold text-black/55">Pack de CTA<select value={brand.ctaVariant} onChange={(event) => updateBrand({ ctaVariant: event.target.value as SiteBrandSettings["ctaVariant"] })} className="mt-2 h-10 w-full rounded-[8px] border border-black/10 bg-white px-3 text-[12px] font-medium text-black"><option value="pill">Arrondi classique</option><option value="rounded">Arrondi plus carré</option></select></label><label className="text-[11px] font-semibold text-black/55">Typographie des titres<select value={brand.headingFont} onChange={(event) => updateBrand({ headingFont: event.target.value as SiteBrandSettings["headingFont"] })} className="mt-2 h-10 w-full rounded-[8px] border border-black/10 bg-white px-3 text-[12px] font-medium text-black"><option value="new-york">New York</option><option value="jakarta">Jakarta / sans-serif</option></select></label></div></div>
          <div className="space-y-5 p-5 sm:p-6"><div className="flex items-center gap-2"><ImagePlus size={17}/><h3 className="font-serif text-[20px]">Logos</h3></div><div className="grid gap-3 sm:grid-cols-2"><input ref={darkLogoInputRef} type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" className="hidden" onChange={(event) => void uploadLogo(event.target.files, "dark")}/><input ref={lightLogoInputRef} type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" className="hidden" onChange={(event) => void uploadLogo(event.target.files, "light")}/><div className="text-[11px] font-semibold text-black/55">Logo clair — fond sombre<div className="mt-2 flex gap-2"><button type="button" onClick={() => darkLogoInputRef.current?.click()} className="h-10 rounded-[8px] border border-black/10 bg-white px-3 text-[12px] font-medium text-black">Importer</button><select value={brand.logoOnDarkUrl ?? ""} onChange={(event) => updateBrand({ logoOnDarkUrl: event.target.value })} className="h-10 min-w-0 flex-1 rounded-[8px] border border-black/10 bg-white px-3 text-[12px] font-medium text-black"><option value="">Logo actuel</option>{assets.map((asset) => <option key={`dark-${asset.id}`} value={asset.public_url}>{asset.title}</option>)}</select></div></div><div className="text-[11px] font-semibold text-black/55">Logo sombre — fond clair<div className="mt-2 flex gap-2"><button type="button" onClick={() => lightLogoInputRef.current?.click()} className="h-10 rounded-[8px] border border-black/10 bg-white px-3 text-[12px] font-medium text-black">Importer</button><select value={brand.logoOnLightUrl ?? ""} onChange={(event) => updateBrand({ logoOnLightUrl: event.target.value })} className="h-10 min-w-0 flex-1 rounded-[8px] border border-black/10 bg-white px-3 text-[12px] font-medium text-black"><option value="">Logo actuel</option>{assets.map((asset) => <option key={`light-${asset.id}`} value={asset.public_url}>{asset.title}</option>)}</select></div></div></div></div>
          <div className="space-y-5 p-5 sm:p-6"><div className="flex items-center gap-2"><Mail size={17}/><h3 className="font-serif text-[20px]">Coordonnées & contact</h3></div><div className="grid gap-3"><label className="text-[11px] font-semibold text-black/55">Email<input value={brand.email} onChange={(event) => updateBrand({ email: event.target.value })} placeholder="bonjour@votresite.fr" className="mt-2 h-10 w-full rounded-[8px] border border-black/10 px-3 text-[12px] font-medium text-black outline-none"/></label><label className="text-[11px] font-semibold text-black/55">Téléphone<input value={brand.phone} onChange={(event) => updateBrand({ phone: event.target.value })} placeholder="06 00 00 00 00" className="mt-2 h-10 w-full rounded-[8px] border border-black/10 px-3 text-[12px] font-medium text-black outline-none"/></label><label className="text-[11px] font-semibold text-black/55">Adresse<input value={brand.address} onChange={(event) => updateBrand({ address: event.target.value })} placeholder="Votre adresse" className="mt-2 h-10 w-full rounded-[8px] border border-black/10 px-3 text-[12px] font-medium text-black outline-none"/></label><label className="text-[11px] font-semibold text-black/55">Mode de contact<select value={brand.contactMode} onChange={(event) => updateBrand({ contactMode: event.target.value as SiteBrandSettings["contactMode"] })} className="mt-2 h-10 w-full rounded-[8px] border border-black/10 bg-white px-3 text-[12px] font-medium text-black"><option value="form">Formulaire</option><option value="qualifier">Questionnaire de qualification</option></select></label></div></div>
        </div>
        <div className="mt-5 grid gap-3 rounded-[10px] bg-black/[.025] p-4 text-[12px] text-black/55 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center"><MapPin size={16} className="hidden text-black/55 sm:block"/><label className="min-w-0 font-semibold text-black/55">Google Reviews<input value={brand.googleReviewsUrl ?? ""} onChange={(event) => updateBrand({ googleReviewsUrl: event.target.value })} placeholder="Lien Google Maps de l’établissement" className="mt-2 h-10 w-full rounded-[8px] border border-black/10 bg-white px-3 text-[12px] font-medium text-black outline-none"/></label><p className="sm:col-start-2">Le lien est sauvegardé maintenant ; la synchronisation des avis se branche ensuite au compte Google Business Profile.</p></div>
      </section>

      <div className="mt-7 flex flex-col gap-5 sm:mt-9 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-serif text-[25px] tracking-[-.045em]">Images</h2><p className="mt-1 text-[12px] text-black/48">Photos utilisables dans les sections du site.</p></div><input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => uploadFiles(Array.from(event.target.files ?? []))} /><div className="flex items-center gap-4"><span className="text-[11px] text-black/40">{filteredAssets.length} image(s)</span><button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232,#222)] px-5 text-[13px] font-semibold text-white shadow-md disabled:opacity-60 sm:h-10">{uploading ? <LoaderCircle size={15} className="animate-spin" /> : <UploadCloud size={15} />}{uploading ? `${progress.current}/${progress.total}` : "Importer des photos"}</button></div></div>

      <div className="mt-6 flex flex-col gap-2 border-y border-black/[0.07] py-3 sm:mt-8"><label className="flex h-10 w-full max-w-[360px] items-center gap-2 rounded-[8px] bg-[#f6f6f6] px-3 sm:h-9"><Search size={14} className="text-black/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une image" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none" /></label></div>
      {message ? <p className="mt-3 text-[11px] text-black/50">{message}</p> : null}

      {filteredAssets.length ? <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:mt-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8 xl:grid-cols-5">{filteredAssets.map((asset) => <button key={asset.id} type="button" onClick={() => setSelected(asset)} className="group min-w-0 text-left"><span className="block aspect-[201/197] overflow-hidden rounded-[12px] border-[3px] border-white bg-[#dedede] shadow-[0_13px_5px_rgba(0,0,0,.01),0_7px_4px_rgba(0,0,0,.02),0_3px_3px_rgba(0,0,0,.03),0_1px_2px_rgba(0,0,0,.04)] sm:rounded-[16px]"><img src={asset.public_url} alt={asset.alt_text} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" /></span><span className="mt-2.5 block truncate font-serif text-[17px] leading-none text-[#1c1c1c] sm:mt-3 sm:text-[21px]">{asset.title}</span><span className="mt-1.5 flex items-center gap-1 text-[9px] font-medium tracking-[-.03em] text-black/45 sm:mt-2 sm:gap-1.5 sm:text-[10px]">Ajoutée le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(new Date(asset.created_at))}{asset.ai_generated ? <Sparkles size={10} className="shrink-0 text-[#00a7e2]" /> : null}</span></button>)}</div> : <button type="button" onClick={() => inputRef.current?.click()} onDrop={(event) => { event.preventDefault(); uploadFiles(Array.from(event.dataTransfer.files)); }} onDragOver={(event) => event.preventDefault()} className="mt-6 grid min-h-[240px] w-full place-items-center rounded-[16px] border border-dashed border-black/15 bg-[#fcfcfb] px-5 text-center sm:mt-8 sm:min-h-[320px]"><span><span className="mx-auto grid size-12 place-items-center rounded-full bg-white shadow-sm"><ImagePlus size={20} /></span><strong className="mt-4 block font-serif text-[20px] font-normal sm:text-[22px]">Ajoutez vos premières photos</strong><span className="mt-2 block text-[12px] leading-5 text-black/40">Cliquez ou déposez plusieurs images ici.</span></span></button>}

      {selected ? <div role="dialog" aria-modal="true" aria-label={selected.title} className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-[#08090b]/90 p-3 pb-24 pt-16 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}><button type="button" onClick={() => setSelected(null)} aria-label="Fermer" className="fixed right-3 top-3 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-5 sm:top-5 sm:size-10"><X size={19} /></button><div className="flex w-full max-w-[1180px] flex-col items-center"><img src={selected.public_url} alt={selected.alt_text} className="max-h-[calc(100dvh-210px)] max-w-full rounded-[10px] object-contain shadow-2xl sm:rounded-[12px]" /><div className="mt-4 max-w-[850px] px-2 text-center text-white sm:mt-5"><h2 className="font-serif text-[22px] sm:text-[25px]">{selected.title}</h2><p className="mt-2 text-[12px] leading-5 text-white/65 sm:text-[13px] sm:leading-6">{selected.alt_text}</p></div></div></div> : null}
    </div>
  );
}
