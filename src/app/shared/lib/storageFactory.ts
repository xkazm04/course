"use client";

/**
 * Storage Factory - Creates typed localStorage modules with SSR safety and consistent error handling
 *
 * This factory generates storage modules with:
 * - SSR safety (no window access on server)
 * - Consistent error handling
 * - JSON serialization/deserialization
 * - Type safety via generics
 * - Optional version migration support
 */

export interface StorageConfig<T> {
    /** The localStorage key to use */
    storageKey: string;
    /** Function that returns the default data when storage is empty or on SSR */
    getDefault: () => T;
    /** Optional version for data migration */
    version?: string;
    /** Optional migration function when version changes */
    migrate?: (oldData: unknown, oldVersion: string | undefined) => T;
}

export interface StorageModule<T> {
    /** Get the current data from storage */
    get: () => T;
    /** Save data to storage */
    save: (data: T) => void;
    /** Clear the storage */
    clear: () => void;
    /** Update data using a callback (read-modify-write pattern) */
    update: (updater: (current: T) => T) => T;
    /** Check if storage has data */
    exists: () => boolean;
    /** Get the storage key */
    getKey: () => string;
}

export interface EntityStorageConfig<T, TEntity> extends StorageConfig<T> {
    /** Property path to the entity collection (e.g., 'items' or 'courses') */
    collectionKey: keyof T;
    /** Function to generate unique ID for new entities */
    generateId?: () => string;
}

export interface EntityStorageModule<T, TEntity extends { id: string }> extends StorageModule<T> {
    /** Get all entities */
    getAll: () => TEntity[];
    /** Get entity by ID */
    getById: (id: string) => TEntity | null;
    /** Add a new entity */
    add: (entity: Omit<TEntity, "id"> & { id?: string }) => TEntity;
    /** Update an existing entity */
    updateEntity: (id: string, updates: Partial<Omit<TEntity, "id">>) => TEntity | null;
    /** Delete an entity by ID */
    delete: (id: string) => boolean;
}

/**
 * Generate a unique ID using timestamp and random string
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
    return typeof window !== "undefined";
}

/**
 * Create a basic typed localStorage module
 */
export function createLocalStorage<T>(config: StorageConfig<T>): StorageModule<T> {
    const { storageKey, getDefault, version, migrate } = config;

    const get = (): T => {
        if (!isBrowser()) return getDefault();

        try {
            const stored = localStorage.getItem(storageKey);
            if (!stored) return getDefault();

            const parsed = JSON.parse(stored);

            // Handle version migration
            if (version && migrate) {
                const storedVersion = parsed?._version;
                if (storedVersion !== version) {
                    const migrated = migrate(parsed, storedVersion);
                    save({ ...migrated, _version: version } as T);
                    return migrated;
                }
            }

            return parsed as T;
        } catch {
            return getDefault();
        }
    };

    const save = (data: T): void => {
        if (!isBrowser()) return;

        try {
            const toStore = version ? { ...data, _version: version } : data;
            localStorage.setItem(storageKey, JSON.stringify(toStore));
        } catch (error) {
            console.error(`Failed to save to ${storageKey}:`, error);
        }
    };

    const clear = (): void => {
        if (!isBrowser()) return;
        localStorage.removeItem(storageKey);
    };

    const update = (updater: (current: T) => T): T => {
        const current = get();
        const updated = updater(current);
        save(updated);
        return updated;
    };

    const exists = (): boolean => {
        if (!isBrowser()) return false;
        return localStorage.getItem(storageKey) !== null;
    };

    const getKey = (): string => storageKey;

    return { get, save, clear, update, exists, getKey };
}

/**
 * Create a storage module for array-based entity collections
 */
export function createArrayStorage<TEntity extends { id: string }>(config: {
    storageKey: string;
    generateId?: () => string;
}): EntityStorageModule<TEntity[], TEntity> {
    const { storageKey, generateId: customGenerateId = generateId } = config;

    const baseStorage = createLocalStorage<TEntity[]>({
        storageKey,
        getDefault: () => [],
    });

    const getAll = (): TEntity[] => baseStorage.get();

    const getById = (id: string): TEntity | null => {
        const entities = getAll();
        return entities.find((e) => e.id === id) || null;
    };

    const add = (entity: Omit<TEntity, "id"> & { id?: string }): TEntity => {
        const newEntity = {
            ...entity,
            id: entity.id || customGenerateId(),
        } as TEntity;

        baseStorage.update((current) => [newEntity, ...current]);
        return newEntity;
    };

    const updateEntity = (id: string, updates: Partial<Omit<TEntity, "id">>): TEntity | null => {
        let updatedEntity: TEntity | null = null;

        baseStorage.update((current) => {
            const index = current.findIndex((e) => e.id === id);
            if (index === -1) return current;

            updatedEntity = { ...current[index], ...updates } as TEntity;
            const newArray = [...current];
            newArray[index] = updatedEntity;
            return newArray;
        });

        return updatedEntity;
    };

    const deleteEntity = (id: string): boolean => {
        const current = getAll();
        const filtered = current.filter((e) => e.id !== id);
        if (filtered.length === current.length) return false;
        baseStorage.save(filtered);
        return true;
    };

    return {
        ...baseStorage,
        getAll,
        getById,
        add,
        updateEntity,
        delete: deleteEntity,
    };
}

