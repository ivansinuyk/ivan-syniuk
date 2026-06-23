import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link, useParams } from 'react-router-dom'
import { getPostBySlug } from '../lib/posts'
import styles from './BlogPost.module.css'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function BlogPost() {
  const { slug } = useParams()
  const post = slug ? getPostBySlug(slug) : undefined

  if (!post) {
    return (
      <div className="container">
        <h1>Post not found</h1>
        <Link to="/blog">← Back to blog</Link>
      </div>
    )
  }

  return (
    <article className={`container ${styles.article}`}>
      <Link to="/blog" className={styles.back}>
        ← Back to blog
      </Link>

      <header>
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <h1>{post.title}</h1>
        {post.demoUrl ? (
          <p className={styles.demo}>
            <a href={post.demoUrl} target="_blank" rel="noreferrer">
              View demo code →
            </a>
          </p>
        ) : null}
      </header>

      <div className={styles.content}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>
    </article>
  )
}
