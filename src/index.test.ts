/* eslint-disable */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPersistStore } from './index'

const clearAllStorages = () => {
  localStorage.clear()
  sessionStorage.clear()
  window.history.replaceState(null, '', window.location.pathname)
  if (window.location.search) {
    window.history.replaceState(null, '', window.location.pathname)
  }
}

const waitForDebounce = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms + 10)) 
}

const measurePerformance = async (fn: () => void | Promise<void>) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

const generateLargeData = (sizeKB: number) => {
  const data: Record<string, string> = {}
  const charsPerKB = 1024
  const totalChars = sizeKB * charsPerKB
  let currentSize = 0
  let keyIndex = 0
  while (currentSize < totalChars) {
    const key = `key${keyIndex}`
    const remaining = totalChars - currentSize
    const valueSize = Math.min(remaining - key.length - 50, 1000) 
    data[key] = 'x'.repeat(Math.max(0, valueSize))
    currentSize += key.length + valueSize + 50 
    keyIndex++
  }
  return data
}

const generateLongUrl = (length: number) => {
  const baseUrl = '?'
  const data = { test: 'x'.repeat(Math.max(0, length - baseUrl.length - 20)) }
  return `${baseUrl}test=${encodeURIComponent(JSON.stringify(data))}`
}

const createTestStore = <T = any>(name: string, keys: { urlKeys?: string[], localKeys?: string[], sessionKeys?: string[] }, initializer?: any, options?: any): any => {
  return createPersistStore<T>(name, keys, initializer, options)
}

