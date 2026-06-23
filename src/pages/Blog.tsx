import { PostCard } from '../components/PostCard'
import { getAllPosts } from '../lib/posts'
import styles from './Blog.module.css'

export function Blog() {
  const posts = getAllPosts()

  return (
    <div className="container">
      <header className={styles.header}>
        <h1>Blog</h1>
        <p>Notes on React Native, camera APIs, Skia, and mobile development.</p>
      </header>

      <div className={styles.list}>
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}
