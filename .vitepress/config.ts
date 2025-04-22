import path from "node:path";
import process from "node:process";
import { generateSidebar } from "@mahoo-note/vp-sidebar";
import { BiDirectionalLinks } from "@nolebase/markdown-it-bi-directional-links";
import { UnlazyImages } from "@nolebase/markdown-it-unlazy-img";

import {
  GitChangelog,
  GitChangelogMarkdownSection,
} from "@nolebase/vitepress-plugin-git-changelog/vite";
import { InlineLinkPreviewElementTransform } from "@nolebase/vitepress-plugin-inline-link-preview/markdown-it";
import { transformHeadMeta } from "@nolebase/vitepress-plugin-meta";
import { buildEndGenerateOpenGraphImages } from "@nolebase/vitepress-plugin-og-image/vitepress";
import {
  PageProperties,
  PagePropertiesMarkdownSection,
} from "@nolebase/vitepress-plugin-page-properties/vite";
import { ThumbnailHashImages } from "@nolebase/vitepress-plugin-thumbnail-hash/vite";
import MarkdownItFootnote from "markdown-it-footnote";
import MarkdownItMathjax3 from "markdown-it-mathjax3";

import {
  defineConfig as defineUnocssConfig,
  presetAttributify,
  presetIcons,
  presetUno,
} from "unocss";

import UnoCSS from "unocss/vite";
import Components from "unplugin-vue-components/vite";
import Inspect from "vite-plugin-inspect";

import { defineConfig } from "vitepress";

import {
  creatorNames,
  creators,
  creatorUsernames,
  discordLink,
  githubRepoLink,
  include,
  siteDescription,
  siteName,
  srcDir,
  targetDomain,
} from "./metadata";
import MarkdownIt from "markdown-it";

const unocssConfig = defineUnocssConfig({
  shortcuts: [
    [
      "btn",
      "px-4 py-1 rounded inline-flex justify-center gap-2 text-white leading-30px children:mya !no-underline cursor-pointer disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50",
    ],
  ],
  presets: [
    presetUno({
      dark: "class",
    }),
    presetAttributify(),
    presetIcons({
      prefix: "i-",
      scale: 1.2, // size: 1.2 rem
      extraProperties: {
        display: "inline-block",
        "vertical-align": "middle",
        "min-width": "1.2rem",
      },
      warn: true,
    }),
  ],
});

const ImageRule = (md: MarkdownIt) => {
  const defaultRender = md.renderer.rules.image!;

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    let src = token.attrGet("src");
    if (src) {
      // 仅处理非绝对路径和非hash的情况
      if (
        !/^(https?:)?\/\//.test(src) &&
        !src.startsWith("/") &&
        !src.startsWith("#")
      ) {
        token.attrSet("src", `./_resources/${src}`);
      }

      return defaultRender(tokens, idx, options, env, self);
    }
    return "";
  };
};

