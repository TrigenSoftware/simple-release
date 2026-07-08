import { defineConfig } from 'astro/config'
import { unified } from '@astrojs/markdown-remark'
import starlight from '@astrojs/starlight'
import llmsTxt from 'starlight-llms-txt'
import { viewTransitions } from 'astro-vtbot/starlight-view-transitions'
import { rehypeNormalizeContent } from './rehype.js'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  site: 'https://simple-release.js.org',
  markdown: {
    processor: unified({
      rehypePlugins: [rehypeNormalizeContent]
    })
  },
  integrations: [
    starlight({
      title: 'Simple Release',
      description: 'A simple tool to automate version bumps, changelogs, and releases using Conventional Commits.',
      favicon: '/favicon.svg',
      head: [
        {
          tag: 'meta',
          attrs: {
            name: 'format-detection',
            content: 'telephone=no'
          }
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://simple-release.js.org/og-image.jpg'
          }
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:width',
            content: '1200'
          }
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:height',
            content: '630'
          }
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:type',
            content: 'image/jpeg'
          }
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:card',
            content: 'summary_large_image'
          }
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:image',
            content: 'https://simple-release.js.org/og-image.jpg'
          }
        },
        isProduction && {
          tag: 'script',
          attrs: {
            'src': 'https://cloud.umami.is/script.js',
            'data-website-id': 'b1c78f43-8e0d-4063-a917-1998fa5dee1e',
            'defer': true
          }
        },
        {
          tag: 'meta',
          attrs: {
            name: 'google-site-verification',
            content: 'JbpBLn9A_qAr4OqSunPoFWeahyME9dMplBMUsaOK_I4'
          }
        }
      ].filter(Boolean),
      social: [
        {
          label: 'GitHub',
          icon: 'github',
          href: 'https://github.com/TrigenSoftware/simple-release'
        }
      ],
      editLink: {
        baseUrl: 'https://github.com/TrigenSoftware/simple-release/edit/main/website/'
      },
      plugins: [llmsTxt(), viewTransitions()],
      sidebar: [
        {
          label: 'Getting Started',
          items: [{
            autogenerate: {
              directory: 'getting-started'
            }
          }]
        },
        {
          label: 'GitHub Action',
          items: [{
            autogenerate: {
              directory: 'github-action'
            }
          }]
        },
        {
          label: 'JS API',
          items: [{
            autogenerate: {
              directory: 'js-api'
            }
          }]
        },
        {
          label: 'Hostings',
          items: [{
            autogenerate: {
              directory: 'hostings'
            }
          }]
        },
        {
          label: 'Project Types',
          items: [{
            autogenerate: {
              directory: 'project-types'
            }
          }]
        }
      ],
      customCss: ['./src/styles/global.css'],
      expressiveCode: {
        themes: ['github-dark-high-contrast', 'github-light-default'],
        frames: {
          extractFileNameFromCode: false
        }
      }
    })
  ]
})
