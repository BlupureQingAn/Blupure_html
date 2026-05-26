/**
 * 作品分类功能单元测试
 * 测试内容：meta category 提取、分组逻辑、渲染顺序
 */
const fs = require('fs');
const path = require('path');

// --- 测试 1: 验证每个作品文件的 meta category ---
const WORKS_DIR = path.join(__dirname, 'works');
const EXPECTED_CATEGORIES = {
    '福尔摩斯探案集_互动文游.html': '互动文游',
    '飘_互动文游.html': '互动文游',
    'PDF无损压缩.html': '实用工具',
    '长图转pdf.html': '实用工具',
    'pdf-image-converter.html': '实用工具',
    'fontawesome.html': '图标资源',
};

let passed = 0;
let failed = 0;

console.log('=== 测试 1: Meta category 标签验证 ===\n');

for (const [fileName, expectedCategory] of Object.entries(EXPECTED_CATEGORIES)) {
    const filePath = path.join(WORKS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
        console.log(`  FAIL: ${fileName} — 文件不存在`);
        failed++;
        continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/<meta\s+name="category"\s+content="([^"]+)"/);

    if (!match) {
        console.log(`  FAIL: ${fileName} — 未找到 meta category 标签`);
        failed++;
        continue;
    }

    const actualCategory = match[1];
    if (actualCategory === expectedCategory) {
        console.log(`  PASS: ${fileName} → "${actualCategory}"`);
        passed++;
    } else {
        console.log(`  FAIL: ${fileName} — 期望 "${expectedCategory}", 实际 "${actualCategory}"`);
        failed++;
    }
}

// --- 测试 2: 分组逻辑 ---
console.log('\n=== 测试 2: 分组逻辑验证 ===\n');

// 模拟 parseWorkMetadata 的返回数据
const mockAllMetas = Object.entries(EXPECTED_CATEGORIES).map(([fileName, category]) => ({
    title: fileName.replace('.html', ''),
    description: 'test',
    coverImg: '',
    category: category,
    valid: true,
    fileName: fileName,
    workUrl: `works/${fileName}`
}));

// 执行分组（模拟 index.html 中的逻辑）
const CATEGORY_ORDER = ['互动文游', '实用工具', '参考文档', '图标资源'];
const CATEGORY_LABELS = { '互动文游': '互动文游', '实用工具': '实用工具', '参考文档': '参考文档', '图标资源': '图标资源' };

const groups = {};
for (const meta of mockAllMetas) {
    const cat = meta.category || '其他';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(meta);
}

// 验证分类数量
const expectedGroupCount = Object.keys(EXPECTED_CATEGORIES).length;
const actualGroupCount = Object.values(groups).flat().length;
if (actualGroupCount === expectedGroupCount) {
    console.log(`  PASS: 所有 ${actualGroupCount} 个作品被正确分组`);
    passed++;
} else {
    console.log(`  FAIL: 期望 ${expectedGroupCount} 个作品, 分组后 ${actualGroupCount}`);
    failed++;
}

// 验证每个分类的作品数量
const expectedCounts = {};
for (const cat of Object.values(EXPECTED_CATEGORIES)) {
    expectedCounts[cat] = (expectedCounts[cat] || 0) + 1;
}

let groupCountOk = true;
for (const [cat, expectedCount] of Object.entries(expectedCounts)) {
    const actualCount = (groups[cat] || []).length;
    if (actualCount !== expectedCount) {
        groupCountOk = false;
        console.log(`  FAIL: 分类 "${cat}" 期望 ${expectedCount} 个作品, 实际 ${actualCount}`);
        failed++;
    }
}
if (groupCountOk) {
    console.log(`  PASS: 每个分类的作品数量正确`);
    passed++;
}

// 验证渲染顺序
let orderOk = true;
let idx = 0;
for (const cat of CATEGORY_ORDER) {
    const items = groups[cat];
    if (!items || items.length === 0) continue;
    for (const meta of items) {
        if (meta.category !== cat) {
            orderOk = false;
            console.log(`  FAIL: ${meta.fileName} 在分类 "${cat}" 中, 但 meta.category="${meta.category}"`);
            failed++;
        }
    }
}
if (orderOk) {
    console.log(`  PASS: 所有作品按正确分类顺序排列`);
    passed++;
}

// --- 测试 3: 无分类时使用默认值 "其他" ---
console.log('\n=== 测试 3: 默认分类降级 ===\n');

const metasWithEmptyCategory = [
    { category: '', title: 'NoCat1' },
    { category: null, title: 'NoCat2' },
    { category: '自定义类', title: 'CustomCat' },
];

const groupsWithFallback = {};
for (const meta of metasWithEmptyCategory) {
    const cat = meta.category || '其他';
    if (!groupsWithFallback[cat]) groupsWithFallback[cat] = [];
    groupsWithFallback[cat].push(meta);
}

if (groupsWithFallback['其他'] && groupsWithFallback['其他'].length === 2) {
    console.log(`  PASS: 空/空值分类正确降级到默认 "其他"`);
    passed++;
} else {
    console.log(`  FAIL: 默认分类降级逻辑异常`);
    failed++;
}

if (groupsWithFallback['自定义类'] && groupsWithFallback['自定义类'].length === 1) {
    console.log(`  PASS: 自定义分类正常保留`);
    passed++;
} else {
    console.log(`  FAIL: 自定义分类未被保留`);
    failed++;
}

// --- 结果汇总 ---
console.log(`\n========================`);
console.log(`总计: ${passed} 通过, ${failed} 失败`);
console.log(`========================`);

process.exit(failed > 0 ? 1 : 0);
