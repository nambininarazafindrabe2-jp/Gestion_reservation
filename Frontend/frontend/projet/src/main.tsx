import { Component, StrictMode } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Erreur React :', error)
  }

  render() {
    if (this.state.error) {
      return (
        <pre style={{ margin: 0, padding: 16, background: '#fee2e2', color: '#7f1d1d', font: '13px/1.4 monospace', whiteSpace: 'pre-wrap' }}>
          {'ERREUR REACT : ' + this.state.error.message + '\n\n' + (this.state.error.stack ?? '')}
        </pre>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
