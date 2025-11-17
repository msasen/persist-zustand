import { combine } from 'zustand/middleware'
import { createPersistStore } from '../../src/index'

export const useCounterStore = createPersistStore(
  'counter', 
  {
    urlKeys: ['count2'], 
  },
  combine({ count1: 0, count2: 0 }, (set) => ({
    increment1: () => set((state) => ({ count1: state.count1 + 1 })),
    decrement1: () => set((state) => ({ count1: state.count1 - 1 })),
    increment2: () => set((state) => ({ count2: state.count2 + 1 })),
    decrement2: () => set((state) => ({ count2: state.count2 - 1 })),
  })),
  {
    priority: ['url', 'session', 'local'], 
    history: ['count2'],
    base64: {
      enabled: false,
      threshold: 100
    }
  }
)

export const useCounterStore2 = createPersistStore(
  'counter2', 
  {
    urlKeys: ['count3'], 
    localKeys: ['count4'], 
    sessionKeys: [] 
  },
  combine({ count3: 0, count4: 0 }, (set) => ({
    increment3: () => set((state) => ({ count3: state.count3 + 1 })),
    decrement3: () => set((state) => ({ count3: state.count3 - 1 })),
    increment4: () => set((state) => ({ count4: state.count4 + 1 })),
    decrement4: () => set((state) => ({ count4: state.count4 - 1 })),
  })),
  {
    priority: ['local', 'url', 'session'] 
  }
)

