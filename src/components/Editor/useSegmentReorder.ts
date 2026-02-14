import { type DragEvent, useCallback, useState } from "react";

type DropPosition = "before" | "after";

interface DropMarker {
  barId: string;
  position: DropPosition;
}

interface UseSegmentReorderProps {
  barIds: string[];
  moveBarToIndex: (id: string, targetIndex: number) => void;
}

export default function useSegmentReorder({ barIds, moveBarToIndex }: UseSegmentReorderProps) {
  const [draggingBarId, setDraggingBarId] = useState<string | null>(null);
  const [dropMarker, setDropMarker] = useState<DropMarker | null>(null);

  const getDropPosition = useCallback((event: DragEvent<HTMLDivElement>): DropPosition => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX < rect.left + rect.width / 2 ? "before" : "after";
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
    setDropMarker(null);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", barId);
  }, []);

  const handleSegmentDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, targetBarId: string) => {
      const activeDragId = getActiveDragId(event);
      if (!activeDragId || activeDragId === targetBarId) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      const nextPosition = getDropPosition(event);
      setDropMarker((current) => {
        if (current?.barId === targetBarId && current.position === nextPosition) {
          return current;
        }
        return { barId: targetBarId, position: nextPosition };
      });
    },
    [getActiveDragId, getDropPosition],
  );

  const clearDragState = useCallback(() => {
    setDraggingBarId(null);
    setDropMarker(null);
  }, []);

  const handleSegmentDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, targetBarId: string) => {
      event.preventDefault();
      const activeDragId = getActiveDragId(event);
      if (!activeDragId || activeDragId === targetBarId) {
        setDropMarker(null);
        return;
      }

      const sourceIndex = barIds.findIndex((barId) => barId === activeDragId);
      const targetIndex = barIds.findIndex((barId) => barId === targetBarId);
      if (sourceIndex < 0 || targetIndex < 0) {
        setDropMarker(null);
        return;
      }

      const markerPosition = dropMarker?.barId === targetBarId ? dropMarker.position : getDropPosition(event);
      const rawInsertIndex = markerPosition === "before" ? targetIndex : targetIndex + 1;
      const normalizedInsertIndex = sourceIndex < rawInsertIndex ? rawInsertIndex - 1 : rawInsertIndex;
      moveBarToIndex(activeDragId, normalizedInsertIndex);
      clearDragState();
    },
    [barIds, clearDragState, dropMarker, getActiveDragId, getDropPosition, moveBarToIndex],
  );

  return {
    draggingBarId,
    dropMarker,
    handleSegmentDragStart,
    handleSegmentDragOver,
    handleSegmentDrop,
    handleSegmentDragEnd: clearDragState,
  };
}
