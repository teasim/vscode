import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react";

export const decorators = [
  withThemeByDataAttribute({
    themes: {
      light: "light",
      dark: "dark",
    },
    defaultTheme: "light",
  }),
  (Story: any) => <Story />,
];

const preview: Preview = {
  parameters: {
    layout: "padded",
    actions: {
      argTypesRegex: "^on[A-Z].*",
    },
    toolbars: {
      position: "right",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    options: {
      rightPanelWidth: 500,
      panelPosition: "right",
      storySort: {
        order: ["layout", [], "typography", [], "controls", [], "components", [], "utilities", []],
      },
    },
    msw: {
      handlers: [],
    },
    backgrounds: { padding: 0 },
  },
};

export default preview;
