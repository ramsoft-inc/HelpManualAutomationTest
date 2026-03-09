// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'OmegaAI User Guide',
  tagline: 'Your Guide to Mastering OmegaAI',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://help.omegaai.com/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  //organizationName: 'RamSoft', // Usually your GitHub org/user name.
  //projectName: 'docusaurus', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt-BR'],
  },
  headTags: [
   {
      tagName: 'meta',
      attributes: {
        name: 'robots',
        content: 'noindex, nofollow',
      },
    },
  ],
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
         // editUrl:
          //  'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          blogSidebarCount: 'ALL',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
         // editUrl:
          //  'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: {
          trackingID: 'G-8XB8X6634D',
          anonymizeIP: true,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      algolia: {
        'appId': 'LRX5Q4LFE0',
        'apiKey': process.env.ALGOLIA_API_KEY,
        'indexName': 'help-omegaai',
      },
      // Replace with your project's social card
      image: 'img/omegaai-user-guide-social.jpg',
      navbar: {
        title: 'Home',
        logo: {
          alt: 'OAI Logo',
          src: 'img/omega-ai-icon.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'User Guide',
          },
          {to: '/blog', label: 'News', position: 'left'},
        {to: '/resources', label: 'Resources', position: 'left'},
        {
          type: 'localeDropdown',
          position: 'right',
        },
          {
            href: 'https://www.omegaai.com',
            label: 'OmegaAI',
            position: 'right',
          },
          {
            href: 'https://blume.omegaai.com',
            label: 'Blume Patient Portal',
            position: 'right',
          },
          
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Company',
            items: [
              {
                label: 'About us',
                href: 'https://www.ramsoft.com/company/about-us',
              },
              {
                label: 'Compliance',
                href: 'https://www.ramsoft.com/compliance',
              },
              {
                label: 'Contact Us',
                href: 'https://www.ramsoft.com/contact-us',
              },
            ],
          },
          {
            title: 'Resources',
            items: [
              {
                label: 'Privacy policy',
                href: 'https://www.ramsoft.com/privacy-policy',
              },
              {
                label: 'Resources',
                href: 'https://www.ramsoft.com/resources',
              },
            ],
          },
          {
            title: 'Socials',
            items: [
              {
                label: 'Facebook',
                href: 'https://www.facebook.com/RamSoft.Inc/',
              },
              {
                label: 'LinkedIn',
                href: 'https://www.linkedin.com/company/ramsoft/',
              },
              {
                label: 'Instagram',
                href: 'https://www.instagram.com/ramsoft.ai/',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/Ramsoft',
              },
              {
                label: 'YouTube',
                href: 'https://www.youtube.com/@RamSoftInc',
              },
              {
                label: 'Threads',
                href: 'https://www.threads.net/@ramsoft.ai',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} RamSoft.`,
        logo: {
          alt: 'Footer Logo',
          src: 'img/RamSoft_Logo_BW-Reverse_Horizontal_RGB.svg',
        },
      },

      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
