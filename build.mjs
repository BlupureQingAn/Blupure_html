#!/usr/bin/env node
import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeFormat from 'rehype-format';
import rehypeStringify from 'rehype-stringify';
import matter from 'gray-matter';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, 'blog');
const WORKS_DIR = path.join(__dirname, 'works');
const TEMPLATE_PATH = path.join(__dirname, 'templates', 'blog-post.html');
const INDEX_PATH = path.join(__dirname, 'blog-index.json');
const WORKS_INDEX_PATH = path.join(__dirname, 'works-index.json');

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const CATEGORY_ORDER = ['互动游戏', '实用工具', '参考文档', '图标资源'];

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function tagsHtml(tags) {
  if (!tags || tags.length === 0) return '';
  return `<div class="blog-post__tags">${tags.map(t =>
    `<span class="blog-post__tag">${esc(t)}</span>`
  ).join('')}</div>`;
}

async function buildWorks() {
  console.log('Building works index...\n');

  await mkdir(WORKS_DIR, { recursive: true });

  // Gather .html files and image files
  const htmlFiles = await glob('*.html', { cwd: WORKS_DIR });
  const allFiles = await glob('*', { cwd: WORKS_DIR });

  // Map image files by base name (e.g. 福尔摩斯探案集_互动文游.png)
  const imageMap = new Map();
  for (const f of allFiles) {
    const ext = path.extname(f).toLowerCase();
    if (IMAGE_EXTS.includes(ext)) {
      const base = path.basename(f, ext);
      imageMap.set(base, `works/${f}`);
    }
  }

  console.log(`Found ${htmlFiles.length} work(s)\n`);

  const works = [];

  for (const htmlFile of htmlFiles) {
    try {
      const raw = await readFile(path.join(WORKS_DIR, htmlFile), 'utf-8');
      const baseName = htmlFile.replace(/\.html$/i, '');

      // Title from <title> tag, fallback to filename
      const titleMatch = raw.match(/<title>([^<]*)<\/title>/i);
      const title = titleMatch
        ? titleMatch[1].trim()
        : baseName.replace(/[-_]/g, ' ');

      // Description from <meta name="description"> or og:description
      let description = '';
      const descMatch = raw.match(/<meta\s+name="description"\s+content="([^"]*)"[^>]*\/?>/i)
        || raw.match(/<meta\s+property="og:description"\s+content="([^"]*)"[^>]*\/?>/i)
        || raw.match(/<meta\s+content="([^"]*)"\s+name="description"[^>]*\/?>/i);
      if (descMatch) description = descMatch[1].trim();

      // Cover: same-name image > <meta name="cover"> > <meta property="og:image">
      let coverImg = imageMap.get(baseName) || '';
      if (!coverImg) {
        const coverMatch = raw.match(/<meta\s+name="cover"\s+content="([^"]*)"[^>]*\/?>/i)
          || raw.match(/<meta\s+property="og:image"\s+content="([^"]*)"[^>]*\/?>/i);
        if (coverMatch) coverImg = coverMatch[1].trim();
      }

      // Category from <meta name="category">
      let category = '';
      const catMatch = raw.match(/<meta\s+name="category"\s+content="([^"]*)"[^>]*\/?>/i);
      if (catMatch) category = catMatch[1].trim();

      works.push({
        title,
        description: description || '独立创作的数字化项目，点击卡片即刻探索沉浸空间。',
        coverImg,
        category,
        fileName: htmlFile,
        workUrl: `works/${htmlFile}`,
      });

      console.log(`  OK  ${htmlFile} — ${title}`);
    } catch (err) {
      console.error(`  FAIL ${htmlFile}: ${err.message}`);
    }
  }

  // Sort by category order, then by filename
  const catOrder = Object.fromEntries(CATEGORY_ORDER.map((c, i) => [c, i]));
  works.sort((a, b) => {
    const oa = catOrder[a.category] ?? Infinity;
    const ob = catOrder[b.category] ?? Infinity;
    if (oa !== ob) return oa - ob;
    return a.fileName.localeCompare(b.fileName);
  });

  await writeFile(WORKS_INDEX_PATH, JSON.stringify(works, null, 2), 'utf-8');
  console.log(`\nIndex: works-index.json (${works.length} works)`);

  // Cleanup orphaned entries: the index is rebuilt from scratch, so
  // files deleted from works/ are automatically removed from the index.
}

