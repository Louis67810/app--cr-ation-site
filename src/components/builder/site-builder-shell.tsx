"use client";

import {
  ArrowLeft,
  ChevronDown,
  FileText,
  Home,
  Layers3,
  Maximize2,
  Monitor,
  Plus,
  Play,
  RotateCw,
  Search,
  Smartphone,
  Tablet,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { renderSection } from "@/components/site-sections";
import type { SectionInstance, SitePage } from "@/lib/site-template";

type Path = Array<string | number>;
type LeftTab = "pages" | "sections";
type DeviceMode = "desktop" | "tablet" | "phone";
type DropIndicator = {
  sectionId: string;
  position: "before" | "after";
} | null;

const MIN_PANEL = 240;
const MAX_PANEL = 520;

const devicePresets: Record<
  DeviceMode,
  {
    label: string;
    range: string;
    width: number;
    minHeight: number;
    viewportHeight: number;
    icon: typeof Monitor;
  }
> = {
  desktop: {
    label: "Desktop",
    range: "1400",
    width: 1400,
    minHeight: 1400,
    viewportHeight: 883,
    icon: Monitor,
  },
  tablet: {
    label: "Tablet",
    range: "1399 - 810",
    width: 810,
    minHeight: 1800,
    viewportHeight: 810,
    icon: Tablet,
  },
  phone: {
    label: "Phone",
    range: "809 - 0",
    width: 390,
    minHeight: 2600,
    viewportHeight: 844,
    icon: Smartphone,
  },
};

const sectionLabels: Record<SectionInstance["type"], string> = {
  "site-header": "Navigation",
  hero: "Hero section",
  "social-proof": "Preuves sociales",
  services: "Prestations",
};

function createSection(type: SectionInstance["type"]): SectionInstance {
  const id = `${type}-${Date.now()}`;

  if (type === "site-header") {
    return {
      id,
      type,
      variant: "glass-a",
      fields: {
        logoLabel: "Logo",
        navigation: [
          { label: "Accueil", href: "/" },
          { label: "Prestations", href: "/prestations" },
          { label: "Contact", href: "/contact" },
        ],
        cta: { label: "Demander un devis", href: "/contact" },
      },
    };
  }

  if (type === "hero") {
    return {
      id,
      type,
      variant: "full-image-a",
      fields: {
        backgroundImageUrl: "/images/hero-landscaper-mowing.png",
        title: "Un nouveau hero section",
        subtitle: "Texte de presentation a personnaliser pour le client.",
        primaryCta: { label: "Voir les prestations", href: "/prestations" },
        secondaryCta: { label: "Demander un devis", href: "/contact" },
        reviewRatingLabel: "Excellent",
        reviewScore: "4,8/5",
        reviewCount: "128 avis",
        reviewCta: { label: "Ecrire un avis", href: "#" },
      },
    };
  }

  if (type === "social-proof") {
    return {
      id,
      type,
      variant: "band-a",
      fields: {
        stats: [
          { value: "4,8/5", label: "Note moyenne client." },
          { value: "120+", label: "Projets realises." },
          { value: "15 ans", label: "D'experience." },
        ],
      },
    };
  }

  return {
    id,
    type,
    variant: "cards-a",
    fields: {
      title: "Nos prestations",
      cta: { label: "Tout voir", href: "/prestations" },
      services: [
        {
          title: "Creation de jardin",
          description: "Description de la prestation.",
          imageUrl:
            "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=85",
          href: "/prestations/creation-jardin",
        },
      ],
    },
  };
}

function readAtPath(value: unknown, path: Path): unknown {
  return path.reduce<unknown>((current, key) => {
    if (current == null) {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, value);
}

function updateAtPath<T>(value: T, path: Path, nextValue: string): T {
  if (path.length === 0) {
    return nextValue as T;
  }

  if (Array.isArray(value)) {
    const [head, ...rest] = path;

    return value.map((item, index) =>
      index === head ? updateAtPath(item, rest, nextValue) : item,
    ) as T;
  }

  if (typeof value === "object" && value !== null) {
    const [head, ...rest] = path;

    return {
      ...value,
      [head]: updateAtPath(
        (value as Record<string, unknown>)[head],
        rest,
        nextValue,
      ),
    };
  }

  return value;
}

function getEditableStringPaths(value: unknown, basePath: Path = []): Path[] {
  if (typeof value === "string") {
    return [basePath];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      getEditableStringPaths(item, [...basePath, index]),
    );
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, item]) =>
      getEditableStringPaths(item, [...basePath, key]),
    );
  }

  return [];
}

