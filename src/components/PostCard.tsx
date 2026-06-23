import { Link } from 'react-router-dom'
import type { PostMeta } from '../lib/posts'
import styles from './PostCard.module.css'

type PostCardProps = {
  post: PostMeta
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className={styles.card}>
      <time className={styles.date} dateTime={post.date}>
        {formatDate(post.date)}
      </time>
      <h2>
        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <p>{post.excerpt}</p>
      <Link to={`/blog/${post.slug}`} className={styles.readMore}>
        Read more →
      </Link>
    </article>
  )
}
