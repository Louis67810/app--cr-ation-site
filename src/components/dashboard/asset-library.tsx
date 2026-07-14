"use client";

import { ImagePlus, LoaderCircle, Search, Sparkles, UploadCloud, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardAsset, DashboardProject } from "@/components/dashboard/dashboard-shell";
import { prepareImageForUpload } from "@/lib/client-images";

export function AssetLibrary({ project, initialAssets }: { project: DashboardProject; initialAssets: DashboardAsset[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState(initialAssets);
  const [selected, setSelected] = useState<DashboardAsset | null>(null);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [message, setMessage] = useState("");
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
    if (!images.length) return;
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
  }

  return (
    <div className="pb-8 font-[var(--font-inter)] sm:pb-16">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2"><h1 className="font-serif text-[27px] tracking-[-0.05em] sm:text-[30px]">Assets</h1><span className="rounded-full bg-[#eef9ff] px-2 py-1 text-[9px] font-semibold text-[#008fc5]">IA</span></div><p className="mt-2 text-[13px] font-medium leading-5 text-black/55 sm:text-[14px]">Centralisez les photos de {project.name} et générez automatiquement leurs textes alternatifs.</p></div><input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => uploadFiles(Array.from(event.target.files ?? []))} /><button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232,#222)] px-5 text-[13px] font-semibold text-white shadow-md disabled:opacity-60 sm:h-10 sm:w-auto">{uploading ? <LoaderCircle size={15} className="animate-spin" /> : <UploadCloud size={15} />}{uploading ? `${progress.current}/${progress.total}` : "Importer des photos"}</button></header>

      <div className="mt-6 flex flex-col gap-2 border-y border-black/[0.07] py-3 min-[380px]:flex-row min-[380px]:items-center sm:mt-8"><label className="flex h-10 w-full max-w-[360px] items-center gap-2 rounded-[8px] bg-[#f6f6f6] px-3 sm:h-9"><Search size={14} className="text-black/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une image" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none" /></label><span className="text-[11px] text-black/40 min-[380px]:ml-auto">{filteredAssets.length} image(s)</span></div>
      {message ? <p className="mt-3 text-[11px] text-black/50">{message}</p> : null}

      {filteredAssets.length ? <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:mt-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8 xl:grid-cols-5">{filteredAssets.map((asset) => <button key={asset.id} type="button" onClick={() => setSelected(asset)} className="group min-w-0 text-left"><span className="block aspect-[201/197] overflow-hidden rounded-[12px] border-[3px] border-white bg-[#dedede] shadow-[0_13px_5px_rgba(0,0,0,.01),0_7px_4px_rgba(0,0,0,.02),0_3px_3px_rgba(0,0,0,.03),0_1px_2px_rgba(0,0,0,.04)] sm:rounded-[16px]"><img src={asset.public_url} alt={asset.alt_text} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" /></span><span className="mt-2.5 block truncate font-serif text-[17px] leading-none text-[#1c1c1c] sm:mt-3 sm:text-[21px]">{asset.title}</span><span className="mt-1.5 flex items-center gap-1 text-[9px] font-medium tracking-[-.03em] text-black/45 sm:mt-2 sm:gap-1.5 sm:text-[10px]">Ajoutée le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(new Date(asset.created_at))}{asset.ai_generated ? <Sparkles size={10} className="shrink-0 text-[#00a7e2]" /> : null}</span></button>)}</div> : <button type="button" onClick={() => inputRef.current?.click()} onDrop={(event) => { event.preventDefault(); uploadFiles(Array.from(event.dataTransfer.files)); }} onDragOver={(event) => event.preventDefault()} className="mt-6 grid min-h-[240px] w-full place-items-center rounded-[16px] border border-dashed border-black/15 bg-[#fcfcfb] px-5 text-center sm:mt-8 sm:min-h-[320px]"><span><span className="mx-auto grid size-12 place-items-center rounded-full bg-white shadow-sm"><ImagePlus size={20} /></span><strong className="mt-4 block font-serif text-[20px] font-normal sm:text-[22px]">Ajoutez vos premières photos</strong><span className="mt-2 block text-[12px] leading-5 text-black/40">Cliquez ou déposez plusieurs images ici.</span></span></button>}

      {selected ? <div role="dialog" aria-modal="true" aria-label={selected.title} className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-[#08090b]/90 p-3 pb-24 pt-16 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}><button type="button" onClick={() => setSelected(null)} aria-label="Fermer" className="fixed right-3 top-3 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-5 sm:top-5 sm:size-10"><X size={19} /></button><div className="flex w-full max-w-[1180px] flex-col items-center"><img src={selected.public_url} alt={selected.alt_text} className="max-h-[calc(100dvh-210px)] max-w-full rounded-[10px] object-contain shadow-2xl sm:rounded-[12px]" /><div className="mt-4 max-w-[850px] px-2 text-center text-white sm:mt-5"><h2 className="font-serif text-[22px] sm:text-[25px]">{selected.title}</h2><p className="mt-2 text-[12px] leading-5 text-white/65 sm:text-[13px] sm:leading-6">{selected.alt_text}</p></div></div></div> : null}
    </div>
  );
}
