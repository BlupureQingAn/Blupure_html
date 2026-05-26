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
const TEMPLATE_PATH = path.join(__dirname, 'templates', 'blog-post.html');
const INDEX_PATH = path.join(__dirname, 'blog-index.json');

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

  console.log('\nDone.');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
