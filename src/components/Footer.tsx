import { site } from '../data/site'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <p>© {new Date().getFullYear()} {site.name} · {site.location}</p>
        <div className={styles.links}>
          <a href={site.social.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={site.social.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a href={site.social.twitter} target="_blank" rel="noreferrer">
            X
          </a>
          <a href={`mailto:${site.email}`}>Email</a>
        </div>
      </div>
    </footer>
  )
}
