import fs from "node:fs";
import path from "node:path";
import { Plugin } from "vitepress";

export default (
  options = { srcDir: "", optional: ["README.md"] }
) =>
  ({
    name: "vitepress-custom-default-docs",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (req.url && req.url.includes("index.md")) {
            const urlPath = decodeURI(req.url?.split("?")[0]);
            const filePath = path.join(process.cwd(), options.srcDir, urlPath);
            if (!fs.existsSync(filePath)) {
              for (const defaultFile of options.optional) {
                const candidate = filePath.replace(/index\.md$/, defaultFile);
                if (fs.existsSync(candidate)) {
                  req.url = urlPath.replace(/index\.md$/, defaultFile);
                  break;
                }
              }
            }
          }
        } catch {}
        next();
      });
    },
  } as Plugin);
