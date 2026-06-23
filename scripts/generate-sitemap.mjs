import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const siteUrl = (process.env.SITE_URL ?? 'https://ivansinuyk.netlify.app').replace(/\/$/, '')
const postsDir = join(root, 'content', 'posts')
const publicDir = join(root, 'public')

const staticPages = [
  { path: '/', priority: '1.0' },
  { path: '/blog', priority: '0.9' },
  { path: '/about', priority: '0.7' },
  { path: '/contact', priority: '0.6' },
]

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function parseDate(raw) {
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\ndate:\s*(\S+)/)
  return match?.[1] ?? null
}

function formatLastmod(date) {
  if (!date) return null
  // Google prefers W3C datetime; date-only is valid for sitemaps
  return `${date}T00:00:00+00:00`
}

function slugFromFilename(filename) {
  return filename.replace(/\.md$/, '')
}

function toUrlEntry(path, { priority, lastmod }) {
  const loc = escapeXml(`${siteUrl}${path}`)
  const lastmodTag = lastmod ? `\n    <lastmod>${formatLastmod(lastmod)}</lastmod>` : ''
  return `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n    <priority>${priority}</priority>\n  </url>`
}

const postEntries = readdirSync(postsDir)
  .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
  .map((file) => {
    const raw = readFileSync(join(postsDir, file), 'utf8')
    const slug = slugFromFilename(file)
    const date = parseDate(raw)
    return toUrlEntry(`/blog/${slug}`, {
      priority: '0.8',
      lastmod: date,
    })
  })

const staticEntries = staticPages.map((page) => toUrlEntry(page.path, page))

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...postEntries].join('\n')}
</urlset>`

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`

writeFileSync(join(publicDir, 'sitemap.xml'), sitemap, { encoding: 'utf8' })
writeFileSync(join(publicDir, 'robots.txt'), robots, { encoding: 'utf8' })

console.log(`Generated sitemap.xml and robots.txt for ${siteUrl}`)
