import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import styles from './Header.module.css'

const links = [
  { to: '/', label: 'Home' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <NavLink to="/" className={styles.brand}>
          Ivan Syniuk
        </NavLink>

        <nav className={styles.nav} aria-label="Main">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
              end={link.to === '/'}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  )
}
