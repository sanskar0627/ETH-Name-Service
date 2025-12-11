import { useState } from 'react'
import './App.css'
import ENSProfile from './components/profile'
import ENSGraph from './components/ensSocial'

function App() {
  const [view, setView] = useState('profile') // 'graph' or 'profile'

  return (
    <div className="App">
      {/* Navigation */}
      <nav style={styles.nav}>
        <button 
          onClick={() => setView('profile')} 
          style={{...styles.navBtn, ...(view === 'profile' ? styles.navBtnActive : {})}}
        >
          Profile Viewer
        </button>
        <button 
          onClick={() => setView('graph')} 
          style={{...styles.navBtn, ...(view === 'graph' ? styles.navBtnActive : {})}}
        >
          Social Graph
        </button>
      </nav>

      {/* Content */}
      {view === 'profile' ? <ENSProfile /> : <ENSGraph />}
    </div>
  )
}

const styles = {
  nav: {
    display: 'flex',
    gap: 'var(--s-2)',
    padding: 'var(--s-4) var(--s-6)',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'var(--bg)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  navBtn: {
    padding: 'var(--s-2) var(--s-4)',
    fontSize: '14px',
    fontWeight: 600,
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--r-md)',
    backgroundColor: 'transparent',
    color: 'var(--text)',
    cursor: 'pointer',
    transition: 'all var(--base) var(--ease)',
  },
  navBtnActive: {
    backgroundColor: 'var(--text)',
    color: 'var(--bg)',
    borderColor: 'var(--text)',
  },
};

export default App
