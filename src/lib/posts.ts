export type PostMeta = {
  slug: string
  title: string
  date: string
  excerpt: string
  demoUrl?: string
}

export type Post = PostMeta & {
  content: string
}

const postFiles = import.meta.glob('../../content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function slugFromPath(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.md$/, '')
}

function parseFrontmatter(raw: string): { data: Record<string, string>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    return { data: {}, content: raw }
  }

  const data: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim()
    data[key] = value
  }

  return { data, content: match[2] }
}

function parsePost(path: string, raw: string): Post {
  const { data, content } = parseFrontmatter(raw)
  const slug = slugFromPath(path)

  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? '',
    excerpt: data.excerpt ?? '',
    demoUrl: data.demoUrl,
    content: content.trim(),
  }
}

const posts: Post[] = Object.entries(postFiles)
  .map(([path, raw]) => parsePost(path, raw))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

export function getAllPosts(): PostMeta[] {
  return posts.map(({ slug, title, date, excerpt, demoUrl }) => ({
    slug,
    title,
    date,
    excerpt,
    demoUrl,
  }))
}

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug)
}