function pathLabel(path: Path) {
  const labels: Record<string, string> = {
    logoLabel: "Logo",
    navigation: "Menu",
    label: "Libelle",
    href: "Lien",
    cta: "CTA",
    backgroundImageUrl: "Image de fond",
    title: "Titre",
    subtitle: "Sous-titre",
    primaryCta: "CTA secondaire",
    secondaryCta: "CTA principal",
    reviewRatingLabel: "Libelle avis",
    reviewScore: "Note avis",
    reviewCount: "Nombre d'avis",
    reviewCta: "CTA avis",
    stats: "Statistique",
    services: "Prestation",
    description: "Description",
    imageUrl: "Image",
  };

  return path
    .map((part) => {
      if (typeof part === "number") {
        return `${part + 1}`;
      }

      return labels[part] ?? part;
    })
    .join(" / ");
}

function pathCategory(path: Path) {
  const first = String(path[0] ?? "");
  const second = String(path[1] ?? "");

  if (first === "backgroundImageUrl" || first === "imageUrl") return "Image";
  if (first.toLowerCase().includes("cta") || second.toLowerCase().includes("cta")) return "CTA";
  if (first === "reviewRatingLabel" || first === "reviewScore" || first === "reviewCount" || first === "reviewCta") return "Avis";
  if (first === "navigation") return "Menu";
  if (first === "stats") return "Statistiques";
  if (first === "services") return "Prestations";
  if (first === "logoLabel") return "Logo";

  return "Contenu";
}

