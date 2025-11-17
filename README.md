# Zustand Persist Store

> ⚠️ **Beta Notice**: This library is currently in beta. You should carefully evaluate it before using it in production environments.

A persistence-focused state management utility built on top of Zustand, with support for multiple storage backends. Store state can be automatically synchronized with the URL, `localStorage`, and `sessionStorage`.

## 🚀 Features

### 🌐 URL Storage — Shareable and Navigable State

The **URL Storage** mechanism encodes selected parts of the state into URL query parameters. This enables:

* State preservation when sharing links
* Bookmark-friendly URLs
* Navigating through state changes using browser back/forward buttons
* State persistence across page reloads
* Base64 encoding support for special characters and larger payloads

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

Choose which storage backend is read first when the same key exists in multiple storages.

### 🎯 Selective Key Handling

* Define separate key sets per storage backend
* Persist only selected parts of the state
* Automatically exclude `undefined` values

### ⚡ Performance Considerations

* Debouncing reduces excessive writes during rapid state changes
* Cached URL parsing minimizes repeated decoding overhead
* Writes are skipped when values have not actually changed

## 📦 Installation

```bash
npm install persist-zustand
```

> **Note:** This package requires `zustand` as a peer dependency. Make sure you have `zustand` installed in your project:

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

* Sharing the URL preserves state
* State persists across page reloads
* Browser navigation restores previous states
* Bookmarks preserve the current configuration

## 📚 Usage Examples

### 1. Browser History Integration

Enable browser back/forward navigation through state changes. When specified keys change, a new history entry is created.

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

**Explanation:**
The `history: ['page', 'tab']` option specifies that only changes to the `page` and `tab` keys create browser history entries. Changes to `modal` still update the URL but do not push a new history entry. This allows users to navigate back and forward through page/tab changes while handling modal state more transiently.

### 2. Base64 Encoding Support

Automatically encodes data payloads to Base64 when they exceed a given threshold. This is useful for dealing with special characters and large objects in URLs.

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

**Explanation:**
The `base64: { enabled: true, threshold: 500 }` option enables Base64 encoding when the serialized data length exceeds 500 characters. When encoding is applied, the URL also includes a `largeData_encoded=1` flag to indicate that the payload is Base64-encoded. This improves robustness for special characters and complex data structures, at the cost of increasing URL length.

### 3. Debounced Writes

Delay writes to storage until state changes settle, reducing excessive writes during bursts of updates.

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

**Explanation:**
The `debounceDelay: 300` option sets a 300ms debounce window before persisting state. If state changes keep occurring within that window (e.g., while the user is typing), only the final state is written. This improves performance and reduces unnecessary storage operations.

### 4. URL-Based Filter State

Store filter state in URL query parameters to make filtered views easily shareable and bookmarkable.

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

**Explanation:**
The `urlKeys: ['category', 'sortBy', 'page']` option ensures that only these keys are stored in the URL. Whenever they change, the URL is updated automatically. This makes filtered configurations easy to share and bookmark, without leaking internal or unrelated state.

### 5. Persistent User Preferences

Store user preferences that should persist across browser sessions—such as theme, language, and notification settings.

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

**Explanation:**
The `localKeys: ['theme', 'language', 'notifications']` option persists these values in `localStorage`, which survives browser restarts. When the user revisits the app, their preferences are restored automatically.

### 6. Session-Based Temporary Data

Store temporary data that should live only for the lifetime of the current browser tab session—ideal for things like carts or form drafts.

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
        set((s) => {
          const remaining = s.items.filter((i) => i.id !== id)
          return {
            items: remaining,
            total: remaining.reduce((sum, i) => sum + i.price, 0)
          }
        })
    })
  )
)
```

**Explanation:**
The `sessionKeys: ['items', 'total']` option stores cart contents in `sessionStorage`. Data persists while the tab remains open, but is cleared when the tab is closed—fitting for ephemeral state.

### 7. Combined Storage Strategy

Use multiple storage backends at once, assigning different parts of the state to URL, `localStorage`, and `sessionStorage`.

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

**Explanation:**
This setup uses all three storage mechanisms:

* `urlKeys: ['view', 'filter']` — View and filter state are shareable/bookmarkable via URL
* `localKeys: ['theme', 'settings']` — Long-lived UI preferences live in `localStorage`
* `sessionKeys: ['tempData']` — Short-lived, tab-scoped data lives in `sessionStorage`

Each key is persisted to the most appropriate backend.

### 8. Custom Storage Priority

Control the lookup order when the same key exists in multiple backends.

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

**Explanation:**
The `priority: ['local', 'url', 'session']` option defines the read order for overlapping keys. In this example:

1. Try `localStorage`
2. Fallback to URL
3. Fallback to `sessionStorage`

If no `priority` is provided, the default order is `['url', 'session', 'local']`.

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

* Different storage types may reuse the same `name`.
* Using the same `name` more than once **within the same storage type** is not allowed.


### Filtering Undefined Values

`undefined` values are filtered out and are not persisted to any storage backend.

## 🔍 Example Scenarios

* E-commerce filtering via URL state
* User preferences persisted in `localStorage`
* Form drafts stored in `sessionStorage`
* Complex dashboards using mixed persistence backends

## 🤝 Contributing

Contributions are welcome. Please use a standard open-source workflow (fork the repository, create a feature branch, and open a pull request).

## 📄 License

MIT

## 🙏 Acknowledgements

This library is built on top of Zustand.

