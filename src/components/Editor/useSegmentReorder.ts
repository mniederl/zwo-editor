import { type DragEvent, useCallback, useState } from "react";

interface UseSegmentReorderProps {
  barIds: string[];
  moveBarToIndex: (id: string, targetIndex: number) => void;
}

export default function useSegmentReorder({ barIds, moveBarToIndex }: UseSegmentReorderProps) {
  const [draggingBarId, setDraggingBarId] = useState<string | null>(null);
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null);
  const [dropMarkerX, setDropMarkerX] = useState<number | null>(null);

  const getNearestBoundary = useCallback((event: DragEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const segmentElements = Array.from(container.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child.classList.contains("segment-dnd-item"),
    );

    if (segmentElements.length === 0) {
      return { insertIndex: 0, x: Math.max(0, cursorX) };
    }

    const boundaries: number[] = [segmentElements[0]?.offsetLeft || 0];
    segmentElements.forEach((segmentElement) => {
      boundaries.push(segmentElement.offsetLeft + segmentElement.offsetWidth);
    });

    let nearestInsertIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    boundaries.forEach((boundaryX, boundaryIndex) => {
      const distance = Math.abs(cursorX - boundaryX);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestInsertIndex = boundaryIndex;
      }
    });

    return { insertIndex: nearestInsertIndex, x: boundaries[nearestInsertIndex] || 0 };
  }, []);

  const getActiveDragId = useCallback(
    (event: DragEvent): string | null => draggingBarId || event.dataTransfer.getData("text/plain") || null,
    [draggingBarId],
  );

  const handleSegmentDragStart = useCallback((event: DragEvent<HTMLElement>, barId: string) => {
    if (!event.altKey) {
      event.preventDefault();
      return;
    }

    event.stopPropagation();
    setDraggingBarId(barId);
    setDropInsertIndex(null);
    setDropMarkerX(null);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", barId);
  }, []);

  const handleLaneDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const activeDragId = getActiveDragId(event);
      if (!activeDragId) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      const nearestBoundary = getNearestBoundary(event);
      setDropInsertIndex(nearestBoundary.insertIndex);
      setDropMarkerX(nearestBoundary.x);
    },
    [getActiveDragId, getNearestBoundary],
  );

  const clearDragState = useCallback(() => {
    setDraggingBarId(null);
    setDropInsertIndex(null);
    setDropMarkerX(null);
  }, []);

  const handleLaneDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const activeDragId = getActiveDragId(event);
      if (!activeDragId) {
        clearDragState();
        return;
      }

      const nearestBoundary = getNearestBoundary(event);
      const targetInsertIndex = dropInsertIndex ?? nearestBoundary.insertIndex;
      const sourceIndex = barIds.findIndex((barId) => barId === activeDragId);
      if (sourceIndex < 0) {
        clearDragState();
        return;
      }

      moveBarToIndex(activeDragId, targetInsertIndex);
      clearDragState();
    },
    [barIds, clearDragState, dropInsertIndex, getActiveDragId, getNearestBoundary, moveBarToIndex],
  );

  return {
    draggingBarId,
    dropMarkerX,
    handleSegmentDragStart,
    handleLaneDragOver,
    handleLaneDrop,
    handleSegmentDragEnd: clearDragState,
  };
}