function groupPaths(paths: Path[]) {
  return paths.reduce<Array<{ category: string; paths: Path[] }>>((groups, path) => {
    const category = pathCategory(path);
    const group = groups.find((item) => item.category === category);

    if (group) {
      group.paths.push(path);
    } else {
      groups.push({ category, paths: [path] });
    }

    return groups;
  }, []);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDeviceModeFromWidth(width: number): DeviceMode {
  if (width <= 809) {
    return "phone";
  }

  if (width <= 1399) {
    return "tablet";
  }

  return "desktop";
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, [contenteditable='true']"));
}

export function SiteBuilderShell({ initialPage }: { initialPage: SitePage }) {
  const [page, setPage] = useState(initialPage);
  const [selectedSectionId, setSelectedSectionId] = useState(
    initialPage.sections.find((section) => section.type === "hero")?.id ??
      initialPage.sections[0]?.id ??
      "",
  );
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>("sections");
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(370);
  const [projectName] = useState("Projet paysagiste");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSize, setPreviewSize] = useState({
    width: devicePresets.desktop.width,
    height: 883,
  });
  const [zoom, setZoom] = useState(0.58);
  const [spacePressed, setSpacePressed] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null);
  const [contextMenu, setContextMenu] = useState<{
    sectionId: string;
    x: number;
    y: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const zoomContentRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  const panRef = useRef({ active: false, x: 0, y: 0, left: 0, top: 0 });
  const draggedSectionIdRef = useRef<string | null>(null);

  const selectedSection = useMemo(
    () => page.sections.find((section) => section.id === selectedSectionId),
    [page.sections, selectedSectionId],
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    canvasRef.current.scrollLeft = 360;
    canvasRef.current.scrollTop = 60;
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code === "Space" && !isEditableTarget(event.target)) {
        event.preventDefault();

        if (!event.repeat) {
          setSpacePressed(true);
        }
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") {
        setSpacePressed(false);
        panRef.current.active = false;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const currentCanvas = canvas;

    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey) {
        return;
      }

      const previousZoom = zoomRef.current;
      const nextZoom = clamp(previousZoom - event.deltaY * 0.0007, 0.25, 1.4);
      const rect = currentCanvas.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const zoomContent = zoomContentRef.current;
      const contentLeft = zoomContent?.offsetLeft ?? 0;
      const contentTop = zoomContent?.offsetTop ?? 0;
      const contentX =
        (currentCanvas.scrollLeft + pointerX - contentLeft) / previousZoom;
      const contentY =
        (currentCanvas.scrollTop + pointerY - contentTop) / previousZoom;

      event.preventDefault();
      event.stopPropagation();
      zoomRef.current = nextZoom;
      setZoom(nextZoom);
      currentCanvas.scrollLeft = contentLeft + contentX * nextZoom - pointerX;
      currentCanvas.scrollTop = contentTop + contentY * nextZoom - pointerY;
    }

    currentCanvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      currentCanvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  function updateSection(sectionId: string, path: Path, nextValue: string) {
    setPage((currentPage) => ({
      ...currentPage,
      sections: currentPage.sections.map((section) =>
        section.id === sectionId
          ? ({
              ...section,
              fields: updateAtPath(section.fields, path, nextValue),
            } as SectionInstance)
          : section,
      ),
    }));
  }

  function updateSelectedSection(path: Path, nextValue: string) {
    if (selectedSection) {
      updateSection(selectedSection.id, path, nextValue);
    }
  }

  function addSocialProofStat() {
    if (!selectedSection || selectedSection.type !== "social-proof") {
      return;
    }

    setPage((currentPage) => ({
      ...currentPage,
      sections: currentPage.sections.map((section) => {
        if (
          section.id !== selectedSection.id ||
          section.type !== "social-proof" ||
          section.fields.stats.length >= 5
        ) {
          return section;
        }

        return {
          ...section,
          fields: {
            ...section.fields,
            stats: [
              ...section.fields.stats,
              { value: "4,8/5", label: "Nouvelle preuve sociale." },
            ],
          },
        };
      }),
    }));
  }

  function removeSocialProofStat() {
    if (!selectedSection || selectedSection.type !== "social-proof") {
      return;
    }

    setPage((currentPage) => ({
      ...currentPage,
      sections: currentPage.sections.map((section) => {
        if (
          section.id !== selectedSection.id ||
          section.type !== "social-proof" ||
          section.fields.stats.length <= 1
        ) {
          return section;
        }

        return {
          ...section,
          fields: {
            ...section.fields,
            stats: section.fields.stats.slice(0, -1),
          },
        };
      }),
    }));
  }

  function addSection(type: SectionInstance["type"]) {
    const section = createSection(type);
    setPage((currentPage) => ({
      ...currentPage,
      sections: [...currentPage.sections, section],
    }));
    setSelectedSectionId(section.id);
    setAddMenuOpen(false);
  }

  function deleteSection(sectionId: string) {
    setPage((currentPage) => {
      const nextSections = currentPage.sections.filter(
        (section) => section.id !== sectionId,
      );

      if (selectedSectionId === sectionId) {
        setSelectedSectionId(nextSections[0]?.id ?? "");
      }

      return { ...currentPage, sections: nextSections };
    });
    setContextMenu(null);
  }

  function moveSectionTo(
    sectionId: string,
    targetId: string,
    position: "before" | "after",
  ) {
    if (sectionId === targetId) {
      setDropIndicator(null);
      return;
    }

    setPage((currentPage) => {
      const from = currentPage.sections.findIndex((section) => section.id === sectionId);
      const to = currentPage.sections.findIndex((section) => section.id === targetId);

      if (from < 0 || to < 0) return currentPage;

      const nextSections = [...currentPage.sections];
      const [section] = nextSections.splice(from, 1);
      const targetIndex = nextSections.findIndex((item) => item.id === targetId);
      const insertIndex = position === "after" ? targetIndex + 1 : targetIndex;
      nextSections.splice(insertIndex, 0, section);

      return { ...currentPage, sections: nextSections };
    });
    setDropIndicator(null);
  }

  function startResize(side: "left" | "right", event: React.MouseEvent) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = side === "left" ? leftWidth : rightWidth;

    function onMove(moveEvent: MouseEvent) {
      const delta = moveEvent.clientX - startX;
      const nextWidth =
        side === "left" ? startWidth + delta : startWidth - delta;

      if (side === "left") {
        setLeftWidth(clamp(nextWidth, MIN_PANEL, MAX_PANEL));
      } else {
        setRightWidth(clamp(nextWidth, MIN_PANEL, MAX_PANEL));
      }
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function startPan(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;

    if (
      !canvasRef.current ||
      !(event.button === 1 || (event.button === 0 && spacePressed)) ||
      target.closest("[data-builder-control]")
    ) {
      return;
    }

    event.preventDefault();
    panRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      left: canvasRef.current.scrollLeft,
      top: canvasRef.current.scrollTop,
    };
  }

  function panCanvas(event: React.MouseEvent<HTMLDivElement>) {
    if (!panRef.current.active || !canvasRef.current) return;

    canvasRef.current.scrollLeft =
      panRef.current.left - (event.clientX - panRef.current.x);
    canvasRef.current.scrollTop =
      panRef.current.top - (event.clientY - panRef.current.y);
  }

  function stopPan() {
    panRef.current.active = false;
  }

  function openPreview(mode = deviceMode) {
    setDeviceMode(mode);
    setPreviewSize((currentSize) => ({
      ...currentSize,
      width: devicePresets[mode].width,
    }));
    setPreviewOpen(true);
  }

  if (previewOpen) {
    return (
      <PreviewMode
        page={page}
        deviceMode={deviceMode}
        size={previewSize}
        onBack={() => setPreviewOpen(false)}
        onDeviceChange={(mode) => {
          setDeviceMode(mode);
          setPreviewSize((currentSize) => ({
            ...currentSize,
            width: devicePresets[mode].width,
          }));
        }}
        onSizeChange={(size) => {
          setPreviewSize(size);
          setDeviceMode(getDeviceModeFromWidth(size.width));
        }}
      />
    );
  }

  return (
    <main
      className="grid h-screen overflow-hidden bg-[#f6f6f6] font-[var(--font-inter)] text-[#151515]"
      style={{
        gridTemplateRows: "48px minmax(0, 1fr)",
        gridTemplateColumns: `${leftWidth}px 6px minmax(0, 1fr) 6px ${rightWidth}px`,
      }}
      onClick={() => setContextMenu(null)}
    >
      <TopBar projectName={projectName} onPreview={() => openPreview()} />

      <LeftPanel
        page={page}
        sections={page.sections}
        selectedSectionId={selectedSectionId}
        activeTab={activeLeftTab}
        addMenuOpen={addMenuOpen}
        draggedSectionId={draggedSectionId}
        dropIndicator={dropIndicator}
        contextMenu={contextMenu}
        onTabChange={setActiveLeftTab}
        onSelect={setSelectedSectionId}
        onAddMenuToggle={() => setAddMenuOpen((open) => !open)}
        onAddSection={addSection}
        onContextMenu={setContextMenu}
        onDelete={deleteSection}
        onDragStart={(id) => {
          draggedSectionIdRef.current = id;
          setDraggedSectionId(id);
          setSelectedSectionId(id);
        }}
        onDragEnd={() => {
          draggedSectionIdRef.current = null;
          setDraggedSectionId(null);
          setDropIndicator(null);
        }}
        onDragOverSection={(id, position) => {
          setDropIndicator({ sectionId: id, position });
        }}
        onDropOn={(id, position) => {
          if (draggedSectionIdRef.current) {
            moveSectionTo(draggedSectionIdRef.current, id, position);
            draggedSectionIdRef.current = null;
            setDraggedSectionId(null);
          }
        }}
      />

      <ResizeHandle onMouseDown={(event) => startResize("left", event)} />

      <section
        ref={canvasRef}
        onMouseDown={startPan}
        onMouseMove={panCanvas}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
        className={`builder-canvas relative row-start-2 overflow-auto border-x border-[#e5e5e5] bg-[#f4f4f4] ${
          spacePressed ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        }`}
      >
        <div className="relative h-[2800px] w-[3600px]">
          <div
            ref={zoomContentRef}
            className="absolute left-[180px] top-[86px] flex origin-top-left items-start gap-12"
            style={{
              transform: `scale(${zoom})`,
            }}
          >
            {(Object.keys(devicePresets) as DeviceMode[]).map((mode) => (
              <DeviceFrame
                key={mode}
                mode={mode}
                page={page}
                selected={deviceMode === mode}
                selectedSectionId={selectedSectionId}
                onSelectDevice={setDeviceMode}
                onPreview={openPreview}
                onSelectSection={setSelectedSectionId}
                onTextChange={updateSection}
              />
            ))}
          </div>
        </div>
      </section>

      <ResizeHandle onMouseDown={(event) => startResize("right", event)} />

      <RightPanel
        section={selectedSection}
        onChange={updateSelectedSection}
        onAddSocialProofStat={addSocialProofStat}
        onRemoveSocialProofStat={removeSocialProofStat}
      />
    </main>
  );
}

