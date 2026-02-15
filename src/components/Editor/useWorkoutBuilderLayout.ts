import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type { RefObject } from "react";

interface UseWorkoutBuilderLayoutProps {
  programVisible: boolean;
  sectionRef: RefObject<HTMLElement | null>;
  shellRef: RefObject<HTMLDivElement | null>;
}

interface UseWorkoutBuilderLayoutResult {
  dynamicShellHeight: number | undefined;
  isProgramSideBySide: boolean;
  shellViewportHeight: number;
}

export default function useWorkoutBuilderLayout({
  programVisible,
  sectionRef,
  shellRef,
}: UseWorkoutBuilderLayoutProps): UseWorkoutBuilderLayoutResult {
  const [dynamicShellHeight, setDynamicShellHeight] = useState<number>();
  const [shellViewportHeight, setShellViewportHeight] = useState(430);
  const [isProgramSideBySide, setIsProgramSideBySide] = useState(false);

  const recalculateShellHeight = useCallback(() => {
    const sectionElement = sectionRef.current;
    const shellElement = shellRef.current;
    if (!sectionElement || !shellElement) {
      return;
    }

    const scrollRoot = sectionElement.closest<HTMLElement>("[data-editor-scroll-root='true']");
    if (!scrollRoot) {
      setDynamicShellHeight(undefined);
      return;
    }

    const scrollRootRect = scrollRoot.getBoundingClientRect();
    const sectionRect = sectionElement.getBoundingClientRect();
    const shellRect = shellElement.getBoundingClientRect();
    const scrollRootPaddingBottom = Number.parseFloat(window.getComputedStyle(scrollRoot).paddingBottom || "0") || 0;
    const sectionBottomOffset = sectionRect.bottom - shellRect.bottom;
    const availableHeight =
      scrollRootRect.bottom - scrollRootPaddingBottom - shellRect.top - Math.max(0, sectionBottomOffset);
    const maxAllowedHeight = Math.floor(Math.min(700, availableHeight));
    const minimumShellHeight = window.matchMedia("(max-width: 900px)").matches ? 390 : 430;
    const nextHeight = maxAllowedHeight >= minimumShellHeight ? maxAllowedHeight : undefined;
    const measuredShellHeight = Math.max(1, shellRect.height);

    setShellViewportHeight((currentHeight) => {
      if (Math.abs(currentHeight - measuredShellHeight) <= 1) {
        return currentHeight;
      }

      return measuredShellHeight;
    });

    setDynamicShellHeight((currentHeight) => {
      if (currentHeight === nextHeight) {
        return currentHeight;
      }

      if (currentHeight !== undefined && nextHeight !== undefined && Math.abs(currentHeight - nextHeight) <= 1) {
        return currentHeight;
      }

      return nextHeight;
    });
  }, [sectionRef, shellRef]);

  useLayoutEffect(() => {
    recalculateShellHeight();
    const animationFrame = window.requestAnimationFrame(() => {
      recalculateShellHeight();
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [recalculateShellHeight, programVisible, dynamicShellHeight]);

  useEffect(() => {
    const handleResize = () => recalculateShellHeight();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [recalculateShellHeight]);

  useEffect(() => {
    const sideBySideQuery = window.matchMedia("(min-width: 1536px)");
    const updateSideBySideMode = () => setIsProgramSideBySide(sideBySideQuery.matches);

    updateSideBySideMode();
    sideBySideQuery.addEventListener("change", updateSideBySideMode);

    return () => {
      sideBySideQuery.removeEventListener("change", updateSideBySideMode);
    };
  }, []);

  return {
    dynamicShellHeight,
    isProgramSideBySide,
    shellViewportHeight,
  };
}
