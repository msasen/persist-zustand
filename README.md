# Zustand Persist Store

> ⚠️ **Beta Notice**: This library is currently in beta. It is recommended to evaluate it carefully before using it in production environments.

A persistence-oriented state management utility built on Zustand, supporting multiple storage backends. Store states can be automatically synchronized with the URL, `localStorage`, or `sessionStorage`.

## 🚀 Features

### 🌐 URL Storage — Shareable and Navigable State

The **URL Storage** mechanism allows encoding selected state values into URL query parameters. This enables:

* State preservation when sharing links
* Bookmark compatibility
* Navigation through state changes using browser history controls
* State persistence across page reloads
* Base64 encoding support for large payloads

**Example:**

```typescript
const useFilterStore = createPersistStore(
  'filters',
  { urlKeys: ['category', 'sort', 'page'] },
  (set) => ({
    category: 'all',
    sort: 'price-asc',
    page: 1,
    setCategory: (cat) => set({ category: cat })
  })
)

// URL: ?filters={"category":"electronics","sort":"price-asc","page":2}
```

### ✨ Multiple Storage Backends

* **localStorage**: Persistent across browser sessions
* **sessionStorage**: Valid within the current browser tab
* **Priority System**: Select which storage backend is read first

### 🎯 Selective Key Handling

* Define separate key sets per storage backend
* Only selected parts of the state are persisted
* `undefined` values are automatically excluded

### ⚡ Performance Considerations

* Debouncing reduces excessive writes during rapid state updates
* Cached URL parsing minimizes repeated decoding
* Writes are skipped when values have not actually changed

## 📦 Installation

```bash
npm install persist-zustand
```

**Note:** This package requires `zustand` as a peer dependency. Make sure you have `zustand` installed in your project:

```bash
npm install zustand
```

## 🎓 Quick Start

### Using URL Storage

```typescript
import { createPersistStore } from 'persist-zustand'

const useCounterStore = createPersistStore(
  'counter',
  {
    urlKeys: ['count']
  },
  (set) => ({
    count: 0,
    increment: () => set((s) => ({ count: s.count + 1 })),
    decrement: () => set((s) => ({ count: s.count - 1 }))
  })
)
```

**Capabilities:**

* URL-sharing retains state
* State persists on reload
* Browser navigation restores previous states
* Bookmarks preserve state configuration

## 📚 Detailed Usage Examples

### 1. URL-Based Filter State

```typescript
const useFilterStore = createPersistStore(
  'filters',
  {
    urlKeys: ['category', 'sortBy', 'page']
  },
  (set) => ({
    category: 'all',
    sortBy: 'date',
    page: 1,
    setCategory: (category) => set({ category }),
    setSortBy: (sortBy) => set({ sortBy }),
    setPage: (page) => set({ page })
  })
)
```

### 2. Persistent User Preferences (localStorage)

```typescript
const useUserPreferencesStore = createPersistStore(
  'preferences',
  {
    localKeys: ['theme', 'language', 'notifications']
  },
  (set) => ({
    theme: 'light',
    language: 'tr',
    notifications: true,
    setTheme: (theme) => set({ theme }),
    setLanguage: (language) => set({ language }),
    toggleNotifications: () => 
      set((s) => ({ notifications: !s.notifications }))
  })
)
```

### 3. Session-Based Temporary Data (sessionStorage)

```typescript
const useCartStore = createPersistStore(
  'cart',
  {
    sessionKeys: ['items', 'total']
  },
  (set) => ({
    items: [],
    total: 0,
    addItem: (item) => set((s) => ({
      items: [...s.items, item],
      total: s.total + item.price
    })),
    removeItem: (id) =>
      set((s) => ({
        items: s.items.filter((i) => i.id !== id),
        total: s.items
          .filter((i) => i.id !== id)
          .reduce((sum, i) => sum + i.price, 0)
      }))
  })
)
```

### 4. Combined Storage Strategy