function TopBar({
  projectName,
  onPreview,
}: {
  projectName: string;
  onPreview: () => void;
}) {
  return (
    <header className="col-span-5 grid grid-cols-[1fr_auto_1fr] items-center border-b border-[#e8e8e8] bg-white px-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-8 items-center gap-2 rounded-[8px] bg-white px-2 text-[12px] font-semibold text-[#222222] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.08)]"
          aria-label="Retour au dashboard"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#f6f6f6] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
            <ArrowLeft size={13} />
          </span>
          Retour
        </button>
      </div>

      <div className="text-center text-[12px] font-semibold text-[#1f1f1f]">
        {projectName}
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onPreview}
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#f3f3f3] text-[#222222] hover:bg-[#eeeeee]"
          aria-label="Preview"
        >
          <Play size={15} fill="currentColor" />
        </button>
        <button
          type="button"
          className="flex h-9 w-[141px] items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232_0%,#222222_100%)] px-5 py-2 text-center text-[14px] font-semibold leading-5 tracking-[-0.02em] text-[#fcfcfc] shadow-[0_2px_4px_-1px_rgba(13,13,13,0.5),0_0_0_1px_#333333,inset_0_0.5px_1px_rgba(255,255,255,0.15),inset_0_-1px_1.2px_0.35px_#121212]"
        >
          Publier
        </button>
      </div>
    </header>
  );
}

