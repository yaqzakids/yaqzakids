import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#EEF4FF] flex items-center justify-center px-6">
          <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-3xl mb-3" aria-hidden>⚠️</p>
            <h1 className="font-display text-xl font-bold text-[#1B2F5E] mb-2">Something went wrong</h1>
            <p className="text-sm text-[#6B7280] mb-4">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#2AAFA0] text-white rounded-full font-bold text-sm"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
