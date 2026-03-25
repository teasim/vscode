import { expect, test } from "bun:test";
import parserCSS from "prettier/parser-postcss";
import prettier from "prettier/standalone";
import { formatPreviewCSS } from "../src/utils";

test("tutorial: 2 + 2", () => {
  expect(2 + 2).toBe(4);
});

test("keeps color-mix declarations on one line in CSS previews", async () => {
  const css = `/* layer: default */
.text-red {
  color: color-mix(
    in srgb,
    var(--color-red) var(--ts-text-opacity),
    transparent
  );
}
`;

  expect(await formatPreviewCSS(css)).toContain(
    "color: color-mix(in srgb, var(--color-red) var(--ts-text-opacity), transparent);",
  );
});

test("matches Prettier output exactly when there are no multiline color declarations", async () => {
  const css = `/* layer: default */
.demo {
  padding: 1rem 2rem;
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.05),
    0 8px 24px rgb(0 0 0 / 0.12);
}

@media (min-width: 640px) {
  .demo {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
`;

  const prettified = await prettier.format(css, {
    parser: "css",
    plugins: [parserCSS],
  });

  expect(await formatPreviewCSS(css)).toBe(prettified);
});

test("keeps all multiline color declarations on one line", async () => {
  const css = `/* layer: default */
.text-red {
  display: inline-flex;
  color: var(
    --color-red,
    rgb(248 113 113 / 1)
  );
  background-color: color-mix(
    in srgb,
    var(--color-red) var(--ts-text-opacity),
    transparent
  );
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.05),
    0 8px 24px rgb(0 0 0 / 0.12);
}
`;

  expect(await formatPreviewCSS(css)).toBe(`/* layer: default */
.text-red {
  display: inline-flex;
  color: var(--color-red, rgb(248 113 113 / 1));
  background-color: color-mix(in srgb, var(--color-red) var(--ts-text-opacity), transparent);
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.05),
    0 8px 24px rgb(0 0 0 / 0.12);
}
`);
});
