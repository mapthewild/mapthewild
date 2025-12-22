import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const posts = await getCollection('posts')
  const publishedPosts = posts
    .filter(post => !post.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())

  return rss({
    title: 'Map the Wild',
    description: 'Tools for thinking, prototypes, and explorations at the edges of knowledge',
    site: context.site || 'https://mapthewild.github.io/mapthewild/',
    items: publishedPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/mapthewild/posts/${post.slug}/`,
    })),
    customData: '<language>en-us</language>',
  })
}