function DeviceFrame({
  mode,
  page,
  selected,
  selectedSectionId,
  onSelectDevice,
  onPreview,
  onSelectSection,
  onTextChange,
}: {
  mode: DeviceMode;
  page: SitePage;
  selected: boolean;
  selectedSectionId: string;
  onSelectDevice: (mode: DeviceMode) => void;
  onPreview: (mode: DeviceMode) => void;
  onSelectSection: (id: string) => void;
  onTextChange: (sectionId: string, path: Path, value: string) => void;
}) {
  const preset = devicePresets[mode];
  const Icon = preset.icon;

  return (
    <div className="shrink-0">
      <button
        type="button"
        onMouseDown={() => onSelectDevice(mode)}
        onClick={() => onSelectDevice(mode)}
        className="mb-5 flex h-9 items-center justify-between rounded-[10px] border border-[#dedede] bg-[#eeeeee] px-2 text-[16px] font-semibold text-[#a4a4a4] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
        style={{ width: preset.width }}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-[7px] border border-[#d0d0d0] bg-[#e3e3e3]">
            <Icon size={15} />
          </span>
          {preset.label}
        </span>
        <span>{preset.range}</span>
        <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            onPreview(mode);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              onPreview(mode);
            }
          }}
          className="ml-3 flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#dcdcdc] text-[#888888]"
          aria-label={`Preview ${preset.label}`}
        >
          <Play size={13} fill="currentColor" />
        </span>
      </button>

      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectDevice(mode)}
        onClickCapture={(event) => {
          const target = event.target as HTMLElement;

          if (target.closest("a")) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            onSelectDevice(mode);
          }
        }}
        className={`relative overflow-hidden bg-white shadow-sm transition ring-inset ${
          selected ? "ring-4 ring-[#0099ff]" : "ring-1 ring-black/8"
        }`}
        style={
          {
            width: preset.width,
            minHeight: preset.minHeight,
            "--site-hero-height": `${Math.round(preset.viewportHeight * 0.95)}px`,
          } as React.CSSProperties
        }
      >
        <main className="min-h-screen bg-white text-[#0f1112]">
          {page.sections.map((section) => (
            <SectionCanvasFrame
              key={`${mode}-${section.id}`}
              section={section}
              viewport={mode}
              selected={selected && selectedSectionId === section.id}
              onSelect={onSelectSection}
              onTextChange={(path, value) => onTextChange(section.id, path, value)}
            />
          ))}
        </main>
      </div>
    </div>
  );
}

function PreviewMode({
  page,
  deviceMode,
  size,
  onBack,
  onDeviceChange,
  onSizeChange,
}: {
  page: SitePage;
  deviceMode: DeviceMode;
  size: { width: number; height: number };
  onBack: () => void;
  onDeviceChange: (mode: DeviceMode) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  if (fullscreen) {
    return (
      <main className="fixed inset-0 z-50 bg-white font-[var(--font-inter)]">
        <button
          type="button"
          onClick={() => setFullscreen(false)}
          className="fixed left-3 top-3 z-[60] flex h-8 items-center gap-2 rounded-[8px] bg-white px-3 text-[14px] font-semibold text-[#222222] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.08)]"
        >
          <ArrowLeft size={15} />
          Retour
        </button>
        <IframePreview
          key={`fullscreen-${refreshKey}`}
          page={page}
          size={{ width: window.innerWidth, height: window.innerHeight }}
          fullscreen
        />
      </main>
    );
  }

  return (
    <main className="grid h-screen grid-rows-[48px_minmax(0,1fr)] overflow-hidden bg-[#ededed] font-[var(--font-inter)] text-[#151515]">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-[#e2e2e2] bg-white px-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 items-center gap-2 rounded-[8px] bg-white px-3 text-[14px] font-semibold text-[#222222] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.08)]"
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <button
            type="button"
            onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#9a9a9a] hover:bg-[#f3f3f3]"
            aria-label="Recharger"
          >
            <RotateCw size={18} />
          </button>
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#9a9a9a] hover:bg-[#f3f3f3]"
            aria-label="Agrandir"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex h-8 items-center gap-2 rounded-[8px] bg-[#f3f3f3] px-3 text-[12px] font-semibold text-[#333333]">
            <select
              value={deviceMode}
              onChange={(event) =>
                onDeviceChange(event.target.value as DeviceMode)
              }
              className="bg-transparent outline-none"
            >
              {(Object.keys(devicePresets) as DeviceMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {devicePresets[mode].label}
                </option>
              ))}
            </select>
          </label>
          <NumberField
            label="W"
            value={size.width}
            min={1}
            max={3000}
            onChange={(width) => onSizeChange({ ...size, width })}
          />
          <NumberField
            label="H"
            value={size.height}
            min={1}
            max={3000}
            onChange={(height) => onSizeChange({ ...size, height })}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#f3f3f3] text-[#222222] hover:bg-[#eeeeee]"
            aria-label="Preview"
          >
            <Play size={15} fill="currentColor" />
          </button>
          <button
            type="button"
            className="flex h-9 w-[141px] items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232_0%,#222222_100%)] px-5 py-2 text-center text-[14px] font-semibold leading-5 tracking-[-0.02em] text-[#fcfcfc] shadow-[0_2px_4px_-1px_rgba(13,13,13,0.5),0_0_0_1px_#333333,inset_0_0.5px_1px_rgba(255,255,255,0.15),inset_0_-1px_1.2px_0.35px_#121212]"
          >
            Publier
          </button>
        </div>
      </header>

      <section className="overflow-auto p-8">
        <IframePreview key={refreshKey} page={page} size={size} />
      </section>
    </main>
  );
}

function IframePreview({
  page,
  size,
  fullscreen = false,
}: {
  page: SitePage;
  size: { width: number; height: number };
  fullscreen?: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    const document = iframe?.contentDocument;

    if (!iframe || !document) {
      return;
    }

    document.open();
    document.write(
      '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="preview-root"></div></body></html>',
    );
    document.close();

    Array.from(window.document.querySelectorAll('link[rel="stylesheet"], style')).forEach(
      (node) => {
        document.head.appendChild(node.cloneNode(true));
      },
    );

    document.documentElement.className = window.document.documentElement.className;
    document.body.className = window.document.body.className;
    document.body.style.margin = "0";
    document.body.style.background = "#ffffff";
    setMountNode(document.getElementById("preview-root"));
  }, [size.width, size.height]);

  return (
    <>
      <iframe
        ref={iframeRef}
        title="Preview du site"
        className={
          fullscreen
            ? "block bg-white"
            : "mx-auto block bg-white shadow-sm ring-1 ring-black/10"
        }
        style={{ width: size.width, height: size.height }}
      />
      {mountNode
        ? createPortal(
            <main className="min-h-screen bg-white text-[#0f1112]">
              {page.sections.map((section) => renderSection(section))}
            </main>,
            mountNode,
          )
        : null}
    </>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex h-8 items-center gap-2 rounded-[8px] bg-[#f3f3f3] px-3 text-[12px] font-semibold text-[#a0a0a0]">
      <input
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;

          if (nextValue === "") {
            return;
          }

          const numericValue = Number(nextValue);

          if (!Number.isNaN(numericValue)) {
            onChange(clamp(numericValue, min, max));
          }
        }}
        onFocus={(event) => event.currentTarget.select()}
        className="w-20 bg-transparent text-[14px] font-semibold text-[#333333] outline-none"
      />
      {label}
    </label>
  );
}

