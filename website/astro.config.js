import { defineConfig } from 'astro/config'
import { unified } from '@astrojs/markdown-remark'
import starlight from '@astrojs/starlight'
import llmsTxt from 'starlight-llms-txt'
import { viewTransitions } from 'astro-vtbot/starlight-view-transitions'
import { rehypeNormalizeContent } from './rehype.js'

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
            name: 'google-site-verification',
            content: 'JbpBLn9A_qAr4OqSunPoFWeahyME9dMplBMUsaOK_I4'
          }
        }
      ],
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
