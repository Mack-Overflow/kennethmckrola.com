import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    articles: defineCollection({
      type: 'page',
      source: 'articles/*.md',
      schema: z.object({
        date: z.string(),
        tags: z.array(z.string()).default([]),
        kind: z.enum(['challenge', 'project', 'note']).default('challenge'),
        cover: z.string().optional(),
        draft: z.boolean().default(false),
        // dev.to syndication. Set devto: true and CI will publish it there with this site as canonical.
        devto: z.boolean().default(false),
        devto_id: z.number().optional(),
        devto_url: z.string().optional(),
        devto_hash: z.string().optional(),
      }),
    }),
  },
})
