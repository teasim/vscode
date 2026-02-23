import type { StorybookConfig } from "storybook-react-rsbuild";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

  addons: ["@storybook/addon-themes"],

  docs: {
    defaultName: "@teasim/styles",
  },

  typescript: {
    reactDocgen: "react-docgen-typescript",
    check: false,
  },

  framework: {
    name: "storybook-react-rsbuild",
    options: {},
  },

  previewBody: (body) => `
    <style>
      .sb-show-main {background: var(--color-background);}
    </style>
    ${body}
  `,
};

export default config;
