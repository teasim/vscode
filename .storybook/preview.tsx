import { withThemeByClassName } from "@storybook/addon-themes";
import "../index.css";

export const decorators = [
  withThemeByClassName({
    themes: {
      light: "light",
      dark: "dark",
    },
    defaultTheme: "light",
  }),
  (Story: any) => (
    <div className="themes" data-has-background="true" data-scaling="100%" data-primary-color="teal" data-neutral-color="gray">
      <Story />
    </div>
  ),
];

const preview = {
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
      rightPanelWidth: 0,
      panelPosition: "right",
      storySort: {
        order: ["*"],
        method: "alphabetical",
      },
    },
    msw: {
      handlers: [],
    },
    backgrounds: { padding: 0 },
  },
};

export default preview;
