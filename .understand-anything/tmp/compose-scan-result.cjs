const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const scan = JSON.parse(
  fs.readFileSync(path.join(root, '.understand-anything/intermediate/scan-script-result.json'), 'utf8'),
);
const importResult = JSON.parse(
  fs.readFileSync(path.join(root, '.understand-anything/intermediate/import-map.json'), 'utf8'),
);
const rootPkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const webPkg = JSON.parse(fs.readFileSync(path.join(root, 'apps/web/package.json'), 'utf8'));

const languages = [...new Set(scan.files.map((file) => file.language).filter((language) => language && language !== 'unknown'))].sort();
const dependencyNames = new Set([
  ...Object.keys(rootPkg.devDependencies || {}),
  ...Object.keys(rootPkg.dependencies || {}),
  ...Object.keys(webPkg.devDependencies || {}),
  ...Object.keys(webPkg.dependencies || {}),
]);

const frameworks = [];
if (dependencyNames.has('react')) frameworks.push('React');
if (dependencyNames.has('vite')) frameworks.push('Vite');
if (dependencyNames.has('zustand')) frameworks.push('Zustand');
if (dependencyNames.has('tailwindcss')) frameworks.push('Tailwind CSS');
if (dependencyNames.has('typescript')) frameworks.push('TypeScript');

const description =
  '一个基于 Vite、React 和 TypeScript 的待办日历应用，使用 Zustand 管理日历状态，并通过 JSON 数据文件保存 TODO、继承任务和实际完成记录。';

const scanResult = {
  projectName: rootPkg.name,
  projectDescription: description,
  name: rootPkg.name,
  description,
  languages,
  frameworks,
  files: scan.files,
  totalFiles: scan.totalFiles,
  filteredByIgnore: scan.filteredByIgnore,
  estimatedComplexity: scan.estimatedComplexity,
  stats: scan.stats,
  importMap: importResult.importMap,
  importStats: importResult.stats,
  scriptCompleted: scan.scriptCompleted,
};

fs.writeFileSync(
  path.join(root, '.understand-anything/intermediate/scan-result.json'),
  JSON.stringify(scanResult, null, 2),
  'utf8',
);

console.log(
  JSON.stringify(
    {
      totalFiles: scanResult.totalFiles,
      filteredByIgnore: scanResult.filteredByIgnore,
      languages,
      frameworks,
    },
    null,
    2,
  ),
);