function ResizeHandle({
  onMouseDown,
}: {
  onMouseDown: (event: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label="Redimensionner le panneau"
      onMouseDown={onMouseDown}
      className="z-20 row-start-2 -mx-1 w-2 cursor-col-resize bg-transparent hover:bg-[#0099ff]/20"
    />
  );
}

function LeftPanel({
  page,
  sections,
  selectedSectionId,
  activeTab,
  addMenuOpen,
  draggedSectionId,
  dropIndicator,
  contextMenu,
  onTabChange,
  onSelect,
  onAddMenuToggle,
  onAddSection,
  onContextMenu,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOverSection,
  onDropOn,
}: {
  page: SitePage;
  sections: SectionInstance[];
  selectedSectionId: string;
  activeTab: LeftTab;
  addMenuOpen: boolean;
  draggedSectionId: string | null;
  dropIndicator: DropIndicator;
  contextMenu: { sectionId: string; x: number; y: number } | null;
  onTabChange: (tab: LeftTab) => void;
  onSelect: (id: string) => void;
  onAddMenuToggle: () => void;
  onAddSection: (type: SectionInstance["type"]) => void;
  onContextMenu: (menu: { sectionId: string; x: number; y: number } | null) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOverSection: (id: string, position: "before" | "after") => void;
  onDropOn: (id: string, position: "before" | "after") => void;
}) {
  return (
    <aside className="relative row-start-2 bg-white px-5 py-5">
      <div className="flex items-center gap-2 border-b border-[#eeeeee] pb-3">
        <button
          type="button"
          onClick={() => onTabChange("pages")}
          className={`rounded-[9px] px-3 py-2 text-[12px] font-semibold ${
            activeTab === "pages" ? "bg-[#f3f3f3] text-[#111111]" : "text-[#666666]"
          }`}
        >
          Pages
        </button>
        <button
          type="button"
          onClick={() => onTabChange("sections")}
          className={`rounded-[9px] px-3 py-2 text-[12px] font-semibold ${
            activeTab === "sections" ? "bg-[#f3f3f3] text-[#111111]" : "text-[#666666]"
          }`}
        >
          Sections
        </button>
      </div>

      <label className="mt-3 flex h-10 items-center gap-2 rounded-[10px] bg-[#f3f3f3] px-3 text-[12px] font-medium text-[#666666]">
        <Search size={14} />
        <input
          placeholder="Search..."
          className="w-full bg-transparent outline-none placeholder:text-[#999999]"
        />
      </label>

      <div className="mt-4 border-t border-[#eeeeee] pt-4">
        <div className="flex items-center justify-between text-[12px] font-semibold text-[#111111]">
          <span>{activeTab === "pages" ? "Pages" : "Sections"}</span>
          <div className="relative">
            <button
              type="button"
              onClick={onAddMenuToggle}
              className="flex h-7 w-7 items-center justify-center rounded-[8px] hover:bg-[#f3f3f3]"
              aria-label="Ajouter une section"
            >
              <Plus size={16} />
            </button>
            {addMenuOpen ? (
              <AddSectionMenu onAddSection={onAddSection} />
            ) : null}
          </div>
        </div>

        {activeTab === "pages" ? (
          <div className="mt-3 grid gap-1 text-[12px] font-medium">
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-[10px] bg-[#f3f3f3] px-3 text-left font-semibold"
            >
              <Home size={15} />
              {page.title}
            </button>
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-[10px] px-3 text-left text-[#666666]"
            >
              <FileText size={15} />
              /mentions-legales
            </button>
          </div>
        ) : (
          <div className="mt-3 grid gap-1 text-[12px] font-medium">
            {sections.map((section) => (
              <LayerButton
                key={section.id}
                section={section}
                selected={selectedSectionId === section.id}
                dragging={draggedSectionId === section.id}
                dropPosition={
                  dropIndicator?.sectionId === section.id
                    ? dropIndicator.position
                    : null
                }
                onSelect={onSelect}
                onContextMenu={onContextMenu}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOverSection={onDragOverSection}
                onDropOn={onDropOn}
              />
            ))}
          </div>
        )}
      </div>

      {contextMenu ? (
        <div
          className="absolute z-50 w-44 rounded-[10px] border border-[#eeeeee] bg-white p-1 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          data-builder-control
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onDelete(contextMenu.sectionId)}
            className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[12px] font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={15} />
            Supprimer
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function AddSectionMenu({
  onAddSection,
}: {
  onAddSection: (type: SectionInstance["type"]) => void;
}) {
  const options: Array<{ type: SectionInstance["type"]; label: string }> = [
    { type: "site-header", label: "Navigation" },
    { type: "hero", label: "Hero section" },
    { type: "social-proof", label: "Preuves sociales" },
    { type: "services", label: "Prestations" },
  ];

  return (
    <div
      className="absolute right-0 top-9 z-40 w-52 rounded-[10px] border border-[#eeeeee] bg-white p-1 shadow-xl"
      data-builder-control
    >
      {options.map((option) => (
        <button
          key={option.type}
          type="button"
          onClick={() => onAddSection(option.type)}
          className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[12px] font-medium hover:bg-[#f3f3f3]"
        >
          <Layers3 size={14} />
          {option.label}
        </button>
      ))}
    </div>
  );
}

function LayerButton({
  section,
  selected,
  dragging,
  dropPosition,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDragOverSection,
  onDropOn,
}: {
  section: SectionInstance;
  selected: boolean;
  dragging: boolean;
  dropPosition: "before" | "after" | null;
  onSelect: (id: string) => void;
  onContextMenu: (menu: { sectionId: string; x: number; y: number }) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOverSection: (id: string, position: "before" | "after") => void;
  onDropOn: (id: string, position: "before" | "after") => void;
}) {
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const position =
          event.clientY - rect.top > rect.height / 2 ? "after" : "before";
        onDragOverSection(section.id, position);
      }}
      onDrop={(event) => {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const position =
          event.clientY - rect.top > rect.height / 2 ? "after" : "before";
        onDropOn(section.id, position);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu({
          sectionId: section.id,
          x: event.nativeEvent.offsetX + 16,
          y: event.currentTarget.offsetTop + event.currentTarget.offsetHeight - 2,
        });
      }}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart(section.id);
      }}
      onDragEnd={onDragEnd}
      className={`group relative flex min-h-9 items-center gap-2 rounded-[8px] px-2 transition-all duration-150 ${
        selected || dragging
          ? "bg-[#0099ff]/20 font-semibold text-[#0a3a58]"
          : "text-[#666666] hover:bg-[#f8f8f8]"
      }`}
      data-builder-control
    >
      {dropPosition === "before" ? (
        <span className="absolute -top-[3px] left-2 right-2 h-[2px] rounded-full bg-[#0099ff]" />
      ) : null}
      {dropPosition === "after" ? (
        <span className="absolute -bottom-[3px] left-2 right-2 h-[2px] rounded-full bg-[#0099ff]" />
      ) : null}
      <Layers3
        size={14}
        className="text-[#0099ff]"
      />
      <button
        type="button"
        onClick={() => onSelect(section.id)}
        className="min-w-0 flex-1 py-2 text-left"
      >
        <span className="truncate">{sectionLabels[section.type]}</span>
      </button>
    </div>
  );
}

function SectionCanvasFrame({
  section,
  viewport,
  selected,
  onSelect,
  onTextChange,
}: {
  section: SectionInstance;
  viewport?: DeviceMode;
  selected: boolean;
  onSelect: (id: string) => void;
  onTextChange: (path: Path, value: string) => void;
}) {
  const header = section.type === "site-header";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(section.id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelect(section.id);
        }
      }}
      className={`group ${header ? "absolute inset-x-0 top-0 z-40 h-20" : "relative"}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 z-50 ${
          selected
            ? "ring-4 ring-inset ring-[#0099ff]"
            : "ring-0 group-hover:ring-4 group-hover:ring-inset group-hover:ring-black/20"
        }`}
      />
      {renderSection(section, {
        editable: selected,
        disableLinks: true,
        viewport,
        onTextChange,
        onTextFocus: () => onSelect(section.id),
      })}
    </div>
  );
}