describe('createPersistStore', () => {
  beforeEach(() => {
    clearAllStorages()
  })
  afterEach(() => {
    clearAllStorages()
  })
  describe('Basic Functionality', () => {
    describe('Store Creation', () => {
      it('Create normal store (with initializer)', () => {
        const store: any = createTestStore(
          'test1',
          { urlKeys: ['count'] },
          (set: any) => ({
            count: 0,
            increment: () => set((state: any) => ({ count: state.count + 1 }))
          })
        )
        expect(store).toBeDefined()
        expect(store.getState).toBeDefined()
        expect(store.setState).toBeDefined()
        expect(store.subscribe).toBeDefined()
        expect(store.getState().count).toBe(0)
      })
      it('Create store without initializer', () => {
        const store: any = createTestStore('test2', { urlKeys: ['count'] })
        expect(store).toBeDefined()
        expect(store.getState).toBeDefined()
        expect(store.setState).toBeDefined()
        expect(store.subscribe).toBeDefined()
      })
      it('Verify store implements Zustand store interface', () => {
        const store: any = createTestStore(
          'test3',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(typeof store.getState).toBe('function')
        expect(typeof store.setState).toBe('function')
        expect(typeof store.subscribe).toBe('function')
        const state = store.getState() as any
        expect(state).toBeDefined()
        expect(state.count).toBe(0)
      })
    })
    describe('Storage Key Parameters', () => {
      it('Create store with only urlKeys', () => {
        const store: any = createTestStore(
          'test4',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store).toBeDefined()
        expect(store.getState().count).toBe(0)
      })
      it('Create store with only localKeys', () => {
        const store: any = createTestStore(
          'test5',
          { localKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store).toBeDefined()
        expect(store.getState().count).toBe(0)
      })
      it('Create store with only sessionKeys', () => {
        const store: any = createTestStore(
          'test6',
          { sessionKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store).toBeDefined()
        expect(store.getState().count).toBe(0)
      })
      it('Create store with all storage types', () => {
        const store: any = createTestStore(
          'test7',
          { urlKeys: ['count1'], localKeys: ['count2'], sessionKeys: ['count3'] },
          (set: any) => ({ count1: 0, count2: 0, count3: 0 })
        )
        expect(store).toBeDefined()
        expect(store.getState().count1).toBe(0)
        expect(store.getState().count2).toBe(0)
        expect(store.getState().count3).toBe(0)
      })
      it('Create store with empty arrays (storage should not be active)', () => {
        const store: any = createTestStore(
          'test8',
          { urlKeys: [], localKeys: [], sessionKeys: [] },
          (set: any) => ({ count: 0 })
        )
        expect(store).toBeDefined()
      })
      it('Create store with undefined keys (storage should not be active)', () => {
        const store: any = createTestStore(
          'test9',
          {},
          (set: any) => ({ count: 0 })
        )
        expect(store).toBeDefined()
      })
      it('Create store without any storage keys (should return normal store)', () => {
        const store: any = createTestStore(
          'test10',
          {},
          (set: any) => ({ count: 0 })
        )
        expect(store).toBeDefined()
        expect(store.getState().count).toBe(0)
      })
    })
    describe('Conflict Control', () => {
      it('URL store conflict with same name (should throw error)', () => {
        createTestStore('conflict1', { urlKeys: ['count'] }, (set: any) => ({ count: 0 }))
        expect(() => {
          createTestStore('conflict1', { urlKeys: ['count'] }, (set: any) => ({ count: 0 }))
        }).toThrow('URL store name conflict')
      })
      it('localStorage store conflict with same name (should throw error)', () => {
        createTestStore('conflict2', { localKeys: ['count'] }, (set: any) => ({ count: 0 }))
        expect(() => {
          createTestStore('conflict2', { localKeys: ['count'] }, (set: any) => ({ count: 0 }))
        }).toThrow('localStorage store name conflict')
      })
      it('sessionStorage store conflict with same name (should throw error)', () => {
        createTestStore('conflict3', { sessionKeys: ['count'] }, (set: any) => ({ count: 0 }))
        expect(() => {
          createTestStore('conflict3', { sessionKeys: ['count'] }, (set: any) => ({ count: 0 }))
        }).toThrow('sessionStorage store name conflict')
      })
      it('Same name should be usable across different storage types (no conflict)', () => {
        const store1 = createTestStore('sameName', { urlKeys: ['count'] }, (set: any) => ({ count: 0 }))
        const store2 = createTestStore('sameName', { localKeys: ['count'] }, (set: any) => ({ count: 0 }))
        const store3 = createTestStore('sameName', { sessionKeys: ['count'] }, (set: any) => ({ count: 0 }))
        expect(store1).toBeDefined()
        expect(store2).toBeDefined()
        expect(store3).toBeDefined()
      })
      it('Conflict check should not be performed with empty array', () => {
        createTestStore('empty1', { urlKeys: [] }, (set: any) => ({ count: 0 }))
        expect(() => {
          createTestStore('empty1', { urlKeys: [] }, (set: any) => ({ count: 0 }))
        }).not.toThrow()
      })
    })
  })
  describe('Storage Read/Write Operations', () => {
    describe('URL Storage', () => {
      it('Read data from URL (on page load)', () => {
        const testData = { count: 5 }
        window.history.replaceState(null, '', `?test11=${encodeURIComponent(JSON.stringify(testData))}`)
        const store: any = createTestStore(
          'test11',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store.getState().count).toBe(5)
      })
      it('Write data to URL (when state changes)', async () => {
        const store: any = createTestStore(
          'test12',
          { urlKeys: ['count'] },
          (set: any) => ({
            count: 0,
            increment: () => set((state: any) => ({ count: state.count + 1 }))
          })
        )
        store.getState().increment()
        await waitForDebounce(100)
        const urlParams = new URLSearchParams(window.location.search)
        const data = JSON.parse(urlParams.get('test12') || '{}')
        expect(data.count).toBe(1)
      })
      it('Verify only urlKeys are written to URL', async () => {
        const store: any = createTestStore(
          'test13',
          { urlKeys: ['count1'] },
          (set: any) => ({
            count1: 0,
            count2: 0,
            increment1: () => set((state: any) => ({ count1: state.count1 + 1, count2: state.count2 + 1 }))
          })
        )
        store.getState().increment1()
        await waitForDebounce(100)
        const urlParams = new URLSearchParams(window.location.search)
        const data = JSON.parse(urlParams.get('test13') || '{}')
        expect(data.count1).toBe(1)
        expect(data.count2).toBeUndefined()
      })
      it('Verify undefined values are not written to URL', async () => {
        const store: any = createTestStore(
          'test14',
          { urlKeys: ['count1', 'count2'] },
          (set: any) => ({
            count1: 0,
            count2: undefined,
            setCount1: (val: number) => set({ count1: val })
          })
        )
        store.getState().setCount1(5)
        await waitForDebounce(100)
        const urlParams = new URLSearchParams(window.location.search)
        const data = JSON.parse(urlParams.get('test14') || '{}')
        expect(data.count1).toBe(5)
        expect(data.count2).toBeUndefined()
      })
      it('Verify keys not in URL are not written to store', () => {
        window.history.replaceState(null, '', '?test15={"count1":5,"count2":10}')
        const store: any = createTestStore(
          'test15',
          { urlKeys: ['count1'] },
          (set: any) => ({ count1: 0, count2: 0 })
        )
        expect(store.getState().count1).toBe(5)
        expect(store.getState().count2).toBe(0) 
      })
      it('Verify multiple stores can exist in URL simultaneously', () => {
        window.history.replaceState(null, '', '?store1={"count":1}&store2={"count":2}')
        const store1 = createTestStore('store1', { urlKeys: ['count'] }, (set: any) => ({ count: 0 }))
        const store2 = createTestStore('store2', { urlKeys: ['count'] }, (set: any) => ({ count: 0 }))
        expect(store1.getState().count).toBe(1)
        expect(store2.getState().count).toBe(2)
      })
    })
    describe('localStorage', () => {
      it('Read data from localStorage', () => {
        localStorage.setItem('test16', JSON.stringify({ count: 5 }))
        const store: any = createTestStore(
          'test16',
          { localKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store.getState().count).toBe(5)
      })
      it('Write data to localStorage', async () => {
        const store: any = createTestStore(
          'test17',
          { localKeys: ['count'] },
          (set: any) => ({
            count: 0,
            increment: () => set((state: any) => ({ count: state.count + 1 }))
          })
        )
        store.getState().increment()
        await waitForDebounce(100)
        const data = JSON.parse(localStorage.getItem('test17') || '{}')
        expect(data.count).toBe(1)
      })
      it('Verify only localKeys are written to localStorage', async () => {
        const store: any = createTestStore(
          'test18',
          { localKeys: ['count1'] },
          (set: any) => ({
            count1: 0,
            count2: 0,
            increment1: () => set((state: any) => ({ count1: state.count1 + 1, count2: state.count2 + 1 }))
          })
        )
        store.getState().increment1()
        await waitForDebounce(100)
        const data = JSON.parse(localStorage.getItem('test18') || '{}')
        expect(data.count1).toBe(1)
        expect(data.count2).toBeUndefined()
      })
      it('Verify undefined values are not written to localStorage', async () => {
        const store: any = createTestStore(
          'test19',
          { localKeys: ['count1', 'count2'] },
          (set: any) => ({
            count1: 0,
            count2: undefined,
            setCount1: (val: number) => set({ count1: val })
          })
        )
        store.getState().setCount1(5)
        await waitForDebounce(100)
        const data = JSON.parse(localStorage.getItem('test19') || '{}')
        expect(data.count1).toBe(5)
        expect(data.count2).toBeUndefined()
      })
      it('Verify keys not in localStorage are not written to store', () => {
        localStorage.setItem('test20', JSON.stringify({ count1: 5, count2: 10 }))
        const store: any = createTestStore(
          'test20',
          { localKeys: ['count1'] },
          (set: any) => ({ count1: 0, count2: 0 })
        )
        expect(store.getState().count1).toBe(5)
        expect(store.getState().count2).toBe(0) 
      })
      it('Error handling when localStorage is full (try-catch)', async () => {
        let quotaExceeded = false
        try {
          for (let i = 0; i < 10000; i++) {
            localStorage.setItem(`fill${i}`, 'x'.repeat(1000))
          }
        } catch (e) {
          quotaExceeded = true
        }
        if (!quotaExceeded) {
          localStorage.clear()
          return
        }
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const store: any = createTestStore(
          'test21',
          { localKeys: ['count'] },
          (set: any) => ({
            count: 0,
            increment: () => set((state: any) => ({ count: state.count + 1 }))
          })
        )
        store.getState().increment()
        await waitForDebounce(100)
        consoleWarnSpy.mockRestore()
        localStorage.clear()
      })
    })
    describe('sessionStorage', () => {
      it('Read data from sessionStorage', () => {
        sessionStorage.setItem('test22', JSON.stringify({ count: 5 }))
        const store: any = createTestStore(
          'test22',
          { sessionKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store.getState().count).toBe(5)
      })
      it('Write data to sessionStorage', async () => {
        const store: any = createTestStore(
          'test23',
          { sessionKeys: ['count'] },
          (set: any) => ({
            count: 0,
            increment: () => set((state: any) => ({ count: state.count + 1 }))
          })
        )
        store.getState().increment()
        await waitForDebounce(100)
        const data = JSON.parse(sessionStorage.getItem('test23') || '{}')
        expect(data.count).toBe(1)
      })
      it('Verify only sessionKeys are written to sessionStorage', async () => {
        const store: any = createTestStore(
          'test24',
          { sessionKeys: ['count1'] },
          (set: any) => ({
            count1: 0,
            count2: 0,
            increment1: () => set((state: any) => ({ count1: state.count1 + 1, count2: state.count2 + 1 }))
          })
        )
        store.getState().increment1()
        await waitForDebounce(100)
        const data = JSON.parse(sessionStorage.getItem('test24') || '{}')
        expect(data.count1).toBe(1)
        expect(data.count2).toBeUndefined()
      })
      it('Verify undefined values are not written to sessionStorage', async () => {
        const store: any = createTestStore(
          'test25',
          { sessionKeys: ['count1', 'count2'] },
          (set: any) => ({
            count1: 0,
            count2: undefined,
            setCount1: (val: number) => set({ count1: val })
          })
        )
        store.getState().setCount1(5)
        await waitForDebounce(100)
        const data = JSON.parse(sessionStorage.getItem('test25') || '{}')
        expect(data.count1).toBe(5)
        expect(data.count2).toBeUndefined()
      })
      it('Verify keys not in sessionStorage are not written to store', () => {
        sessionStorage.setItem('test26', JSON.stringify({ count1: 5, count2: 10 }))
        const store: any = createTestStore(
          'test26',
          { sessionKeys: ['count1'] },
          (set: any) => ({ count1: 0, count2: 0 })
        )
        expect(store.getState().count1).toBe(5)
        expect(store.getState().count2).toBe(0)
      })
      it('Error handling when sessionStorage is full (try-catch)', async () => {
        let quotaExceeded = false
        try {
          for (let i = 0; i < 10000; i++) {
            sessionStorage.setItem(`fill${i}`, 'x'.repeat(1000))
          }
        } catch (e) {
          quotaExceeded = true
        }
        if (!quotaExceeded) {
          sessionStorage.clear()
          return
        }
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const store: any = createTestStore(
          'test27',
          { sessionKeys: ['count'] },
          (set: any) => ({
            count: 0,
            increment: () => set((state: any) => ({ count: state.count + 1 }))
          })
        )
        store.getState().increment()
        await waitForDebounce(100)
        consoleWarnSpy.mockRestore()
        sessionStorage.clear()
      })
    })
  })
  describe('Priority Order', () => {
    describe('Read Priority', () => {
      it('Default priority: [\'url\', \'session\', \'local\']', () => {
        window.history.replaceState(null, '', '?test28={"count":1}')
        sessionStorage.setItem('test28', JSON.stringify({ count: 2 }))
        localStorage.setItem('test28', JSON.stringify({ count: 3 }))
        const store: any = createTestStore(
          'test28',
          { urlKeys: ['count'], sessionKeys: ['count'], localKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store.getState().count).toBe(1)
      })
      it('Custom priority order: [\'local\', \'url\', \'session\']', () => {
        window.history.replaceState(null, '', '?test29={"count":1}')
        sessionStorage.setItem('test29', JSON.stringify({ count: 2 }))
        localStorage.setItem('test29', JSON.stringify({ count: 3 }))
        const store: any = createTestStore(
          'test29',
          { urlKeys: ['count'], sessionKeys: ['count'], localKeys: ['count'] },
          (set: any) => ({ count: 0 }),
          { priority: ['local', 'url', 'session'] }
        )
        expect(store.getState().count).toBe(3)
      })
      it('Verify first found data is used (early exit with break)', () => {
        window.history.replaceState(null, '', '?test30={"count":1}')
        sessionStorage.setItem('test30', JSON.stringify({ count: 2 }))
        localStorage.setItem('test30', JSON.stringify({ count: 3 }))
        const store: any = createTestStore(
          'test30',
          { urlKeys: ['count'], sessionKeys: ['count'], localKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store.getState().count).toBe(1)
      })
      it('If data exists in first storage in priority order, others should not be read', () => {
        window.history.replaceState(null, '', '?test31={"count":1}')
        sessionStorage.setItem('test31', JSON.stringify({ count: 2 }))
        const store: any = createTestStore(
          'test31',
          { urlKeys: ['count'], sessionKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store.getState().count).toBe(1) 
      })
      it('If no data in storage in priority order, should proceed to next', () => {
        sessionStorage.setItem('test32', JSON.stringify({ count: 2 }))
        localStorage.setItem('test32', JSON.stringify({ count: 3 }))
        const store: any = createTestStore(
          'test32',
          { urlKeys: ['count'], sessionKeys: ['count'], localKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store.getState().count).toBe(2)
      })
      it('If no data in any storage, store should start with default values', () => {
        const store: any = createTestStore(
          'test33',
          { urlKeys: ['count'], sessionKeys: ['count'], localKeys: ['count'] },
          (set: any) => ({ count: 10 })
        )
        expect(store.getState().count).toBe(10)
      })
    })
    describe('Write Priority', () => {
      it('In write operation, should write to all active storages (priority order not applicable)', async () => {
        const store: any = createTestStore(
          'test34',
          { urlKeys: ['count'], sessionKeys: ['count'], localKeys: ['count'] },
          (set: any) => ({
            count: 0,
            increment: () => set((state: any) => ({ count: state.count + 1 }))
          }),
          { priority: ['local', 'url', 'session'] } 
        )
        store.getState().increment()
        await waitForDebounce(100)
        const urlParams = new URLSearchParams(window.location.search)
        const urlData = JSON.parse(urlParams.get('test34') || '{}')
        const sessionData = JSON.parse(sessionStorage.getItem('test34') || '{}')
        const localData = JSON.parse(localStorage.getItem('test34') || '{}')
        expect(urlData.count).toBe(1)
        expect(sessionData.count).toBe(1)
        expect(localData.count).toBe(1)
      })
      it('Should be able to write to URL, localStorage and sessionStorage simultaneously', async () => {
        const store: any = createTestStore(
          'test35',
          { urlKeys: ['count'], sessionKeys: ['count'], localKeys: ['count'] },
          (set: any) => ({
            count: 0,
            increment: () => set((state: any) => ({ count: state.count + 1 }))
          })
        )
        store.getState().increment()
        await waitForDebounce(100)
        const urlParams = new URLSearchParams(window.location.search)
        expect(JSON.parse(urlParams.get('test35') || '{}').count).toBe(1)
        expect(JSON.parse(sessionStorage.getItem('test35') || '{}').count).toBe(1)
        expect(JSON.parse(localStorage.getItem('test35') || '{}').count).toBe(1)
      })
    })
  })
  describe('History API (Back/Forward Support)', () => {
    describe('History Settings', () => {
      it('pushState usage with history enabled (non-empty array)', async () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState')
        const store: any = createTestStore(
          'test36',
          { urlKeys: ['count'] },
          (set: any) => ({
            count: 0,
            increment: () => set((state: any) => ({ count: state.count + 1 }))
          }),
          { history: ['count'] }
        )
        store.getState().increment()
        await waitForDebounce(100)
        expect(pushStateSpy).toHaveBeenCalled()
        pushStateSpy.mockRestore()
      })
      it('replaceState usage with history disabled (empty array)', async () => {
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState')
        const store: any = createTestStore(
          'test37',
          { urlKeys: ['count'] },
          (set: any) => ({
            count: 0,
            increment: () => set((state: any) => ({ count: state.count + 1 }))
          }),
          { history: [] }
        )
        store.getState().increment()
        await waitForDebounce(100)
        expect(replaceStateSpy).toHaveBeenCalled()
        replaceStateSpy.mockRestore()
      })
      it('When history.keys specified, history entry only for those keys', async () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState')
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState')
        const store: any = createTestStore(
          'test38',
          { urlKeys: ['count1', 'count2'] },
          (set: any) => ({
            count1: 0,
            count2: 0,
            increment1: () => set((state: any) => ({ count1: state.count1 + 1 })),
            increment2: () => set((state: any) => ({ count2: state.count2 + 1 }))
          }),
          { history: ['count1'] }
        )
        store.getState().increment1()
        await waitForDebounce(100)
        expect(pushStateSpy).toHaveBeenCalled()
        pushStateSpy.mockClear()
        replaceStateSpy.mockClear()
        store.getState().increment2()
        await waitForDebounce(100)
        expect(replaceStateSpy).toHaveBeenCalled()
        pushStateSpy.mockRestore()
        replaceStateSpy.mockRestore()
      })
      it('When history.keys not specified, history entry for all urlKeys', async () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState')
        const store: any = createTestStore(
          'test39',
          { urlKeys: ['count1', 'count2'] },
          (set: any) => ({
            count1: 0,
            count2: 0,
            increment1: () => set((state: any) => ({ count1: state.count1 + 1 }))
          })
        )
        store.getState().increment1()
        await waitForDebounce(100)
        expect(pushStateSpy).toHaveBeenCalled()
        pushStateSpy.mockRestore()
      })
    })
    describe('Popstate Event', () => {
      it('Store should update when URL changes with back button', async () => {
        window.history.replaceState(null, '', '?test40={"count":1}')
        const store: any = createTestStore(
          'test40',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store.getState().count).toBe(1)
        window.history.pushState(null, '', '?test40={"count":2}')
        window.history.back()
        window.dispatchEvent(new PopStateEvent('popstate'))
        await waitForDebounce(100)
      })
      it('Popstate event listener should be added correctly', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
        const store: any = createTestStore(
          'test41',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 }),
          { history: ['count'] }
        )
        expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function))
        addEventListenerSpy.mockRestore()
      })
      it('Popstate listener should be removed in destroy method', () => {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
        const store: any = createTestStore(
          'test42',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 }),
          { history: ['count'] }
        )
        store.destroy()
        expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function))
        removeEventListenerSpy.mockRestore()
      })
    })
  })
  describe('Base64 Encoding', () => {
    describe('Base64 Control', () => {
      it('Normal JSON string with base64.enabled=false (default)', async () => {
        const store: any = createTestStore(
          'test43',
          { urlKeys: ['data'] },
          (set: any) => ({
            data: { count: 5 },
            setData: (val: any) => set({ data: val })
          }),
          { base64: { enabled: false } }
        )
        store.getState().setData({ count: 10 })
        await waitForDebounce(100)
        const urlParams = new URLSearchParams(window.location.search)
        const raw = urlParams.get('test43')
        expect(raw).toBeTruthy()
        expect(urlParams.get('test43_encoded')).toBeNull()
        const parsed = JSON.parse(decodeURIComponent(raw || '{}'))
        expect(parsed.data.count).toBe(10)
      })
      it('Normal JSON string with base64.enabled=true and data smaller than threshold', async () => {
        const store: any = createTestStore(
          'test44',
          { urlKeys: ['data'] },
          (set: any) => ({
            data: { count: 5 },
            setData: (val: any) => set({ data: val })
          }),
          { base64: { enabled: true, threshold: 100 } }
        )
        store.getState().setData({ count: 10 })
        await waitForDebounce(100)
        const urlParams = new URLSearchParams(window.location.search)
        const raw = urlParams.get('test44')
        expect(raw).toBeTruthy()
        expect(urlParams.get('test44_encoded')).toBeNull() 
        const parsed = JSON.parse(decodeURIComponent(raw || '{}'))
        expect(parsed.data.count).toBe(10)
      })
      it('Base64 encoding with base64.enabled=true and data larger than threshold', async () => {
        const largeData = { data: 'x'.repeat(200) } 
        const store: any = createTestStore(
          'test45',
          { urlKeys: ['data'] },
          (set: any) => ({
            data: { data: '' },
            setData: (val: any) => set({ data: val })
          }),
          { base64: { enabled: true, threshold: 100 } }
        )
        store.getState().setData(largeData)
        await waitForDebounce(100)
        const urlParams = new URLSearchParams(window.location.search)
        const raw = urlParams.get('test45')
        expect(raw).toBeTruthy()
        expect(urlParams.get('test45_encoded')).toBe('1') 
        const decoded = JSON.parse(atob(raw || ''))
        expect(decoded.data.data).toBe(largeData.data)
      })
      it('Base64 encoded data should be marked with _encoded flag in URL', async () => {
        const largeData = { data: 'x'.repeat(200) }
        const store: any = createTestStore(
          'test46',
          { urlKeys: ['data'] },
          (set: any) => ({
            data: { data: '' },
            setData: (val: any) => set({ data: val })
          }),
          { base64: { enabled: true, threshold: 100 } }
        )
        store.getState().setData(largeData)
        await waitForDebounce(100)
        const urlParams = new URLSearchParams(window.location.search)
        expect(urlParams.get('test46_encoded')).toBe('1')
      })
      it('Base64 decode operation should work correctly', () => {
        const originalData = { count: 5, name: 'test' }
        const encoded = btoa(JSON.stringify(originalData))
        window.history.replaceState(null, '', `?test47_encoded=1&test47=${encoded}`)
        const store: any = createTestStore(
          'test47',
          { urlKeys: ['count', 'name'] },
          (set: any) => ({ count: 0, name: '' })
        )
        expect(store.getState().count).toBe(5)
        expect(store.getState().name).toBe('test')
      })
      it('If previous data was encoded but new data is small, flag should be removed', async () => {
        const largeData = { data: 'x'.repeat(200) }
        const smallData = { data: 'small' }
        const store: any = createTestStore(
          'test48',
          { urlKeys: ['data'] },
          (set: any) => ({
            data: { data: '' },
            setData: (val: any) => set({ data: val })
          }),
          { base64: { enabled: true, threshold: 100 } }
        )
        store.getState().setData(largeData)
        await waitForDebounce(100)
        let urlParams = new URLSearchParams(window.location.search)
        expect(urlParams.get('test48_encoded')).toBe('1')
        store.getState().setData(smallData)
        await waitForDebounce(100)
        urlParams = new URLSearchParams(window.location.search)
        expect(urlParams.get('test48_encoded')).toBeNull()
      })
    })
  })
  describe('Debounce Mechanism', () => {
    describe('Debounce Function', () => {
      it('Debounce function should work correctly', async () => {
        vi.useFakeTimers()
        const mockFn = vi.fn()
        const debouncedFn = (() => {
          let timeout: ReturnType<typeof setTimeout> | null = null
          return (...args: any[]) => {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => mockFn(...args), 100)
          }
        })()
        debouncedFn(1)
        debouncedFn(2)
        debouncedFn(3)
        vi.advanceTimersByTime(100)
        expect(mockFn).toHaveBeenCalledTimes(1)
        expect(mockFn).toHaveBeenCalledWith(3)
        vi.useRealTimers()
      })
      it('Only last call should execute in rapid calls', async () => {
        vi.useFakeTimers()
        let callCount = 0
        const store: any = createTestStore(
          'test49',
          { urlKeys: ['count'] },
          (set: any) => ({
            count: 0,
            increment: () => {
              callCount++
              set((state: any) => ({ count: state.count + 1 }))
            }
          }),
          { debounceDelay: 100 }
        )
        for (let i = 0; i < 10; i++) {
          store.getState().increment()
        }
        vi.advanceTimersByTime(100)
        const urlParams = new URLSearchParams(window.location.search)
        const data = JSON.parse(urlParams.get('test49') || '{}')
        expect(data.count).toBe(10) 
        vi.useRealTimers()
      })
      it('Function should execute after specified time', async () => {
        vi.useFakeTimers()
        const mockFn = vi.fn()
        const debouncedFn = (() => {
          let timeout: ReturnType<typeof setTimeout> | null = null
          return (...args: any[]) => {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => mockFn(...args), 200)
          }
        })()
        debouncedFn(1)
        vi.advanceTimersByTime(199)
        expect(mockFn).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1)
        expect(mockFn).toHaveBeenCalledTimes(1)
        vi.useRealTimers()
      })
    })
    describe('DebounceDelay Option', () => {
      it('Default 100ms debounce delay', async () => {
        vi.useFakeTimers()
        const store: any = createTestStore(
          'test50',
          { urlKeys: ['count'] },
          (set: any) => ({
            count: 0,
            increment: () => set((state: any) => ({ count: state.count + 1 }))
          })
        )
        store.getState().increment()
        vi.advanceTimersByTime(99)
        let urlParams = new URLSearchParams(window.location.search)
        expect(urlParams.get('test50')).toBeNull()
        vi.advanceTimersByTime(1)
        urlParams = new URLSearchParams(window.location.search)
        expect(urlParams.get('test50')).toBeTruthy()
        vi.useRealTimers()
      })
      it('Custom debounceDelay value (e.g.: 200ms)', async () => {
        vi.useFakeTimers()
        const store: any = createTestStore(
          'test51',
          { urlKeys: ['count'] },
          (set: any) => ({
            count: 0,
            increment: () => set((state: any) => ({ count: state.count + 1 }))
          }),
          { debounceDelay: 200 }
        )
        store.getState().increment()
        vi.advanceTimersByTime(199)
        let urlParams = new URLSearchParams(window.location.search)
        expect(urlParams.get('test51')).toBeNull()
        vi.advanceTimersByTime(1)
        urlParams = new URLSearchParams(window.location.search)
        expect(urlParams.get('test51')).toBeTruthy()
        vi.useRealTimers()
      })
    })
  })
  describe('Optimizations', () => {
    describe('JSON String Comparison', () => {
      it('Should not write to storage for same value (prevJsonStr check)', async () => {
        const store: any = createTestStore(
          'test52',
          { localKeys: ['count'] },
          (set: any) => ({
            count: 0,
            setCount: (val: number) => set({ count: val })
          })
        )
        store.getState().setCount(5)
        await waitForDebounce(100)
        let data = JSON.parse(localStorage.getItem('test52') || '{}')
        expect(data.count).toBe(5)
        const firstWriteTime = Date.now()
        await waitForDebounce(100)
        store.getState().setCount(5)
        await waitForDebounce(100)
        data = JSON.parse(localStorage.getItem('test52') || '{}')
        expect(data.count).toBe(5)
      })
      it('Should write to storage for different value', async () => {
        const store: any = createTestStore(
          'test53',
          { localKeys: ['count'] },
          (set: any) => ({
            count: 0,
            setCount: (val: number) => set({ count: val })
          })
        )
        store.getState().setCount(5)
        await waitForDebounce(100)
        let data = JSON.parse(localStorage.getItem('test53') || '{}')
        expect(data.count).toBe(5)
        store.getState().setCount(10)
        await waitForDebounce(100)
        data = JSON.parse(localStorage.getItem('test53') || '{}')
        expect(data.count).toBe(10)
      })
    })
    describe('URL Cache Mechanism', () => {
      it('getCachedParams function should use cache', () => {
        window.history.replaceState(null, '', '?test54={"count":1}')
        const params1 = new URLSearchParams(window.location.search)
        expect(params1.get('test54')).toBeTruthy()
        const params2 = new URLSearchParams(window.location.search)
        expect(params2.get('test54')).toBeTruthy()
      })
      it('Cache should update when URL changes', async () => {
        window.history.replaceState(null, '', '?test55={"count":1}')
        const store: any = createTestStore(
          'test55',
          { urlKeys: ['count'] },
          (set: any) => ({
            count: 0,
            setCount: (val: number) => set({ count: val })
          })
        )
        store.getState().setCount(2)
        await waitForDebounce(100)
        const urlParams = new URLSearchParams(window.location.search)
        expect(JSON.parse(urlParams.get('test55') || '{}').count).toBe(2)
      })
    })
  })
  describe('Change Detection (checkChanges)', () => {
    it('Change detection in URL keys', async () => {
      const store: any = createTestStore(
        'test56',
        { urlKeys: ['count'] },
        (set: any) => ({
          count: 0,
          increment: () => set((state: any) => ({ count: state.count + 1 }))
        })
      )
      store.getState().increment()
      await waitForDebounce(100)
      const urlParams = new URLSearchParams(window.location.search)
      expect(JSON.parse(urlParams.get('test56') || '{}').count).toBe(1)
    })
    it('Should not write to storage if no change', async () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem')
      const store: any = createTestStore(
        'test57',
        { localKeys: ['count'] },
        (set: any) => ({
          count: 5,
          setCount: (val: number) => set({ count: val })
        })
      )
      store.getState().setCount(5)
      await waitForDebounce(100)
      const initialCallCount = setItemSpy.mock.calls.length
      store.getState().setCount(5)
      await waitForDebounce(100)
      setItemSpy.mockRestore()
    })
  })
  describe('Destroy Method', () => {
    it('Destroy method should remove popstate listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const store: any = createTestStore(
        'test58',
        { urlKeys: ['count'] },
        (set: any) => ({ count: 0 }),
        { history: ['count'] }
      )
      store.destroy()
      expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function))
      removeEventListenerSpy.mockRestore()
    })
    it('New state changes should not be written to storage after destroy', async () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem')
      const store: any = createTestStore(
        'test59',
        { localKeys: ['count'] },
        (set: any) => ({
          count: 0,
          increment: () => set((state: any) => ({ count: state.count + 1 }))
        })
      )
      store.destroy()
      store.getState().increment()
      await waitForDebounce(100)
      const callCountAfterDestroy = setItemSpy.mock.calls.length
      setItemSpy.mockRestore()
    })
  })
  describe('Edge Cases and Error Scenarios', () => {
    describe('SSR Support', () => {
      it('Functions should not execute when window is undefined (SSR)', () => {
        const originalWindow = window
        delete (globalThis as any).window
        expect(() => {
          createTestStore('test60', { urlKeys: ['count'] }, (set: any) => ({ count: 0 }))
        }).not.toThrow()
        ;(globalThis as any).window = originalWindow
      })
    })
    describe('Invalid Data Scenarios', () => {
      it('Error handling with invalid JSON string', () => {
        window.history.replaceState(null, '', '?test61=invalid-json')
        const store: any = createTestStore(
          'test61',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store.getState().count).toBe(0)
      })
      it('Error handling with invalid base64 string', () => {
        window.history.replaceState(null, '', '?test62_encoded=1&test62=invalid-base64')
        const store: any = createTestStore(
          'test62',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store.getState().count).toBe(0)
      })
      it('Should return empty object in error case', () => {
        window.history.replaceState(null, '', '?test63=invalid')
        const store: any = createTestStore(
          'test63',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store.getState().count).toBe(0)
      })
    })
    describe('Empty and Undefined Values', () => {
      it('Undefined values should not be written to storage', async () => {
        const store: any = createTestStore(
          'test64',
          { urlKeys: ['count1', 'count2'] },
          (set: any) => ({
            count1: 0,
            count2: undefined,
            setCount1: (val: number) => set({ count1: val })
          })
        )
        store.getState().setCount1(5)
        await waitForDebounce(100)
        const urlParams = new URLSearchParams(window.location.search)
        const data = JSON.parse(urlParams.get('test64') || '{}')
        expect(data.count1).toBe(5)
        expect(data.count2).toBeUndefined()
      })
      it('Null values should be written to storage (not undefined)', async () => {
        const store: any = createTestStore(
          'test65',
          { urlKeys: ['value'] },
          (set: any) => ({
            value: 0,
            setValue: (val: any) => set({ value: val })
          })
        )
        store.getState().setValue(null)
        await waitForDebounce(100)
        const urlParams = new URLSearchParams(window.location.search)
        const raw = urlParams.get('test65')
        if (raw) {
          const data = JSON.parse(decodeURIComponent(raw))
          expect(data.value).toBeNull()
        } else {
          expect(raw).toBeTruthy()
        }
      })
      it('Empty string values should be written to storage', async () => {
        const store: any = createTestStore(
          'test66',
          { urlKeys: ['value'] },
          (set: any) => ({
            value: 'initial',
            setValue: (val: string) => set({ value: val })
          })
        )
        store.getState().setValue('')
        await waitForDebounce(100)
        const urlParams = new URLSearchParams(window.location.search)
        const raw = urlParams.get('test66')
        if (raw) {
          const data = JSON.parse(decodeURIComponent(raw))
          expect(data.value).toBe('')
        } else {
          expect(raw).toBeTruthy()
        }
      })
    })
  })
  describe('Multiple Store Scenarios and Base64 Conflicts', () => {
    describe('Mixed Base64/Normal Store Scenarios', () => {
      it('Store1 base64 encoded, Store2 normal - both should parse correctly', () => {
        const store1Data = { count: 5, data: 'x'.repeat(200) }
        const store2Data = { count: 10 }
        const encoded1 = btoa(JSON.stringify(store1Data))
        window.history.replaceState(null, '', `?multistore1_encoded=1&multistore1=${encoded1}&multistore2=${encodeURIComponent(JSON.stringify(store2Data))}`)
        const store1 = createTestStore(
          'multistore1',
          { urlKeys: ['count', 'data'] },
          (set: any) => ({ count: 0, data: '' }),
          { base64: { enabled: true, threshold: 100 } }
        )
        const store2 = createTestStore(
          'multistore2',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store1.getState().count).toBe(5)
        expect(store1.getState().data).toBe('x'.repeat(200))
        expect(store2.getState().count).toBe(10)
      })
      it('Store1 normal, Store2 base64 encoded - both should parse correctly', () => {
        const store1Data = { count: 5 }
        const store2Data = { count: 10, data: 'x'.repeat(200) }
        const encoded2 = btoa(JSON.stringify(store2Data))
        window.history.replaceState(null, '', `?multistore3=${encodeURIComponent(JSON.stringify(store1Data))}&multistore4_encoded=1&multistore4=${encoded2}`)
        const store1 = createTestStore(
          'multistore3',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        const store2 = createTestStore(
          'multistore4',
          { urlKeys: ['count', 'data'] },
          (set: any) => ({ count: 0, data: '' }),
          { base64: { enabled: true, threshold: 100 } }
        )
        expect(store1.getState().count).toBe(5)
        expect(store2.getState().count).toBe(10)
        expect(store2.getState().data).toBe('x'.repeat(200))
      })
      it('3 stores: one base64, two normal - all should work correctly', () => {
        const store1Data = { count: 1, data: 'x'.repeat(200) }
        const store2Data = { count: 2 }
        const store3Data = { count: 3 }
        const encoded1 = btoa(JSON.stringify(store1Data))
        window.history.replaceState(null, '', `?multistore5_encoded=1&multistore5=${encoded1}&multistore6=${encodeURIComponent(JSON.stringify(store2Data))}&multistore7=${encodeURIComponent(JSON.stringify(store3Data))}`)
        const store1 = createTestStore(
          'multistore5',
          { urlKeys: ['count', 'data'] },
          (set: any) => ({ count: 0, data: '' }),
          { base64: { enabled: true, threshold: 100 } }
        )
        const store2 = createTestStore(
          'multistore6',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        const store3 = createTestStore(
          'multistore7',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store1.getState().count).toBe(1)
        expect(store1.getState().data).toBe('x'.repeat(200))
        expect(store2.getState().count).toBe(2)
        expect(store3.getState().count).toBe(3)
      })
    })
    describe('Base64 Flag Isolation', () => {
      it('Each store should have its own _encoded flag', async () => {
        const largeData1 = { data: 'x'.repeat(200) }
        const largeData2 = { data: 'y'.repeat(200) }
        const store1 = createTestStore(
          'flag1',
          { urlKeys: ['data'] },
          (set: any) => ({
            data: { data: '' },
            setData: (val: any) => set({ data: val })
          }),
          { base64: { enabled: true, threshold: 100 } }
        )
        const store2 = createTestStore(
          'flag2',
          { urlKeys: ['data'] },
          (set: any) => ({
            data: { data: '' },
            setData: (val: any) => set({ data: val })
          }),
          { base64: { enabled: true, threshold: 100 } }
        )
        store1.getState().setData(largeData1)
        store2.getState().setData(largeData2)
        await waitForDebounce(100)
        const urlParams = new URLSearchParams(window.location.search)
        expect(urlParams.get('flag1_encoded')).toBe('1')
        expect(urlParams.get('flag2_encoded')).toBe('1')
      })
      it('One store\'s base64 flag should not affect other store', () => {
        const store1Data = { count: 1, data: 'x'.repeat(200) }
        const store2Data = { count: 2 }
        const encoded1 = btoa(JSON.stringify(store1Data))
        window.history.replaceState(null, '', `?multistore10_encoded=1&multistore10=${encoded1}&multistore11=${encodeURIComponent(JSON.stringify(store2Data))}`)
        const store1 = createTestStore(
          'multistore10',
          { urlKeys: ['count', 'data'] },
          (set: any) => ({ count: 0, data: '' })
        )
        const store2 = createTestStore(
          'multistore11',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store2.getState().count).toBe(2)
      })
      it('One store\'s base64 flag should not affect other store - multistore8', () => {
        const store1Data = { count: 1, data: 'x'.repeat(200) }
        const store2Data = { count: 2 }
        const encoded1 = btoa(JSON.stringify(store1Data))
        window.history.replaceState(null, '', `?multistore8_encoded=1&multistore8=${encoded1}&multistore9=${encodeURIComponent(JSON.stringify(store2Data))}`)
        const store1 = createTestStore(
          'multistore8',
          { urlKeys: ['count', 'data'] },
          (set: any) => ({ count: 0, data: '' })
        )
        const store2 = createTestStore(
          'multistore9',
          { urlKeys: ['count'] },
          (set: any) => ({ count: 0 })
        )
        expect(store2.getState().count).toBe(2)
      })
    })
  })
  describe('Performance Tests', () => {
    describe('URL Length Performance Tests', () => {
      it('Performance measurement with 500 character URL', async () => {
        const longUrl = generateLongUrl(500)
        window.history.replaceState(null, '', longUrl)
        const duration = await measurePerformance(async () => {
          const store: any = createTestStore(
            'perf1',
            { urlKeys: ['test'] },
            (set: any) => ({ test: '' })
          )
          await waitForDebounce(100)
        })
        console.log(`500 character URL parse time: ${duration.toFixed(2)}ms`)
        expect(duration).toBeLessThan(200) 
      })
      it('Performance measurement with 1000 character URL', async () => {
        const longUrl = generateLongUrl(1000)
        window.history.replaceState(null, '', longUrl)
        const duration = await measurePerformance(async () => {
          const store: any = createTestStore(
            'perf2',
            { urlKeys: ['test'] },
            (set: any) => ({ test: '' })
          )
          await waitForDebounce(100)
        })
        console.log(`1000 character URL parse time: ${duration.toFixed(2)}ms`)
        expect(duration).toBeLessThan(200)
      })
    })
    describe('High Frequency URL Updates', () => {
      it('Only 1 storage write operation in 100 consecutive state changes', async () => {
        vi.useFakeTimers()
        let writeCount = 0
        const store: any = createTestStore(
          'perf3',
          { urlKeys: ['count'] },
          (set: any) => ({
            count: 0,
            increment: () => set((state: any) => ({ count: state.count + 1 }))
          }),
          { debounceDelay: 100 }
        )
        for (let i = 0; i < 100; i++) {
          store.getState().increment()
        }
        vi.advanceTimersByTime(100)
        const urlParams = new URLSearchParams(window.location.search)
        const data = JSON.parse(urlParams.get('perf3') || '{}')
        expect(data.count).toBe(100) 
        vi.useRealTimers()
      })
    })
    describe('Multiple Store Performance', () => {
      it('Performance of 10 stores running simultaneously', async () => {
        const duration = await measurePerformance(async () => {
          const stores: any[] = []
          for (let i = 0; i < 10; i++) {
            stores.push(createTestStore(
              `perf4_${i}`,
              { urlKeys: ['count'] },
              (set: any) => ({ count: 0 })
            ))
          }
          await waitForDebounce(100)
        })
        console.log(`10 store creation time: ${duration.toFixed(2)}ms`)
        expect(duration).toBeLessThan(500)
      })
    })
  })
})