export default defineConfig({
  srcDir,
  lang: "zh-CN",
  title: siteName,
  description: siteDescription,
  ignoreDeadLinks: true,
  head: [
    [
      "meta",
      {
        name: "theme-color",
        content: "#ffffff",
      },
    ],
    [
      "link",
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
        sizes: "180x180",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        href: "/logo.svg",
        type: "image/svg+xml",
      },
    ],
    [
      "link",
      {
        rel: "alternate icon",
        href: "/favicon.ico",
        type: "image/png",
        sizes: "16x16",
      },
    ],
    [
      "meta",
      {
        name: "author",
        content: creatorNames.join(", "),
      },
    ],
    [
      "meta",
      {
        name: "keywords",
        content: [
          "markdown",
          "knowledge-base",
          "知识库",
          "vitepress",
          "obsidian",
          "notebook",
          "notes",
          ...creatorUsernames,
        ].join(", "),
      },
    ],

    [
      "meta",
      {
        property: "og:title",
        content: siteName,
      },
    ],
    [
      "meta",
      {
        property: "og:image",
        content: `${targetDomain}/og.png`,
      },
    ],
    [
      "meta",
      {
        property: "og:description",
        content: siteDescription,
      },
    ],
    [
      "meta",
      {
        property: "og:site_name",
        content: siteName,
      },
    ],

    [
      "meta",
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
    [
      "meta",
      {
        name: "twitter:creator",
        content: creatorUsernames.join(", "),
      },
    ],
    [
      "meta",
      {
        name: "twitter:image",
        content: `${targetDomain}/og.png`,
      },
    ],

    [
      "link",
      {
        rel: "mask-icon",
        href: "/safari-pinned-tab.svg",
        color: "#927baf",
      },
    ],
    [
      "link",
      {
        rel: "manifest",
        href: "/site.webmanifest",
      },
    ],
    [
      "meta",
      {
        name: "msapplication-TileColor",
        content: "#603cba",
      },
    ],
    // Proxying Plausible through Netlify | Plausible docs
    // https://plausible.io/docs/proxy/guides/netlify
    [
      "script",
      {
        defer: "true",
        "data-domain": "nolebase.ayaka.io",
        "data-api": "/api/v1/page-external-data/submit",
        src: "/assets/page-external-data/js/script.js",
      },
    ],
  ],
  themeConfig: {
    outline: { label: "页面大纲", level: "deep" },
    darkModeSwitchLabel: "切换主题",
    // editLink: {
    //   pattern: `${githubRepoLink}/tree/main/:path`,
    //   text: '编辑本页面',
    // },
    socialLinks: [
      { icon: "github", link: githubRepoLink },
      { icon: "discord", link: discordLink },
    ],
    footer: {
      message: '用 <span style="color: #e25555;">&#9829;</span> 撰写',
      copyright:
        '<a class="footer-cc-link" target="_blank" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> © 2022-PRESENT MahooNote 的创作者们',
    },
    search: {
      provider: "local",
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: "搜索文档",
                buttonAriaLabel: "搜索文档",
              },
              modal: {
                noResultsText: "无法找到相关结果",
                resetButtonTitle: "清除查询条件",
                footer: {
                  selectText: "选择",
                  navigateText: "切换",
                },
              },
            },
          },
        },

        // Add title ang tags field in frontmatter to search
        // You can exclude a page from search by adding search: false to the page's frontmatter.
        _render(src, env, md) {
          // without `md.render(src, env)`, the some information will be missing from the env.
          let html = md.render(src, env);
          let tagsPart = "";
          let headingPart = "";
          let contentPart = "";
          let fullContent = "";
          const sortContent = () =>
            [headingPart, tagsPart, contentPart] as const;
          let { frontmatter, content } = env;

          if (!frontmatter) return html;

          if (frontmatter.search === false) return "";

          contentPart = content ||= src;

          const headingMatch = content.match(/^# .*/m);
          const hasHeading = !!(
            headingMatch &&
            headingMatch[0] &&
            headingMatch.index !== undefined
          );

          if (hasHeading) {
            const headingEnd = headingMatch.index! + headingMatch[0].length;
            headingPart = content.slice(0, headingEnd);
            contentPart = content.slice(headingEnd);
          } else if (frontmatter.title) {
            headingPart = `# ${frontmatter.title}`;
          }

          const tags = frontmatter.tags;
          if (tags && Array.isArray(tags) && tags.length)
            tagsPart = `Tags: #${tags.join(", #")}`;

          fullContent = sortContent().filter(Boolean).join("\n\n");

          html = md.render(fullContent, env);

          return html;
        },
      },
    },
    nav: [
      { text: "主页", link: "/" },
      ...include.map(({link, text}) => ({ text, link: `/${link}/` })),
      { text: "最近更新", link: "/toc" },
    ],
    sidebar: generateSidebar(
      include.map(({link, text}) => ({
        documentRootPath: srcDir,
        scanStartPath: link,
        basePath: `/${link}/`,
        resolvePath: `/${link}/`,
        collapsed: true,
        useTitleFromFrontmatter: true,
        useTitleFromFileHeading: false,
        useFolderTitleFromIndexFile: true,
        excludePattern: ["README.md"],
        excludeFilesByFrontmatterFieldNames: [
          "excalidraw-plugin",
          "kanban-plugin",
        ],
      }))
    ),
  },
  markdown: {
    theme: {
      light: "github-light",
      dark: "one-dark-pro",
    },
    math: true,
    config: (md) => {
      md.use(MarkdownItFootnote);
      md.use(MarkdownItMathjax3);
      md.use(
        BiDirectionalLinks({
          dir: process.cwd(),
        })
      );
      md.use(ImageRule);
      // // md.use(UnlazyImages() as any, {
      // //   imgElementTag: 'NolebaseUnlazyImg',
      // // })
      // md.use(InlineLinkPreviewElementTransform as any)
    },
  },
  async transformHead(context) {
    let head = [...context.head];

    const returnedHead = await transformHeadMeta()(head, context);
    if (typeof returnedHead !== "undefined") head = returnedHead;

    return head;
  },
  async buildEnd(siteConfig) {
    await buildEndGenerateOpenGraphImages({
      baseUrl: targetDomain,
      category: {
        byLevel: 2,
      },
    })(siteConfig);
  },
  vue: {
    template: {
      transformAssetUrls: {
        video: ["src", "poster"],
        source: ["src"],
        img: ["src"],
        image: ["xlink:href", "href"],
        use: ["xlink:href", "href"],
        NolebaseUnlazyImg: ["src"],
      },
    },
  },
  vite: {
    resolve: {
      alias: {
        "~": path.resolve(__dirname),
        // '@mahoo-note/vp-sidebar': import.meta.env.MODE === 'development'
        //   ? path.resolve(__dirname, 'packages/@mahoo-note/vp-sidebar/src')
        //   : path.resolve(__dirname, 'packages/@mahoo-note/vp-sidebar/dist'),
      },
    },
    assetsInclude: ["**/*.mov"],
    optimizeDeps: {
      // vitepress is aliased with replacement `join(DIST_CLIENT_PATH, '/index')`
      // This needs to be excluded from optimization
      exclude: ["vitepress"],
    },
    plugins: [
      // Inspect(),
      // GitChangelog({
      //   repoURL: () => githubRepoLink,
      //   // mapAuthors: creators,
      // }),
      // GitChangelogMarkdownSection({
      //   excludes: [
      //     'toc.md',
      //     'index.md',
      //   ],
      // }),
      // PageProperties(),
      // PagePropertiesMarkdownSection({
      //   excludes: [
      //     'toc.md',
      //     'index.md',
      //   ],
      // }),
      // // ThumbnailHashImages(),
      // Components({
      //   include: [/\.vue$/, /\.md$/],
      //   dirs: '.vitepress/theme/components',
      //   dts: '.vitepress/components.d.ts',
      // }),
      UnoCSS(unocssConfig),
    ],
    ssr: {
      noExternal: [
        "@nolebase/vitepress-plugin-enhanced-readabilities",
        "@nolebase/vitepress-plugin-highlight-targeted-heading",
        "@nolebase/vitepress-plugin-inline-link-preview",
      ],
    },
  },
});
