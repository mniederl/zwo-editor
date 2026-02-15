import type { SegmentType } from "@/domain/workout/types";

export interface FileWritableLike {
  close: () => Promise<void>;
  write: (data: string | Blob) => Promise<void>;
}

export interface FileHandleLike {
  kind: string;
  name: string;
  getFile: () => Promise<File>;
  createWritable?: () => Promise<FileWritableLike>;
}

export interface DirectoryHandleLike {
  name: string;
  entries: () => AsyncIterableIterator<[string, FileHandleLike]>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileHandleLike>;
  removeEntry: (name: string) => Promise<void>;
  queryPermission?: (options?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (options?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
}

export interface LibraryWorkoutItem {
  author: string;
  fileName: string;
  handle: FileHandleLike;
  id: string;
  name: string;
  segments: SegmentType[];
  stressScore: number;
  workoutTime: string;
}

export interface PreviewBlock {
  background: string;
  height: number;
  widthWeight: number;
}
