import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { PostCard } from '../components/PostCard'
import { site } from '../data/site'
import { getAllPosts } from '../lib/posts'
import styles from './Home.module.css'

export function Home() {
  const latestPosts = getAllPosts().slice(0, 3)

  return (
    <div className="container">
      <section className={styles.hero}>
        <Avatar />
        <div>
          <p className={styles.eyebrow}>{site.tagline}</p>
          <h1>{site.name}</h1>
          <p className={styles.lead}>{site.bio}</p>
          <div className={styles.actions}>
            <Link to="/blog" className="button">
              Read the blog
            </Link>
            <Link to="/contact" className="button button--ghost">
              Get in touch
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Latest posts</h2>
          <Link to="/blog">View all</Link>
        </div>
        <div className={styles.grid}>
          {latestPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  )
}