```typescript
const useAppStore = createPersistStore(
  'app',
  {
    urlKeys: ['view', 'filter'],
    localKeys: ['theme', 'settings'],
    sessionKeys: ['tempData']
  },
  (set) => ({
    view: 'grid',
    filter: 'all',
    theme: 'light',
    settings: { fontSize: 14 },
    tempData: null
  })
)
```

### 5. Custom Storage Priority

```typescript
const useDataStore = createPersistStore(
  'data',
  {
    urlKeys: ['value'],
    localKeys: ['value'],
    sessionKeys: ['value']
  },
  (set) => ({ value: 0 }),
  {
    priority: ['local', 'url', 'session']
  }
)
```

### 6. Browser History Integration

```typescript
const useNavigationStore = createPersistStore(
  'nav',
  {
    urlKeys: ['page', 'tab', 'modal']
  },
  (set) => ({
    page: 'home',
    tab: 'overview',
    modal: null,
    setPage: (page) => set({ page }),
    setTab: (tab) => set({ tab }),
    openModal: (modal) => set({ modal })
  }),
  {
    history: ['page', 'tab']
  }
)
```

### 7. Base64 Encoding Support

```typescript
const useLargeDataStore = createPersistStore(
  'largeData',
  { urlKeys: ['data'] },
  (set) => ({
    data: { items: [] },
    setData: (data) => set({ data })
  }),
  {
    base64: {
      enabled: true,
      threshold: 500
    }
  }
)
```

### 8. Debounced Writes

```typescript
const useSearchStore = createPersistStore(
  'search',
  { urlKeys: ['query', 'results'] },
  (set) => ({
    query: '',
    results: [],
    setQuery: (query) => set({ query }),
    setResults: (results) => set({ results })
  }),
  {
    debounceDelay: 300
  }
)
```

### 9. Comprehensive Dashboard Example


```typescript
const useDashboardStore = createPersistStore(
  'dashboard',
  {
    urlKeys: ['viewMode', 'selectedId'],
    localKeys: ['preferences', 'layout'],
    sessionKeys: ['tempFilters', 'draft']
  },
  (set) => ({
    viewMode: 'grid',
    selectedId: null,
    preferences: { theme: 'dark', fontSize: 16 },
    layout: { sidebar: true, columns: 3 },
    tempFilters: {},
    draft: null,
    setViewMode: (mode) => set({ viewMode: mode }),
    setSelectedId: (id) => set({ selectedId: id }),
    updatePreferences: (prefs) =>
      set((s) => ({ preferences: { ...s.preferences, ...prefs } })),
    setTempFilters: (filters) => set({ tempFilters: filters })
  }),
  {
    priority: ['url', 'local', 'session'],
    history: ['viewMode'],
    base64: { enabled: true, threshold: 200 },
    debounceDelay: 150
  }
)
```

## 🔧 API Reference


```typescript
createPersistStore<TFn>(
  name: string,
  keys: {
    urlKeys?: string[],
    localKeys?: string[],
    sessionKeys?: string[]
  },
  initializer?: TFn,
  options?: PersistStoreOptions
)
```

### Options Interface

```typescript
interface PersistStoreOptions {
  priority?: ('url' | 'session' | 'local')[]
  history?: string[]
  base64?: {
    enabled?: boolean
    threshold?: number
  }
  debounceDelay?: number
}
```

## ⚙️ Additional Features

### Store Destruction

```typescript
const store = createPersistStore(/* ... */)

useEffect(() => {
  return () => {
    // @ts-expect-error
    store.destroy()
  }
}, [])
```

### Duplicate Store Name Protection

* Distinct storage types may use the same name.
* Using identical names within the same storage type is disallowed.

### SSR Compatibility

Works safely when `window` is not available.

### Filtering Undefined Values

Undefined values are omitted from persistence operations.

## 🔍 Example Scenarios

* E-commerce filtering via URL state
* User preferences stored in `localStorage`
* Form drafts stored in `sessionStorage`
* Multi-layered dashboard state with mixed backends

## 🤝 Contributing

Standard open-source contribution workflow.

## 📄 License

MIT

## 🙏 Acknowledgements

This library is built on top of Zustand.
