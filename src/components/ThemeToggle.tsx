import { useTheme, type ThemeMode } from '../context/ThemeContext'
import styles from './ThemeToggle.module.css'

const options: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function ThemeToggle() {
  const { mode, setMode } = useTheme()

  return (
    <div className={styles.toggle} role="group" aria-label="Theme">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={mode === option.value ? styles.active : undefined}
          aria-pressed={mode === option.value}
          onClick={() => setMode(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
