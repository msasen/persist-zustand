import type { StateCreator, StoreApi } from 'zustand/vanilla';
import type { UseBoundStore } from 'zustand/react';
export type StorageType = 'url' | 'session' | 'local';
export interface PersistStoreOptions {
    priority?: StorageType[];
    history?: string[];
    base64?: {
        enabled?: boolean;
        threshold?: number;
    };
    debounceDelay?: number;
}
export declare const createPersistStore: <T>(name: string, keys: {
    urlKeys?: string[];
    localKeys?: string[];
    sessionKeys?: string[];
}, initializer?: StateCreator<T, [], []>, options?: PersistStoreOptions) => UseBoundStore<StoreApi<T>>;
//# sourceMappingURL=index.d.ts.map