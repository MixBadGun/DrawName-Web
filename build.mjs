/* 打包发布脚本：生成可部署到静态服务器的 dist 目录
 * 用法：
 *   npm run build                仅构建
 *   npm run preview              构建并启动本地预览（默认 http://127.0.0.1:8080）
 *   node build.mjs --no-images   构建时跳过图片压缩（原样拷贝）
 */
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import http from "node:http";
import path from "node:path";
import { build as esbuild } from "esbuild";
import { minify as minifyHtml } from "html-minifier-terser";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");

// 需要压缩的脚本（保持原文件名与相对路径，页面依靠全局函数互相调用）
const JS_FILES = ["toy_storage.js", "present/present.js", "maining.js", "export_txt.js"];
const CSS_FILES = ["css/color.css"];
const HTML_FILES = ["index.html"];
// 静态资源目录与单独文件
const COPY_DIRS = ["image", "sound"];
const COPY_FILES = ["favicon.ico", "robots.txt"];
// 图片按显示尺寸重新编码：max 为最长边像素，quality 为 webp 质量
const IMAGE_RULES = [
    { test: /^image\/chose(_\d+)?\.webp$/, max: 300, quality: 75 },
    { test: /^image\/avatar\.webp$/, max: 120, quality: 80 }
];

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".mp3": "audio/mpeg",
    ".txt": "text/plain; charset=utf-8"
};

async function exists(target) {
    try {
        await fs.access(target);
        return true;
    } catch (e) {
        return false;
    }
}

async function sizeOf(target) {
    const stat = await fs.stat(target);
    return stat.isDirectory() ? 0 : stat.size;
}

async function walk(dir, base = dir) {
    const found = [];
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            found.push(...await walk(full, base));
        } else {
            found.push(path.relative(base, full).split(path.sep).join("/"));
        }
    }
    return found;
}

function kb(bytes) {
    return (bytes / 1024).toFixed(1) + " KB";
}

function pad(text, width) {
    return String(text).padEnd(width, " ");
}

function ratio(before, after) {
    if (!before || before === after) return "-";
    return Math.round((1 - after / before) * 100) + "%";
}

// 用 esbuild 压缩单个 js / css 文件
async function minifyWithEsbuild(relPath) {
    const source = path.join(ROOT, relPath);
    const target = path.join(DIST, relPath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await esbuild({
        entryPoints: [source],
        outfile: target,
        minify: true,
        charset: "utf8",
        legalComments: "none",
        logLevel: "silent"
    });
    return { file: relPath, before: await sizeOf(source), after: await sizeOf(target) };
}

async function minifyHtmlFile(relPath) {
    const source = path.join(ROOT, relPath);
    const target = path.join(DIST, relPath);
    const html = await fs.readFile(source, "utf8");
    const minified = await minifyHtml(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeAttributeQuotes: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: false,
        useShortDoctype: true,
        minifyCSS: true,
        sortAttributes: false,
        caseSensitive: true
    });
    await fs.writeFile(target, minified, "utf8");
    return { file: relPath, before: Buffer.byteLength(html), after: Buffer.byteLength(minified) };
}

// 拷贝单个资源，命中图片规则时按显示尺寸重新编码
async function copyAsset(task, sharpLib) {
    const { rel, srcFile, dstFile, rule } = task;
    await fs.mkdir(path.dirname(dstFile), { recursive: true });
    const before = await sizeOf(srcFile);
    if (sharpLib && rule) {
        const meta = await sharpLib(srcFile, { animated: true }).metadata();
        if (Math.max(meta.width, meta.height) > rule.max) {
            await sharpLib(srcFile, { animated: true })
                .resize({ width: rule.max, height: rule.max, fit: "inside", withoutEnlargement: true })
                .webp({ quality: rule.quality, effort: 4 })
                .toFile(dstFile);
            return { file: rel, before, after: await sizeOf(dstFile) };
        }
    }
    await fs.copyFile(srcFile, dstFile);
    return { file: rel, before, after: before };
}

