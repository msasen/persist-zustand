import { createPersistStore } from 'persist-zustand'
import { combine } from 'zustand/middleware'

// 1. Quick Start - URL Storage
export const useFilterStore = createPersistStore(
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
      setCategory: (cat: string) => set({ category: cat }),
      setSort: (sort: string) => set({ sort }),
      setPage: (page: number) => set({ page })
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

// 2. Browser History Integration
export const useNavigationStore = createPersistStore(
  'nav',
  {
    urlKeys: ['page', 'tab', 'modal']
  },
  combine(
    {
      page: 'home',
      tab: 'overview',
      modal: null as string | null
    },
    (set) => ({
      setPage: (page: string) => set({ page }),
      setTab: (tab: string) => set({ tab }),
      openModal: (modal: string | null) => set({ modal })
    })
  ),
  {
    history: ['page', 'tab']
  }
)

// 3. Base64 Encoding Support
export const useLargeDataStore = createPersistStore(
  'largeData',
  { urlKeys: ['data'] },
  combine(
    { data: { items: [] as unknown[] } },
    (set) => ({
      setData: (data: { items: unknown[] }) => set({ data })
    })
  ),
  {
    base64: {
      enabled: true,
      threshold: 500
    }
  }
)

// 4. Debounced Writes
export const useSearchStore = createPersistStore(
  'search',
  { urlKeys: ['query', 'results'] },
  combine(
    {
      query: '',
      results: [] as unknown[]
    },
    (set) => ({
      setQuery: (query: string) => set({ query }),
      setResults: (results: unknown[]) => set({ results })
    })
  ),
  {
    debounceDelay: 300
  }
)

// 5. URL-Based Filter State
export const useFilterStore2 = createPersistStore(
  'filters2',
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
      setCategory: (category: string) => set({ category }),
      setSortBy: (sortBy: string) => set({ sortBy }),
      setPage: (page: number) => set({ page })
    })
  )
)

// 6. Persistent User Preferences
export const useUserPreferencesStore = createPersistStore(
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
      setTheme: (theme: string) => set({ theme }),
      setLanguage: (language: string) => set({ language }),
      toggleNotifications: () => 
        set((s) => ({ notifications: !s.notifications }))
    })
  )
)

// 7. Session-Based Temporary Data
export const useCartStore = createPersistStore(
  'cart',
  {
    sessionKeys: ['items', 'total']
  },
  combine(
    {
      items: [] as Array<{ id: string; price: number }>,
      total: 0
    },
    (set) => ({
      addItem: (item: { id: string; price: number }) => set((s) => ({
        items: [...s.items, item],
        total: s.total + item.price
      })),
      removeItem: (id: string) =>
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

// 8. Combined Storage Strategy
export const useAppStore = createPersistStore(
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
      tempData: null as unknown
    },
    (set) => ({})
  )
)

// 9. Custom Storage Priority
export const useDataStore = createPersistStore(
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

