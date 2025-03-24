import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Halodot.io',
  tagline: 'SDK Documentation',
  favicon: '/img/favicon-32x32.png',

  // Set the production url of your site here
  url: 'http://docs.halodot.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'facebook', // Usually your GitHub org/username.
  projectName: 'halo_sdk_docusaurus', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl: 'https://github.com/halo-dot/halo-documentation',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/halo-dot/halo-documentation',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [],
  themeConfig: {
    metadata:[
      {
        name: 'algolia-site-verification',
        content: 'EC2FE34B58BA9FB0'
      }
    ],
    image: 'https://cdn.prod.website-files.com/63f8ad30f40a41f7b046d567/67ac8d81adc0bbd4b1e9e0dc_Image.png',
    navbar: {
      logo: {
        alt: 'halo dot Logo',
        src: 'https://cdn.prod.website-files.com/63f8ad30f40a41f7b046d567/63fdb37c730d1f0e75df5d44_Logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'documentationSidebar',
          position: 'left',
          label: 'Documentation',
        },
        // {
        //   type: 'docSidebar',
        //   sidebarId: 'tutorialSidebar',
        //   position: 'left',
        //   label: 'Tutorial',
        // },
        // {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/halo-dot/test_app-android_sdk',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Documentation',
              to: '/docs/documentations/intro',
            },
            // {
            //   label: 'Tutorials',
            //   to: '/docs/tutorials/intro',
            // },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Halodot.io',
              href: 'https://halodot.io/',
            },
            {
              label: 'Synthesis',
              href: 'https://www.synthesis.co.za/',
            },
            {
              label: 'LinkedIn',
              href: 'https://www.linkedin.com/company/halo-dot/',
            },
          ],
        },
        {
          title: 'More',
          items: [
            // {
            //   label: 'Blog',
            //   to: '/blog',
            // },
            {
              label: 'GitHub',
              href: 'https://github.com/halo-dot/test_app-android_sdk',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Halodot.io.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    algolia: {
      // The application ID provided by Algolia
      appId: 'S2W3MQE857',

      // Public API key: it is safe to commit it
      apiKey: '30114c9f8022e361f11991f495f93d1a',

      indexName: 'halo',

      // // Optional: see doc section below
      // contextualSearch: true,

      // // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
      // externalUrlRegex: 'external\\.com|domain\\.com',

      // // Optional: Replace parts of the item URLs from Algolia. Useful when using the same search index for multiple deployments using a different baseUrl. You can use regexp or string in the `from` param. For example: localhost:3000 vs myCompany.com/docs
      // replaceSearchResultPathname: {
      //   from: '/docs/', // or as RegExp: /\/docs\//
      //   to: '/',
      // },

      // Optional: Algolia search parameters
      searchParameters: {},

      // Optional: path for search page that enabled by default (`false` to disable it)
      searchPagePath: 'search',

      // Optional: whether the insights feature is enabled or not on Docsearch (`false` by default)
      insights: false,

      //... other Algolia params
    },

  } satisfies Preset.ThemeConfig,
};

export default config;
