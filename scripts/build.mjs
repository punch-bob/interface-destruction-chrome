import { cp, mkdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
export const buildExtension = async (build, nodePaths = []) => {
  const output = path.join(root, "dist");
  await mkdir(output, { recursive: true });
  await cp(path.join(root, "src/help.html"), path.join(output, "help.html"));
  await cp(path.join(root, "src/help.css"), path.join(output, "help.css"));
  const inlineCss = {
    name: "inline-css",
    setup(plugin) {
      plugin.onResolve({ filter: /\.css\?inline$/ }, (args) => ({
        path: path.resolve(args.resolveDir, args.path.replace(/\?inline$/, "")),
        namespace: "inline-css",
      }));
      plugin.onLoad(
        { filter: /.*/, namespace: "inline-css" },
        async (args) => ({
          contents: await readFile(args.path, "utf8"),
          loader: "text",
        }),
      );
    },
  };
  await build({
    entryPoints: [path.join(root, "src/content.tsx")],
    outfile: path.join(output, "content.js"),
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "chrome110",
    jsx: "automatic",
    minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
    nodePaths,
    plugins: [inlineCss],
  });
  await cp(
    path.join(root, "manifest.json"),
    path.join(output, "manifest.json"),
  );
  await cp(
    path.join(root, "src/background.js"),
    path.join(output, "background.js"),
  );
  await cp(
    path.join(root, "src/destruction/assets"),
    path.join(output, "assets"),
    { recursive: true },
  );
  await cp(path.join(root, "icons"), path.join(output, "icons"), {
    recursive: true,
  });
  // Поддерживаем установку ZIP из корня, не только из dist.
  const installedAtRoot = await access(path.join(root, "content.js")).then(
    () => true,
    () => false,
  );
  if (installedAtRoot) await cp(output, root, { recursive: true });
  console.log("Готово: dist/ — расширение для загрузки в Chrome");
};
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { build } = await import("esbuild");
  await buildExtension(build);
}
