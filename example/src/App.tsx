import { useEffect, useState } from 'react'
import {
  useFilterStore,
  useNavigationStore,
  useLargeDataStore,
  useSearchStore,
  useFilterStore2,
  useUserPreferencesStore,
  useCartStore,
  useAppStore,
  useDataStore
} from './stores'

// Helper function to decode URL param value
const decodeUrlParam = (value: string, isEncoded: boolean): { raw: string; decoded: string; isJson: boolean } => {
  try {
    let decoded = value
    if (isEncoded) {
      decoded = atob(value)
    }
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(decoded)
      return {
        raw: value,
        decoded: JSON.stringify(parsed, null, 2),
        isJson: true
      }
    } catch {
      return {
        raw: value,
        decoded: decoded,
        isJson: false
      }
    }
  } catch {
    return {
      raw: value,
      decoded: value,
      isJson: false
    }
  }
}

// Helper function to get URL params for a store
const getUrlParams = (storeName: string): { url: string; decoded?: { raw: string; decoded: string; isJson: boolean } } => {
  if (typeof window === 'undefined') return { url: '' }
  const params = new URLSearchParams(window.location.search)
  const value = params.get(storeName)
  if (!value) return { url: '' }
  const baseUrl = window.location.origin + window.location.pathname
  const newParams = new URLSearchParams()
  newParams.set(storeName, value)
  const encoded = params.get(`${storeName}_encoded`)
  if (encoded) newParams.set(`${storeName}_encoded`, encoded)
  
  const decoded = decodeUrlParam(value, encoded === '1')
  
  return {
    url: `${baseUrl}?${newParams.toString()}`,
    decoded
  }
}

// Helper function to get localStorage value
const getLocalStorageValue = (storeName: string): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(storeName)
  } catch {
    return null
  }
}

// Helper function to get sessionStorage value
const getSessionStorageValue = (storeName: string): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem(storeName)
  } catch {
    return null
  }
}


