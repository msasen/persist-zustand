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
import { createPersistStore } from 'persist-zustand'
import { combine } from 'zustand/middleware'

const useFilterStore = createPersistStore(
  'filters',
  {
    urlKeys: ['category', 'sort', 'page'], 
    localKeys: ['preferences'], 
    sessionKeys: ['tempData']
  },
  combine(
    {
      category: 'all',
      sort: 'price-asc',
      page: 1,
      preferences: {},
      tempData: null
    },
    (set) => ({
      setCategory: (cat) => set({ category: cat }),
      setSort: (sort) => set({ sort }),
      setPage: (page) => set({ page })
    })
  )
)

// URL: ?filters={"category":"electronics","sort":"price-asc","page":2}
```

### ✨ Priority System

Select which storage backend is read first when the same key exists in multiple storages.

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
import { combine } from 'zustand/middleware'

const useFilterStore = createPersistStore(
  'filters',
  {
    urlKeys: ['category', 'sort', 'page'], // optional
    localKeys: ['preferences'], // optional
    sessionKeys: ['tempData'] // optional
  },
  combine(
    {
      category: 'all',
      sort: 'price-asc',
      page: 1,
      preferences: {},
      tempData: null
    },
    (set) => ({
      setCategory: (cat) => set({ category: cat }),
      setSort: (sort) => set({ sort }),
      setPage: (page) => set({ page })
    })
  ),
  {
    priority: ['url', 'session', 'local'], // optional
    history: ['category', 'page'], // optional
    base64: { // optional
      enabled: false,
      threshold: 100
    },
    debounceDelay: 100 // optional
  }
)

// URL: ?filters={"category":"electronics","sort":"price-asc","page":2}
```

**Capabilities:**

* URL-sharing retains state
* State persists on reload
* Browser navigation restores previous states
* Bookmarks preserve state configuration

## 📚 Usage Examples

### 1. Browser History Integration

Enables browser back/forward button navigation through state changes. When specified keys change, a new history entry is created.

```typescript
import { createPersistStore } from 'persist-zustand'
import { combine } from 'zustand/middleware'

const useNavigationStore = createPersistStore(
  'nav',
  {
    urlKeys: ['page', 'tab', 'modal']
  },
  combine(
    {
      page: 'home',
      tab: 'overview',
      modal: null
    },
    (set) => ({
      setPage: (page) => set({ page }),
      setTab: (tab) => set({ tab }),
      openModal: (modal) => set({ modal })
    })
  ),
  {
    history: ['page', 'tab']
  }
)
```

### 2. Base64 Encoding Support

Automatically encodes large data payloads to Base64 when they exceed the threshold, reducing URL length for better browser compatibility.

```typescript
import { createPersistStore } from 'persist-zustand'
import { combine } from 'zustand/middleware'

const useLargeDataStore = createPersistStore(
  'largeData',
  { urlKeys: ['data'] },
  combine(
    { data: { items: [] } },
    (set) => ({
      setData: (data) => set({ data })
    })
  ),
  {
    base64: {
      enabled: true,
      threshold: 500
    }
  }
)
```

### 3. Debounced Writes

Delays storage writes until state changes stop, reducing excessive writes during rapid updates and improving performance.

```typescript
import { createPersistStore } from 'persist-zustand'
import { combine } from 'zustand/middleware'

const useSearchStore = createPersistStore(
  'search',
  { urlKeys: ['query', 'results'] },
  combine(
    {
      query: '',
      results: []
    },
    (set) => ({
      setQuery: (query) => set({ query }),
      setResults: (results) => set({ results })
    })
  ),
  {
    debounceDelay: 300
  }
)
```

### 4. URL-Based Filter State

Stores filter state in URL query parameters, enabling shareable links and bookmark support for filtered views.

```typescript
import { createPersistStore } from 'persist-zustand'
import { combine } from 'zustand/middleware'

const useFilterStore = createPersistStore(
  'filters',
  {
    urlKeys: ['category', 'sortBy', 'page']
  },
  combine(
    {
      category: 'all',
      sortBy: 'date',
      page: 1
    },
    (set) => ({
      setCategory: (category) => set({ category }),
      setSortBy: (sortBy) => set({ sortBy }),
      setPage: (page) => set({ page })
    })
  )
)
```

### 5. Persistent User Preferences

Stores user preferences that persist across browser sessions, ideal for theme, language, and notification settings.

```typescript
import { createPersistStore } from 'persist-zustand'
import { combine } from 'zustand/middleware'

const useUserPreferencesStore = createPersistStore(
  'preferences',
  {
    localKeys: ['theme', 'language', 'notifications']
  },
  combine(
    {
      theme: 'light',
      language: 'tr',
      notifications: true
    },
    (set) => ({
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleNotifications: () => 
        set((s) => ({ notifications: !s.notifications }))
    })
  )
)
```

### 6. Session-Based Temporary Data

Stores temporary data that persists only within the current browser tab session, perfect for shopping carts and form drafts.

```typescript
import { createPersistStore } from 'persist-zustand'
import { combine } from 'zustand/middleware'

const useCartStore = createPersistStore(
  'cart',
  {
    sessionKeys: ['items', 'total']
  },
  combine(
    {
      items: [],
      total: 0
    },
    (set) => ({
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
)
```

### 7. Combined Storage Strategy

Uses multiple storage backends simultaneously, storing different parts of state in URL, localStorage, and sessionStorage based on their persistence needs.

```typescript
import { createPersistStore } from 'persist-zustand'
import { combine } from 'zustand/middleware'

const useAppStore = createPersistStore(
  'app',
  {
    urlKeys: ['view', 'filter'],
    localKeys: ['theme', 'settings'],
    sessionKeys: ['tempData']
  },
  combine(
    {
      view: 'grid',
      filter: 'all',
      theme: 'light',
      settings: { fontSize: 14 },
      tempData: null
    },
    (set) => ({})
  )
)
```

### 8. Custom Storage Priority

Defines the order in which storage backends are checked when the same key exists in multiple storages, allowing fine-grained control over data precedence.

```typescript
import { createPersistStore } from 'persist-zustand'
import { combine } from 'zustand/middleware'

const useDataStore = createPersistStore(
  'data',
  {
    urlKeys: ['value'],
    localKeys: ['value'],
    sessionKeys: ['value']
  },
  combine({ value: 0 }, (set) => ({})),
  {
    priority: ['local', 'url', 'session']
  }
)
```

## 🔧 API Reference


```typescript
createPersistStore<TFn>(
  name: string,
  keys: {
    urlKeys?: string[], // optional
    localKeys?: string[], // optional
    sessionKeys?: string[] // optional
  },
  initializer?: TFn, // optional
  options?: PersistStoreOptions // optional
)
```

### Options Interface

```typescript
interface PersistStoreOptions {
  priority?: ('url' | 'session' | 'local')[] // optional
  history?: string[] // optional
  base64?: { // optional
    enabled?: boolean
    threshold?: number
  }
  debounceDelay?: number // optional
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
