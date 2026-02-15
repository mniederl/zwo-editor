import { useCallback, useEffect, useState } from "react";

import { getStressScore, getWorkoutLength, round } from "@/domain/workout/metrics";
import parseWorkoutXml from "@/domain/workout/xml/parseWorkoutXml";
import {
  clearPersistedWorkoutLibraryDirectoryHandle,
  loadPersistedWorkoutLibraryDirectoryHandle,
  persistWorkoutLibraryDirectoryHandle,
} from "@/features/editor/io/workoutLibraryPersistence";
import { formatTime } from "@/utils/time";

import type { DirectoryHandleLike, LibraryWorkoutItem } from "./workoutLibraryTypes";

interface UseWorkoutLibraryDirectoryProps {
  ftp: number;
  onError: (text: string) => void;
}

interface UseWorkoutLibraryDirectoryResult {
  canUseDirectoryPicker: boolean;
  directoryHandle: DirectoryHandleLike | null;
  isLoading: boolean;
  libraryItems: LibraryWorkoutItem[];
  pickDirectory: () => Promise<void>;
  refreshDirectory: (targetDirectory: DirectoryHandleLike | null) => Promise<void>;
}

export default function useWorkoutLibraryDirectory({
  ftp,
  onError,
}: UseWorkoutLibraryDirectoryProps): UseWorkoutLibraryDirectoryResult {
  const [directoryHandle, setDirectoryHandle] = useState<DirectoryHandleLike | null>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryWorkoutItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const canUseDirectoryPicker =
    typeof window !== "undefined" &&
    typeof (window as unknown as { showDirectoryPicker?: () => Promise<DirectoryHandleLike> }).showDirectoryPicker ===
      "function";

  const refreshDirectory = useCallback(
    async (targetDirectory: DirectoryHandleLike | null) => {
      if (!targetDirectory) {
        setLibraryItems([]);
        return;
      }

      setIsLoading(true);
      try {
        const nextItems: LibraryWorkoutItem[] = [];

        for await (const [fileName, handle] of targetDirectory.entries()) {
          if (handle.kind !== "file" || !/\.(zwo|xml)$/i.test(fileName)) {
            continue;
          }

          const file = await handle.getFile();
          const xml = await file.text();

          try {
            const parsed = parseWorkoutXml(xml);
            const workoutLength = getWorkoutLength(
              parsed.segments as Parameters<typeof getWorkoutLength>[0],
              parsed.meta.durationType,
            );
            const stressScore = round(
              getStressScore(parsed.segments as Parameters<typeof getStressScore>[0], ftp),
              1,
            );

            nextItems.push({
              author: parsed.meta.author,
              fileName,
              handle,
              id: `${fileName}-${parsed.meta.name}`,
              name: parsed.meta.name || fileName.replace(/\.(zwo|xml)$/i, ""),
              segments: parsed.segments,
              stressScore,
              workoutTime: formatTime(workoutLength),
            });
          } catch {
            // Ignore files that are not valid workout XML.
          }
        }

        nextItems.sort((a, b) => a.name.localeCompare(b.name));
        setLibraryItems(nextItems);
      } catch {
        setLibraryItems([]);
        onError("Unable to read workouts from selected directory.");
      } finally {
        setIsLoading(false);
      }
    },
    [ftp, onError],
  );

  const ensureDirectoryPermission = useCallback(async (handle: DirectoryHandleLike): Promise<boolean> => {
    try {
      const currentPermission = await handle.queryPermission?.({ mode: "readwrite" });
      if (currentPermission === "granted") {
        return true;
      }
    } catch {
      // Ignore and fall back to request.
    }

    try {
      const requestedPermission = await handle.requestPermission?.({ mode: "readwrite" });
      if (requestedPermission === "granted") {
        return true;
      }
    } catch {
      // Ignore and try read-only access.
    }

    try {
      const currentReadPermission = await handle.queryPermission?.();
      if (currentReadPermission === "granted") {
        return true;
      }
      const requestedReadPermission = await handle.requestPermission?.();
      if (requestedReadPermission === "granted") {
        return true;
      }
    } catch {
      // Ignore and deny below.
    }

    return false;
  }, []);

  const pickDirectory = useCallback(async () => {
    const picker = (window as unknown as { showDirectoryPicker?: () => Promise<DirectoryHandleLike> })
      .showDirectoryPicker;
    if (!picker) {
      onError("Directory access is only available in Chromium-based browsers.");
      return;
    }

    try {
      const handle = await picker();
      const hasPermission = await ensureDirectoryPermission(handle);
      if (!hasPermission) {
        onError("Directory permission is required to manage workouts.");
        return;
      }

      setDirectoryHandle(handle);
      await persistWorkoutLibraryDirectoryHandle(handle);
      await refreshDirectory(handle);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      onError("Could not open the selected directory.");
    }
  }, [ensureDirectoryPermission, onError, refreshDirectory]);

  useEffect(() => {
    if (!canUseDirectoryPicker) {
      return;
    }

    let cancelled = false;

    const restoreDirectoryHandle = async () => {
      try {
        const storedHandle = await loadPersistedWorkoutLibraryDirectoryHandle<DirectoryHandleLike>();
        if (!storedHandle || cancelled) {
          return;
        }

        const hasPermission = await ensureDirectoryPermission(storedHandle);
        if (!hasPermission) {
          await clearPersistedWorkoutLibraryDirectoryHandle();
          if (!cancelled) {
            setDirectoryHandle(null);
            setLibraryItems([]);
          }
          return;
        }

        if (cancelled) {
          return;
        }

        setDirectoryHandle(storedHandle);
        await refreshDirectory(storedHandle);
      } catch {
        await clearPersistedWorkoutLibraryDirectoryHandle();
      }
    };

    void restoreDirectoryHandle();

    return () => {
      cancelled = true;
    };
  }, [canUseDirectoryPicker, ensureDirectoryPermission, refreshDirectory]);

  return {
    canUseDirectoryPicker,
    directoryHandle,
    isLoading,
    libraryItems,
    pickDirectory,
    refreshDirectory,
  };
}
