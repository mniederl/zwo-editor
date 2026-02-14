const DB_NAME = "zwo-editor-persistence";
const STORE_NAME = "editor";
const DIRECTORY_HANDLE_KEY = "workoutLibrary.directoryHandle";

interface PersistedValueRecord {
  key: string;
  value: unknown;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);

    request.onerror = () => {
      reject(request.error || new Error("Unable to open persistence database"));
    };

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function runTransaction<T>(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);

    request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
    request.onsuccess = () => resolve(request.result);
  });
}

export async function persistWorkoutLibraryDirectoryHandle(handle: unknown): Promise<void> {
  const database = await openDatabase();
  try {
    await runTransaction(database, "readwrite", (store) =>
      store.put({
        key: DIRECTORY_HANDLE_KEY,
        value: handle,
      } satisfies PersistedValueRecord),
    );
  } finally {
    database.close();
  }
}

export async function loadPersistedWorkoutLibraryDirectoryHandle<T>(): Promise<T | null> {
  const database = await openDatabase();
  try {
    const record = await runTransaction<unknown>(database, "readonly", (store) => store.get(DIRECTORY_HANDLE_KEY));
    if (!record || typeof record !== "object" || !("value" in (record as Record<string, unknown>))) {
      return null;
    }
    return (record as { value: T }).value;
  } finally {
    database.close();
  }
}

export async function clearPersistedWorkoutLibraryDirectoryHandle(): Promise<void> {
  const database = await openDatabase();
  try {
    await runTransaction(database, "readwrite", (store) => store.delete(DIRECTORY_HANDLE_KEY));
  } finally {
    database.close();
  }
}