async function copyAssets(optimizeImages) {
    let sharpLib = null;
    if (optimizeImages) {
        try {
            sharpLib = (await import("sharp")).default;
        } catch (e) {
            console.log("⚠ 未安装 sharp，跳过图片压缩（npm i -D sharp）");
        }
    }
    const tasks = [];
    for (const dir of COPY_DIRS) {
        const source = path.join(ROOT, dir);
        if (!(await exists(source))) continue;
        for (const rel of await walk(source, ROOT)) {
            tasks.push({
                rel,
                srcFile: path.join(ROOT, rel),
                dstFile: path.join(DIST, rel),
                rule: IMAGE_RULES.find((item) => item.test.test(rel))
            });
        }
    }
    for (const rel of COPY_FILES) {
        const srcFile = path.join(ROOT, rel);
        if (await exists(srcFile)) {
            tasks.push({ rel, srcFile, dstFile: path.join(DIST, rel), rule: null });
        }
    }
    // 图片编码是 CPU 密集操作，限制并发同时处理
    const rows = [];
    let next = 0;
    const worker = async () => {
        while (next < tasks.length) {
            rows.push(await copyAsset(tasks[next++], sharpLib));
        }
    };
    await Promise.all(Array.from({ length: Math.min(4, tasks.length) }, worker));
    return rows.sort((a, b) => a.file.localeCompare(b.file));
}

// 检查 html 里引用的本地资源是否都存在于 dist
async function checkReferences(relPath) {
    const html = await fs.readFile(path.join(DIST, relPath), "utf8");
    const missing = [];
    const pattern = /(?:src|href)\s*=\s*(?:"([^"]*)"|([^\s>]+))/g;
    let match;
    while ((match = pattern.exec(html))) {
        const url = (match[1] ?? match[2] ?? "").trim();
        if (!url || url.startsWith("#") || url.startsWith("data:")) continue;
        if (/^(?:https?:)?\/\//.test(url)) continue;
        const target = path.join(DIST, url.replace(/^\.?\//, "").split(/[?#]/)[0]);
        if (!(await exists(target))) missing.push(url);
    }
    return missing;
}

function printTable(title, rows) {
    console.log("\n" + title);
    console.log("  " + pad("文件", 26) + pad("原始", 12) + pad("输出", 12) + "压缩率");
    for (const row of rows) {
        console.log("  " + pad(row.file, 26) + pad(kb(row.before), 12) + pad(kb(row.after), 12) + ratio(row.before, row.after));
    }
}

async function buildSite() {
    const started = Date.now();
    const optimizeImages = !process.argv.includes("--no-images");
    await fs.rm(DIST, { recursive: true, force: true });
    await fs.mkdir(DIST, { recursive: true });

    const textRows = [];
    for (const rel of JS_FILES) textRows.push(await minifyWithEsbuild(rel));
    for (const rel of CSS_FILES) textRows.push(await minifyWithEsbuild(rel));
    for (const rel of HTML_FILES) textRows.push(await minifyHtmlFile(rel));

    const assetRows = await copyAssets(optimizeImages);

    printTable("代码压缩：", textRows);
    const changedAssets = assetRows.filter((row) => row.after !== row.before);
    if (changedAssets.length) {
        printTable("图片压缩：", changedAssets);
    }

    const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);
    const beforeTotal = sum(textRows, "before") + sum(assetRows, "before");
    const afterTotal = sum(textRows, "after") + sum(assetRows, "after");
    console.log("\n全部文件：" + kb(beforeTotal) + " → " + kb(afterTotal) + "（" + ratio(beforeTotal, afterTotal) + "）");

    const missing = await checkReferences("index.html");
    if (missing.length) {
        console.log("⚠ index.html 引用了不存在的本地资源（可补上对应文件）：\n  " + missing.join("\n  "));
    }
    console.log("输出目录：" + DIST + "，耗时 " + (Date.now() - started) + "ms\n");
}

// 极简静态服务器，仅用于本地预览 dist
function serve(dir, port) {
    const server = http.createServer(async (req, res) => {
        const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
        let target = path.join(dir, urlPath === "/" ? "index.html" : urlPath);
        if (!target.startsWith(dir)) {
            res.writeHead(403);
            res.end("forbidden");
            return;
        }
        try {
            const stat = await fs.stat(target);
            if (stat.isDirectory()) target = path.join(target, "index.html");
            const body = await fs.readFile(target);
            res.writeHead(200, { "Content-Type": MIME[path.extname(target).toLowerCase()] || "application/octet-stream" });
            res.end(body);
        } catch (e) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("404 Not Found");
        }
    });
    return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

await buildSite();
if (process.argv.includes("--serve")) {
    const port = Number(process.env.PORT || 8080);
    await serve(DIST, port);
    console.log(`本地预览：http://127.0.0.1:${port}/ （Ctrl+C 结束）\n`);
}
