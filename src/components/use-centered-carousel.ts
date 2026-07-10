"use client";

import { useEffect, useRef, useState } from "react";

export function useCenteredCarousel(
  itemCount: number,
  { loop = false }: { loop?: boolean } = {},
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    const firstItem = container?.children[loop ? 1 : 0] as HTMLElement | undefined;

    if (container && firstItem) {
      container.scrollTo({
        left: firstItem.offsetLeft - (container.clientWidth - firstItem.offsetWidth) / 2,
      });
    }
  }, [itemCount, loop]);

  function scrollToDomIndex(domIndex: number, behavior: ScrollBehavior = "smooth") {
    const container = containerRef.current;
    const item = container?.children[domIndex] as HTMLElement | undefined;

    if (container && item) {
      container.scrollTo({
        left: item.offsetLeft - (container.clientWidth - item.offsetWidth) / 2,
        behavior,
      });
    }
  }

  function goTo(index: number) {
    if (itemCount === 0) return;
    const nextIndex = (index + itemCount) % itemCount;
    scrollToDomIndex(loop ? nextIndex + 1 : nextIndex);

    setActiveIndex(nextIndex);
  }

  function move(delta: number) {
    if (!loop) {
      goTo(activeIndex + delta);
      return;
    }

    if (activeIndex === itemCount - 1 && delta > 0) {
      scrollToDomIndex(itemCount + 1);
      return;
    }

    if (activeIndex === 0 && delta < 0) {
      scrollToDomIndex(0);
      return;
    }

    goTo(activeIndex + delta);
  }

  function onScroll() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;

      const center = container.scrollLeft + container.clientWidth / 2;
      const items = Array.from(container.children) as HTMLElement[];
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      items.forEach((item, index) => {
        const itemCenter = item.offsetLeft + item.offsetWidth / 2;
        const distance = Math.abs(itemCenter - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      if (!loop) {
        setActiveIndex(closestIndex);
        return;
      }

      if (closestIndex === 0) {
        setActiveIndex(itemCount - 1);
        scrollToDomIndex(itemCount, "auto");
        return;
      }

      if (closestIndex === itemCount + 1) {
        setActiveIndex(0);
        scrollToDomIndex(1, "auto");
        return;
      }

      setActiveIndex(closestIndex - 1);
    });
  }

  return {
    activeIndex,
    containerRef,
    goTo,
    move,
    onScroll,
  };
}