function RightPanel({
  section,
  onChange,
  onAddSocialProofStat,
  onRemoveSocialProofStat,
}: {
  section?: SectionInstance;
  onChange: (path: Path, value: string) => void;
  onAddSocialProofStat: () => void;
  onRemoveSocialProofStat: () => void;
}) {
  if (!section) {
    return <aside className="row-start-2 bg-white p-5" />;
  }

  return (
    <aside className="row-start-2 overflow-y-auto bg-white px-5 py-5">
      <div className="border-b border-[#eeeeee] pb-3">
        <h1 className="text-[12px] font-semibold text-[#111111]">
          {sectionLabels[section.type]}
        </h1>
      </div>

      <VariantSelector section={section} />
      <SectionEditor
        section={section}
        onChange={onChange}
        onAddSocialProofStat={onAddSocialProofStat}
        onRemoveSocialProofStat={onRemoveSocialProofStat}
      />
    </aside>
  );
}

function VariantSelector({ section }: { section: SectionInstance }) {
  return (
    <div className="mt-4 rounded-[10px] border border-[#eeeeee] p-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[12px] font-medium text-[#666666]">Variante</span>
        <ChevronDown size={15} />
      </button>
      <div className="relative mt-3 h-24 overflow-hidden rounded-[8px] bg-black">
        <div
          className="pointer-events-none origin-top-left"
          style={{
            width: 600,
            transform: "scale(0.42)",
          }}
        >
          {renderSection(section)}
        </div>
        <div className="absolute bottom-2 left-2 rounded bg-black/45 px-2 py-1 text-[11px] font-semibold text-white">
          {section.type} / {section.variant}
        </div>
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  onChange,
  onAddSocialProofStat,
  onRemoveSocialProofStat,
}: {
  section: SectionInstance;
  onChange: (path: Path, value: string) => void;
  onAddSocialProofStat: () => void;
  onRemoveSocialProofStat: () => void;
}) {
  const groups = groupPaths(getEditableStringPaths(section.fields));

  return (
    <div className="mt-2">
      {groups.map((group) => (
        <div key={group.category} className="border-t border-[#eeeeee] py-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[12px] font-semibold text-[#111111]">
              {group.category}
            </h2>
            {section.type === "social-proof" &&
            group.category === "Statistiques" ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onRemoveSocialProofStat}
                  disabled={section.fields.stats.length <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#666666] hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Retirer une preuve sociale"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={onAddSocialProofStat}
                  disabled={section.fields.stats.length >= 5}
                  className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#666666] hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Ajouter une preuve sociale"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            {group.paths.map((path) => {
              const value = readAtPath(section.fields, path);
              const inputValue = typeof value === "string" ? value : "";
              const multiline = inputValue.length > 74;

              return (
                <label
                  key={path.join(".")}
                  className="grid grid-cols-[98px_minmax(0,1fr)] items-start gap-3"
                >
                  <span className="pt-2.5 text-[12px] font-medium leading-4 text-[#666666]">
                    {pathLabel(path)}
                  </span>
                  {multiline ? (
                    <textarea
                      value={inputValue}
                      onChange={(event) => onChange(path, event.target.value)}
                      className="min-h-20 resize-y rounded-[10px] border-0 bg-[#f3f3f3] px-3 py-2 text-[12px] font-medium leading-5 text-[#111111] outline-none transition focus:bg-[#eeeeee]"
                    />
                  ) : (
                    <input
                      value={inputValue}
                      onChange={(event) => onChange(path, event.target.value)}
                      className="h-10 rounded-[10px] border-0 bg-[#f3f3f3] px-3 text-[12px] font-medium text-[#111111] outline-none transition focus:bg-[#eeeeee]"
                    />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
