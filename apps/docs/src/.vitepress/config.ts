import { fileURLToPath } from "node:url";

import { transformerTwoslash } from "@shikijs/vitepress-twoslash";
import { createFileSystemTypesCache } from "@shikijs/vitepress-twoslash/cache-fs";
import ts from "typescript";
import { defineConfig } from "vitepress";

const repoRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const twoslashCacheDir = fileURLToPath(
  new URL("./cache/twoslash", import.meta.url),
);

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default defineConfig({
  title: "SeqWire",
  description:
    "Typed shared-memory research for workers, AudioWorklets, and WebAssembly-oriented runtimes.",
  cleanUrls: true,
  lastUpdated: true,
  markdown: {
    theme: {
      light: "light-plus",
      dark: "dark-plus",
    },
    languages: ["js", "jsx", "ts", "tsx", "json", "vue", "sh", "mermaid"],
    defaultHighlightLang: "txt",
    codeTransformers: [
      transformerTwoslash({
        typesCache: createFileSystemTypesCache({
          dir: twoslashCacheDir,
        }),
        twoslashOptions: {
          compilerOptions: {
            allowSyntheticDefaultImports: true,
            baseUrl: repoRoot,
            exactOptionalPropertyTypes: true,
            lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
            module: ts.ModuleKind.ESNext,
            moduleDetection: ts.ModuleDetectionKind.Force,
            moduleResolution: ts.ModuleResolutionKind.Bundler,
            noUncheckedIndexedAccess: true,
            paths: {
              "@exclave/seqwire": ["packages/core/src/index.ts"],
              "@exclave/seqwire/diagnostics": [
                "packages/core/src/diagnostics.ts",
              ],
            },
            skipLibCheck: true,
            strict: true,
            target: ts.ScriptTarget.ES2022,
            types: [],
            verbatimModuleSyntax: true,
          },
        },
      }),
    ],
    config(md) {
      const defaultFence = md.renderer.rules.fence;

      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const language = token.info.trim().split(/\s+/u)[0];

        if (language === "mermaid") {
          return [
            '<div class="mermaid-card" data-mermaid>',
            `<pre class="mermaid-source">${escapeHtml(token.content)}</pre>`,
            '<div class="mermaid-render" aria-hidden="true"></div>',
            "</div>",
          ].join("");
        }

        if (defaultFence) {
          return defaultFence(tokens, idx, options, env, self);
        }

        return self.renderToken(tokens, idx, options);
      };
    },
  },
  themeConfig: {
    nav: [
      { text: "Overview", link: "/" },
      { text: "API", link: "/api" },
      { text: "Architecture", link: "/core-flow" },
      { text: "Verification", link: "/release-checklist" },
    ],
    outline: {
      level: [2, 3],
    },
    sidebar: [
      {
        text: "Start",
        items: [
          { text: "Overview", link: "/" },
          { text: "Local setup", link: "/install" },
          { text: "Quickstart", link: "/quickstart" },
          { text: "Verification", link: "/release-checklist" },
        ],
      },
      {
        text: "Core concepts",
        items: [
          { text: "SeqWire Flow", link: "/core-flow" },
          { text: "Authored AST vs Runtime", link: "/authoring-contract" },
          { text: "Handoff and Acceptance", link: "/handoff-acceptance" },
          { text: "Controller, Processor, Observer", link: "/roles" },
        ],
      },
      {
        text: "API",
        items: [
          { text: "API Reference", link: "/api" },
          { text: "Diagnostics", link: "/diagnostics" },
          { text: "Error Model", link: "/error-model" },
        ],
      },
      {
        text: "Examples",
        items: [{ text: "Examples", link: "/examples" }],
      },
      {
        text: "Internals",
        items: [
          { text: "Memory and Layout Model", link: "/memory-layout" },
          { text: "Package Boundaries", link: "/package-boundaries" },
        ],
      },
      {
        text: "Research context",
        items: [
          { text: "Research lineage", link: "/research-lineage" },
          { text: "Blog Index", link: "/blog/" },
          {
            text: "Why SeqWire exists",
            link: "/blog/why-seqwire-exists",
          },
          {
            text: "Specs, layout, and handoff",
            link: "/blog/specs-layout-handoff-runtime-contract",
          },
        ],
      },
      {
        text: "Reference",
        items: [{ text: "FAQ", link: "/faq" }],
      },
    ],
    search: {
      provider: "local",
    },
  },
});