function App() {
  const [urlParams, setUrlParams] = useState<Record<string, { url: string; decoded?: { raw: string; decoded: string; isJson: boolean } }>>({})
  const [localStorageValues, setLocalStorageValues] = useState<Record<string, string | null>>({})
  const [sessionStorageValues, setSessionStorageValues] = useState<Record<string, string | null>>({})

  useEffect(() => {
    const updateStorageInfo = () => {
      const stores = [
        'filters',
        'nav',
        'largeData',
        'search',
        'filters2',
        'preferences',
        'cart',
        'app',
        'data'
      ]
      
      const url: Record<string, { url: string; decoded?: { raw: string; decoded: string; isJson: boolean } }> = {}
      const local: Record<string, string | null> = {}
      const session: Record<string, string | null> = {}
      
      stores.forEach(store => {
        url[store] = getUrlParams(store)
        local[store] = getLocalStorageValue(store)
        session[store] = getSessionStorageValue(store)
      })
      
      setUrlParams(url)
      setLocalStorageValues(local)
      setSessionStorageValues(session)
    }

    updateStorageInfo()
    const interval = setInterval(updateStorageInfo, 500)
    
    window.addEventListener('storage', updateStorageInfo)
    window.addEventListener('popstate', updateStorageInfo)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', updateStorageInfo)
      window.removeEventListener('popstate', updateStorageInfo)
    }
  }, [])
  // 1. Quick Start - URL Storage
  const { category, sort, page, setCategory, setSort, setPage } = useFilterStore()

  // 2. Browser History Integration
  const { page: navPage, tab, modal, setPage: setNavPage, setTab, openModal } = useNavigationStore()

  // 3. Base64 Encoding Support
  const { data, setData } = useLargeDataStore()

  // 4. Debounced Writes
  const { query, setQuery } = useSearchStore()

  // 5. URL-Based Filter State
  const { category: category2, sortBy, page: page2, setCategory: setCategory2, setSortBy, setPage: setPage2 } = useFilterStore2()

  // 6. Persistent User Preferences
  const { theme, language, notifications, setTheme, setLanguage, toggleNotifications } = useUserPreferencesStore()

  // 7. Session-Based Temporary Data
  const { items, total, addItem, removeItem } = useCartStore()

  // 8. Combined Storage Strategy
  const { view, filter, theme: appTheme, settings, tempData } = useAppStore()

  // 9. Custom Storage Priority
  const { value } = useDataStore()

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', backgroundColor: '#ffffff', color: '#000000' }}>
      {/* Clear Buttons - Top Right */}
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button
          onClick={() => {
            alert('Clearing all URL parameters...')
            if (confirm('Are you sure you want to clear all URL parameters?')) {
              window.history.replaceState(null, '', window.location.pathname)
              window.location.reload()
            }
          }}
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: '#ff4444', color: 'white' }}
        >
          Clear URL
        </button>
        <button
          onClick={() => {
            alert('Clearing all localStorage values...')
            if (confirm('Are you sure you want to clear all localStorage values?')) {
              localStorage.clear()
              window.location.reload()
            }
          }}
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: '#ff8844', color: 'white' }}
        >
          Clear localStorage
        </button>
        <button
          onClick={() => {
            alert('Clearing all sessionStorage values...')
            if (confirm('Are you sure you want to clear all sessionStorage values?')) {
              sessionStorage.clear()
              window.location.reload()
            }
          }}
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: '#ffaa44', color: 'white' }}
        >
          Clear sessionStorage
        </button>
        <button
          onClick={() => {
            alert('Clearing all storage values (URL, localStorage, and sessionStorage)...')
            if (confirm('Are you sure you want to clear all storage values?')) {
              localStorage.clear()
              sessionStorage.clear()
              window.history.replaceState(null, '', window.location.pathname)
              window.location.reload()
            }
          }}
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: '#cc0000', color: 'white', fontWeight: 'bold' }}
        >
          Clear All
        </button>
      </div>

      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#000000' }}>Persist Zustand Examples</h1>

      {/* 1. Quick Start - URL Storage */}
      <section style={{ marginBottom: '3rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#ffffff', color: '#000000' }}>
        <h2 style={{ color: '#000000' }}>1. Quick Start - URL Storage</h2>
        <p style={{ color: '#000000' }}>State persists in URL, localStorage, and sessionStorage</p>
        <div style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Category: </label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
            </select>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Sort: </label>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="price-asc">Price Ascending</option>
              <option value="price-desc">Price Descending</option>
            </select>
          </div>
          <div>
            <label>Page: </label>
            <button onClick={() => setPage(page - 1)}>-</button>
            <span style={{ margin: '0 1rem' }}>{page}</span>
            <button onClick={() => setPage(page + 1)}>+</button>
          </div>
        </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem', color: '#000000' }}>
          <div><strong>URL:</strong> {urlParams.filters?.url ? <a href={urlParams.filters.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', wordBreak: 'break-all', textDecoration: 'underline', fontWeight: 'bold' }}>{urlParams.filters.url}</a> : <span style={{ color: '#000000' }}>None</span>}</div>
          {urlParams.filters?.decoded && (
            <div style={{ marginTop: '0.5rem' }}>
              <div><strong>Decoded {urlParams.filters.decoded.isJson ? 'JSON' : 'Value'}:</strong></div>
              <pre style={{ marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px', color: '#000000' }}>{urlParams.filters.decoded.decoded}</pre>
            </div>
          )}
          {localStorageValues.filters && (
            <div style={{ marginTop: '0.5rem' }}><strong>localStorage:</strong> {localStorageValues.filters}</div>
          )}
          {sessionStorageValues.filters && (
            <div style={{ marginTop: '0.5rem' }}><strong>sessionStorage:</strong> {sessionStorageValues.filters}</div>
          )}
        </div>
      </section>

      {/* 2. Browser History Integration */}
      <section style={{ marginBottom: '3rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#ffffff', color: '#000000' }}>
        <h2 style={{ color: '#000000' }}>2. Browser History Integration</h2>
        <p style={{ color: '#000000' }}>Navigate back/forward through page and tab changes</p>
        <div style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <button onClick={() => setNavPage('home')} style={{ marginRight: '0.5rem' }}>Home</button>
            <button onClick={() => setNavPage('about')} style={{ marginRight: '0.5rem' }}>About</button>
            <button onClick={() => setNavPage('contact')}>Contact</button>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <button onClick={() => setTab('overview')} style={{ marginRight: '0.5rem' }}>Overview</button>
            <button onClick={() => setTab('details')} style={{ marginRight: '0.5rem' }}>Details</button>
            <button onClick={() => setTab('settings')}>Settings</button>
          </div>
          <div>
            <button onClick={() => openModal(modal ? null : 'example-modal')}>
              {modal ? 'Close Modal' : 'Open Modal'}
            </button>
          </div>
          <p style={{ marginTop: '1rem' }}>Current: Page={navPage}, Tab={tab}, Modal={modal || 'none'}</p>
        </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem', color: '#000000' }}>
          <div><strong>URL:</strong> {urlParams.nav?.url ? <a href={urlParams.nav.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', wordBreak: 'break-all', textDecoration: 'underline', fontWeight: 'bold' }}>{urlParams.nav.url}</a> : <span style={{ color: '#666' }}>None</span>}</div>
          {urlParams.nav?.decoded && (
            <div style={{ marginTop: '0.5rem' }}>
              <div><strong>Decoded {urlParams.nav.decoded.isJson ? 'JSON' : 'Value'}:</strong></div>
              <pre style={{ marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px', color: '#000000' }}>{urlParams.nav.decoded.decoded}</pre>
            </div>
          )}
        </div>
      </section>

      {/* 3. Base64 Encoding Support */}
      <section style={{ marginBottom: '3rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#ffffff', color: '#000000' }}>
        <h2 style={{ color: '#000000' }}>3. Base64 Encoding Support</h2>
        <p style={{ color: '#000000' }}>Large data automatically encoded to Base64 when threshold exceeded</p>
        <div style={{ marginTop: '1rem' }}>
          <button onClick={() => setData({ items: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` })) })}>
            Set Large Data
          </button>
          <p style={{ marginTop: '0.5rem' }}>Items count: {data.items.length}</p>
        </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem', color: '#000000' }}>
          <div><strong>URL:</strong> {urlParams.largeData?.url ? <a href={urlParams.largeData.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', wordBreak: 'break-all', textDecoration: 'underline', fontWeight: 'bold' }}>{urlParams.largeData.url}</a> : <span style={{ color: '#666' }}>None</span>}</div>
          {urlParams.largeData?.decoded && (
            <div style={{ marginTop: '0.5rem' }}>
              <div><strong>Decoded {urlParams.largeData.decoded.isJson ? 'JSON' : 'Value'}:</strong></div>
              <pre style={{ marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px', color: '#000000' }}>{urlParams.largeData.decoded.decoded}</pre>
            </div>
          )}
        </div>
      </section>

      {/* 4. Debounced Writes */}
      <section style={{ marginBottom: '3rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#ffffff', color: '#000000' }}>
        <h2 style={{ color: '#000000' }}>4. Debounced Writes</h2>
        <p style={{ color: '#000000' }}>Writes are debounced (300ms delay) to reduce excessive storage operations</p>
        <div style={{ marginTop: '1rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to see debounced writes..."
            style={{ padding: '0.5rem', width: '300px' }}
          />
          <p style={{ marginTop: '0.5rem' }}>Query: {query}</p>
        </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem', color: '#000000' }}>
          <div><strong>URL:</strong> {urlParams.search?.url ? <a href={urlParams.search.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', wordBreak: 'break-all', textDecoration: 'underline', fontWeight: 'bold' }}>{urlParams.search.url}</a> : <span style={{ color: '#666' }}>None</span>}</div>
          {urlParams.search?.decoded && (
            <div style={{ marginTop: '0.5rem' }}>
              <div><strong>Decoded {urlParams.search.decoded.isJson ? 'JSON' : 'Value'}:</strong></div>
              <pre style={{ marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px', color: '#000000' }}>{urlParams.search.decoded.decoded}</pre>
            </div>
          )}
        </div>
      </section>

      {/* 5. URL-Based Filter State */}
      <section style={{ marginBottom: '3rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#ffffff', color: '#000000' }}>
        <h2 style={{ color: '#000000' }}>5. URL-Based Filter State</h2>
        <p style={{ color: '#000000' }}>Filter state stored in URL for easy sharing and bookmarking</p>
        <div style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Category: </label>
            <select value={category2} onChange={(e) => setCategory2(e.target.value)}>
              <option value="all">All</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
            </select>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Sort By: </label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">Date</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div>
            <label>Page: </label>
            <button onClick={() => setPage2(page2 - 1)}>-</button>
            <span style={{ margin: '0 1rem' }}>{page2}</span>
            <button onClick={() => setPage2(page2 + 1)}>+</button>
          </div>
        </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem', color: '#000000' }}>
          <div><strong>URL:</strong> {urlParams.filters2?.url ? <a href={urlParams.filters2.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', wordBreak: 'break-all', textDecoration: 'underline', fontWeight: 'bold' }}>{urlParams.filters2.url}</a> : <span style={{ color: '#666' }}>None</span>}</div>
          {urlParams.filters2?.decoded && (
            <div style={{ marginTop: '0.5rem' }}>
              <div><strong>Decoded {urlParams.filters2.decoded.isJson ? 'JSON' : 'Value'}:</strong></div>
              <pre style={{ marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px', color: '#000000' }}>{urlParams.filters2.decoded.decoded}</pre>
            </div>
          )}
        </div>
      </section>

      {/* 6. Persistent User Preferences */}
      <section style={{ marginBottom: '3rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#ffffff', color: '#000000' }}>
        <h2 style={{ color: '#000000' }}>6. Persistent User Preferences</h2>
        <p style={{ color: '#000000' }}>Preferences persist in localStorage across browser sessions</p>
        <div style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Theme: </label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Language: </label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="tr">Turkish</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={notifications}
                onChange={toggleNotifications}
                style={{ marginRight: '0.5rem' }}
              />
              Notifications: {notifications ? 'Enabled' : 'Disabled'}
            </label>
          </div>
        </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem', color: '#000000' }}>
          {localStorageValues.preferences && (
            <div><strong>localStorage:</strong> {localStorageValues.preferences}</div>
          )}
        </div>
      </section>

      {/* 7. Session-Based Temporary Data */}
      <section style={{ marginBottom: '3rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#ffffff', color: '#000000' }}>
        <h2 style={{ color: '#000000' }}>7. Session-Based Temporary Data</h2>
        <p style={{ color: '#000000' }}>Cart data persists in sessionStorage (cleared when tab closes)</p>
        <div style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={() => addItem({ id: Date.now().toString(), price: Math.floor(Math.random() * 100) + 10 })}
              style={{ marginRight: '0.5rem' }}
            >
              Add Item
            </button>
            <span>Total: ${total}</span>
          </div>
          <div>
            <p style={{ color: '#000000' }}>Items ({items.length}):</p>
            <ul>
              {items.map((item) => (
                <li key={item.id} style={{ marginBottom: '0.5rem' }}>
                  Item {item.id} - ${item.price}
                  <button onClick={() => removeItem(item.id)} style={{ marginLeft: '1rem' }}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem', color: '#000000' }}>
          {sessionStorageValues.cart && (
            <div><strong>sessionStorage:</strong> {sessionStorageValues.cart}</div>
          )}
        </div>
      </section>

      {/* 8. Combined Storage Strategy */}
      <section style={{ marginBottom: '3rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#ffffff', color: '#000000' }}>
        <h2 style={{ color: '#000000' }}>8. Combined Storage Strategy</h2>
        <p style={{ color: '#000000' }}>Using URL, localStorage, and sessionStorage together</p>
        <div style={{ marginTop: '1rem' }}>
          <p style={{ color: '#000000' }}>View: {view}</p>
          <p style={{ color: '#000000' }}>Filter: {filter}</p>
          <p style={{ color: '#000000' }}>Theme: {appTheme}</p>
          <p style={{ color: '#000000' }}>Font Size: {settings.fontSize}px</p>
          <p style={{ color: '#000000' }}>Temp Data: {tempData ? String(tempData) : 'null'}</p>
        </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem', color: '#000000' }}>
          <div><strong>URL:</strong> {urlParams.app?.url ? <a href={urlParams.app.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', wordBreak: 'break-all', textDecoration: 'underline', fontWeight: 'bold' }}>{urlParams.app.url}</a> : <span style={{ color: '#666' }}>None</span>}</div>
          {urlParams.app?.decoded && (
            <div style={{ marginTop: '0.5rem' }}>
              <div><strong>Decoded {urlParams.app.decoded.isJson ? 'JSON' : 'Value'}:</strong></div>
              <pre style={{ marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px', color: '#000000' }}>{urlParams.app.decoded.decoded}</pre>
            </div>
          )}
          {localStorageValues.app && (
            <div style={{ marginTop: '0.5rem' }}><strong>localStorage:</strong> {localStorageValues.app}</div>
          )}
          {sessionStorageValues.app && (
            <div style={{ marginTop: '0.5rem' }}><strong>sessionStorage:</strong> {sessionStorageValues.app}</div>
          )}
        </div>
      </section>

      {/* 9. Custom Storage Priority */}
      <section style={{ marginBottom: '3rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#ffffff', color: '#000000' }}>
        <h2 style={{ color: '#000000' }}>9. Custom Storage Priority</h2>
        <p style={{ color: '#000000' }}>Priority order: localStorage → URL → sessionStorage</p>
        <div style={{ marginTop: '1rem' }}>
          <p style={{ color: '#000000' }}>Value: {value}</p>
        </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem', color: '#000000' }}>
          <div><strong>URL:</strong> {urlParams.data?.url ? <a href={urlParams.data.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', wordBreak: 'break-all', textDecoration: 'underline', fontWeight: 'bold' }}>{urlParams.data.url}</a> : <span style={{ color: '#666' }}>None</span>}</div>
          {urlParams.data?.decoded && (
            <div style={{ marginTop: '0.5rem' }}>
              <div><strong>Decoded {urlParams.data.decoded.isJson ? 'JSON' : 'Value'}:</strong></div>
              <pre style={{ marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#ffffff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px', color: '#000000' }}>{urlParams.data.decoded.decoded}</pre>
            </div>
          )}
          {localStorageValues.data && (
            <div style={{ marginTop: '0.5rem' }}><strong>localStorage:</strong> {localStorageValues.data}</div>
          )}
          {sessionStorageValues.data && (
            <div style={{ marginTop: '0.5rem' }}><strong>sessionStorage:</strong> {sessionStorageValues.data}</div>
          )}
        </div>
      </section>
    </div>
  )
}

export default App