/**
 * Create a storage module for record-based entity collections (keyed by ID)
 */
export function createRecordStorage<TEntity>(config: {
    storageKey: string;
    getDefault?: () => Record<string, TEntity>;
    generateId?: () => string;
}): {
    get: () => Record<string, TEntity>;
    save: (data: Record<string, TEntity>) => void;
    clear: () => void;
    getAll: () => TEntity[];
    getById: (id: string) => TEntity | null;
    set: (id: string, entity: TEntity) => void;
    update: (id: string, updater: (current: TEntity) => TEntity) => TEntity | null;
    delete: (id: string) => boolean;
    exists: () => boolean;
    getKey: () => string;
} {
    const { storageKey, getDefault = () => ({}), generateId: customGenerateId = generateId } = config;

    const baseStorage = createLocalStorage<Record<string, TEntity>>({
        storageKey,
        getDefault,
    });

    const getAll = (): TEntity[] => Object.values(baseStorage.get());

    const getById = (id: string): TEntity | null => {
        const entities = baseStorage.get();
        return entities[id] || null;
    };

    const set = (id: string, entity: TEntity): void => {
        baseStorage.update((current) => ({
            ...current,
            [id]: entity,
        }));
    };

    const updateRecord = (id: string, updater: (current: TEntity) => TEntity): TEntity | null => {
        const current = getById(id);
        if (!current) return null;

        const updated = updater(current);
        set(id, updated);
        return updated;
    };

    const deleteRecord = (id: string): boolean => {
        const current = baseStorage.get();
        if (!(id in current)) return false;

        const { [id]: _, ...rest } = current;
        baseStorage.save(rest);
        return true;
    };

    return {
        get: baseStorage.get,
        save: baseStorage.save,
        clear: baseStorage.clear,
        getAll,
        getById,
        set,
        update: updateRecord,
        delete: deleteRecord,
        exists: baseStorage.exists,
        getKey: baseStorage.getKey,
    };
}

/**
 * Create a storage module with timestamp tracking
 */
export function createTimestampedStorage<T extends { lastUpdated?: string }>(config: {
    storageKey: string;
    getDefault: () => T;
    version?: string;
    migrate?: (oldData: unknown, oldVersion: string | undefined) => T;
}): StorageModule<T> & { getLastUpdated: () => string | null } {
    const baseStorage = createLocalStorage<T>(config);

    const save = (data: T): void => {
        baseStorage.save({
            ...data,
            lastUpdated: new Date().toISOString(),
        });
    };

    const update = (updater: (current: T) => T): T => {
        const current = baseStorage.get();
        const updated = {
            ...updater(current),
            lastUpdated: new Date().toISOString(),
        };
        baseStorage.save(updated);
        return updated;
    };

    const getLastUpdated = (): string | null => {
        const data = baseStorage.get();
        return data.lastUpdated || null;
    };

    return {
        ...baseStorage,
        save,
        update,
        getLastUpdated,
    };
}

/**
 * Create a preferences storage with SSR-safe defaults
 */
export function createPreferencesStorage<T>(config: {
    storageKey: string;
    defaults: T;
}): {
    get: () => T;
    set: <K extends keyof T>(key: K, value: T[K]) => void;
    setAll: (prefs: Partial<T>) => void;
    reset: () => void;
    getKey: () => string;
} {
    const baseStorage = createLocalStorage<T>({
        storageKey: config.storageKey,
        getDefault: () => config.defaults,
    });

    const set = <K extends keyof T>(key: K, value: T[K]): void => {
        baseStorage.update((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const setAll = (prefs: Partial<T>): void => {
        baseStorage.update((current) => ({
            ...current,
            ...prefs,
        }));
    };

    const reset = (): void => {
        baseStorage.save(config.defaults);
    };

    return {
        get: baseStorage.get,
        set,
        setAll,
        reset,
        getKey: baseStorage.getKey,
    };
}
