import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'

type ThemeContextValue = {
  mode: ThemeMode
  resolvedTheme: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
}

const STORAGE_KEY = 'ivan-syniuk-theme'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode())
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemTheme())

  const resolvedTheme = mode === 'system' ? systemTheme : mode

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemTheme(getSystemTheme())
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const value = useMemo(
    () => ({ mode, resolvedTheme, setMode }),
    [mode, resolvedTheme, setMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
