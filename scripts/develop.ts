import fs from "fs-extra";

async function run() {
  // Change package.json name to "teasim" temporary
  // as VS Code will append it with the publisher, causing the dev extension fail to override the production extension.
  const json = await fs.readJSON(new URL("../package.json", import.meta.url));
  if (json.name !== "teasim") {
    json.name = "teasim";
    await fs.writeJSON(new URL("../package.json", import.meta.url), json, { spaces: 2, EOL: "\n" });

    console.log('Update package.json name to "teasim"');
  }
}

run();
