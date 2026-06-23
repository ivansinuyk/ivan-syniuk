import { Avatar } from '../components/Avatar'
import { site } from '../data/site'
import styles from './About.module.css'

export function About() {
  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.header}>
        <Avatar />
        <div>
          <h1>About</h1>
          <p className={styles.location}>{site.location}</p>
        </div>
      </div>

      <p className={styles.bio}>{site.bio}</p>

      <section>
        <h2>Skills & stack</h2>
        <ul className={styles.skills}>
          {site.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Links</h2>
        <ul className={styles.links}>
          <li>
            <a href={site.social.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </li>
          <li>
            <a href={site.social.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </li>
          <li>
            <a href={site.social.twitter} target="_blank" rel="noreferrer">
              X / Twitter
            </a>
          </li>
          <li>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </li>
        </ul>
      </section>
    </div>
  )
}
