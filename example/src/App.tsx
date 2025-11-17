import { useCounterStore, useCounterStore2 } from './stores'

function App() {
  const { count1, count2, increment1, decrement1, increment2, decrement2 } = useCounterStore()
  const { count3, count4, increment3, decrement3, increment4, decrement4 } = useCounterStore2()

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Zustand Demo</h1>
      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <h2>Counter 1</h2>
        <button onClick={decrement1} style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}>
          -
        </button>
        <span style={{ fontSize: '2rem', margin: '0 1rem' }}>{count1}</span>
        <button onClick={increment1} style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}>
          +
        </button>
      </div>
      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <h2>Counter 2</h2>
        <button onClick={decrement2} style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}>
          -
        </button>
        <span style={{ fontSize: '2rem', margin: '0 1rem' }}>{count2}</span>
        <button onClick={increment2} style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}>
          +
        </button>
      </div>
      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <h2>Counter 3</h2>
        <button onClick={decrement3} style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}>
          -
        </button>
        <span style={{ fontSize: '2rem', margin: '0 1rem' }}>{count3}</span>
        <button onClick={increment3} style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}>
          +
        </button>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <h2>Counter 4</h2>
        <button onClick={decrement4} style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}>
          -
        </button>
        <span style={{ fontSize: '2rem', margin: '0 1rem' }}>{count4}</span>
        <button onClick={increment4} style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}>
          +
        </button>
      </div>
    </div>
  )
}

export default App

