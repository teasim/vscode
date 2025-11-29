import type { StorybookConfig } from "storybook-react-rsbuild";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

  addons: ["@storybook/addon-links"],

  docs: {
    defaultName: "Documentation",
  },

  typescript: {
    reactDocgen: "react-docgen-typescript",
    check: false,
  },

  framework: {
    name: "storybook-react-rsbuild",
    options: {},
  },

  previewHead: (head) => `
    ${head}
    ${"<style>.sb-show-main {background: var(--color-background);}</style>"}
  `,
};

export default config;