async function main() {
  console.log('Building blog...\n');

  // Ensure blog/ directory exists
  await mkdir(BLOG_DIR, { recursive: true });

  // Load template
  let template;
  try {
    template = await readFile(TEMPLATE_PATH, 'utf-8');
  } catch (err) {
    console.error(`FATAL: Template not found at ${TEMPLATE_PATH}`);
    process.exit(1);
  }

  // Find all .md files
  const mdFiles = await glob('*.md', { cwd: BLOG_DIR });
  console.log(`Found ${mdFiles.length} post(s)\n`);

  const posts = [];

  for (const mdFile of mdFiles) {
    try {
      const raw = await readFile(path.join(BLOG_DIR, mdFile), 'utf-8');
      const { data, content } = matter(raw);

      // gray-matter auto-parses dates; ensure as string
      if (data.date instanceof Date) {
        data.date = data.date.toISOString().split('T')[0];
      }

      if (!data.title) {
        console.warn(`  SKIP ${mdFile}: missing title in frontmatter`);
        continue;
      }

      // Process markdown through unified pipeline
      const file = await unified()
        .use(remarkParse)
        .use(remarkMath)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeKatex, { throwOnError: false })
        .use(rehypeFormat)
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(content);

      const htmlContent = String(file);

      const slug = (data.slug || mdFile.replace(/\.md$/i, '')).trim();
      const outputFile = `${slug}.html`;

      // Count CJK characters + words for word count
      const wordCount = content.length;

      const post = {
        title: data.title,
        date: data.date || '',
        description: data.description || '',
        category: data.category || '未分类',
        tags: data.tags || [],
        cover: data.cover || '',
        fileName: outputFile,
        workUrl: `blog/${outputFile}`,
        wordCount,
      };
      posts.push(post);

      // Replace placeholders in template
      let postHtml = template
        .replace(/{{TITLE}}/g, esc(data.title))
        .replace(/{{DESCRIPTION}}/g, esc(data.description || ''))
        .replace(/{{DATE_ISO}}/g, esc(data.date || ''))
        .replace(/{{DATE_DISPLAY}}/g, formatDate(data.date))
        .replace(/{{CATEGORY}}/g, esc(data.category || '未分类'))
        .replace(/{{TAGS_HTML}}/g, tagsHtml(data.tags || []));

      // Replace content marker
      postHtml = postHtml.replace('<!--BLOG_CONTENT-->', htmlContent);

      await writeFile(path.join(BLOG_DIR, outputFile), postHtml, 'utf-8');
      console.log(`  OK  ${outputFile} (${wordCount} chars) — ${data.title}`);
    } catch (err) {
      console.error(`  FAIL ${mdFile}: ${err.message}`);
    }
  }

  // Sort by date descending (newest first), dated before undated
  posts.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  // Write index
  await writeFile(INDEX_PATH, JSON.stringify(posts, null, 2), 'utf-8');
  console.log(`\nIndex: blog-index.json (${posts.length} posts)`);

  // Cleanup orphaned .html files (only if we have posts)
  if (posts.length > 0) {
    const validNames = new Set(posts.map(p => p.fileName));
    const htmlFiles = await glob('*.html', { cwd: BLOG_DIR });
    let cleaned = 0;
    for (const htmlFile of htmlFiles) {
      if (!validNames.has(htmlFile)) {
        await unlink(path.join(BLOG_DIR, htmlFile));
        console.log(`  DEL ${htmlFile} (orphaned)`);
        cleaned++;
      }
    }
    if (cleaned > 0) console.log(`Cleaned ${cleaned} orphaned file(s)`);
  }

  // Build works index
  await buildWorks();

  console.log('\nDone.');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
