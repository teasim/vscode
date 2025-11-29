import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSvgr } from "@rsbuild/plugin-svgr";
import { postcssPlugins } from "@teasim/styles/postcss";

export default defineConfig({
  tools: {
    rspack: {
      resolve: { fallback: { crypto: false, fs: false } },
    },
    postcss: {
      postcssOptions: { plugins: postcssPlugins },
    },
  },
  plugins: [pluginSvgr(), pluginReact()],
  output: {
    charset: "utf8",
    distPath: { root: "build" },
  },
});
