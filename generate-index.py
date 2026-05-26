"""扫描 works/ 目录，提取元数据，生成 works-index.json"""
import json, os, re, html

WORKS_DIR = os.path.join(os.path.dirname(__file__), 'works')
OUTPUT = os.path.join(os.path.dirname(__file__), 'works-index.json')

def extract_meta(filepath, filename):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # title: 优先 <title>，其次文件名
    m = re.search(r'<title>\s*(.*?)\s*</title>', content, re.DOTALL)
    title = m.group(1).strip() if m else filename.replace('.html', '').replace('_', ' ').replace('-', ' ')

    # description
    desc = ''
    m = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', content)
    if m: desc = m.group(1)
    if not desc:
        m = re.search(r'<meta\s+property="og:description"\s+content="([^"]*)"', content)
        if m: desc = m.group(1)

    # cover
    cover = ''
    m = re.search(r'<meta\s+name="cover"\s+content="([^"]*)"', content)
    if m: cover = m.group(1)
    if not cover:
        m = re.search(r'<meta\s+property="og:image"\s+content="([^"]*)"', content)
        if m: cover = m.group(1)

    # category
    category = ''
    m = re.search(r'<meta\s+name="category"\s+content="([^"]*)"', content)
    if m: category = m.group(1)

    return {
        'title': title,
        'description': desc,
        'coverImg': cover,
        'category': category,
        'fileName': filename,
        'workUrl': 'works/' + filename
    }

files = sorted(os.listdir(WORKS_DIR))
index = []
for fname in files:
    if not fname.endswith('.html'):
        continue
    fpath = os.path.join(WORKS_DIR, fname)
    meta = extract_meta(fpath, fname)
    index.append(meta)

with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(index, f, ensure_ascii=False, indent=2)

print(f'生成 works-index.json，共 {len(index)} 个作品')
for item in index:
    print(f'  [{item["category"] or "未分类"}] {item["fileName"]}')
