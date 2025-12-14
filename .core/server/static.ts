import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: express.Express) {
    const distPath = path.resolve(__dirname, "../dist/public");
    if (!fs.existsSync(distPath)) {
        throw new Error(
            `Could not find the build at ${distPath}. Did you run 'npm run build'?`
        );
    }
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
    });
}
