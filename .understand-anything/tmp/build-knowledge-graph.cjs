const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = process.cwd();
const intermediateDir = path.join(root, '.understand-anything/intermediate');
const scan = JSON.parse(fs.readFileSync(path.join(intermediateDir, 'scan-result.json'), 'utf8'));
const batches = JSON.parse(fs.readFileSync(path.join(intermediateDir, 'batches.json'), 'utf8'));
const commit = fs.readFileSync(path.join(intermediateDir, 'commit.txt'), 'utf8').trim();

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fileNodeType(file) {
  if (file.fileCategory === 'config') return 'config';
  if (file.fileCategory === 'docs') return 'document';
  if (file.fileCategory === 'infra') return 'resource';
  if (file.fileCategory === 'data' || file.path.endsWith('/todos.json')) return 'config';
  return 'file';
}

function fileNodeId(file) {
  return `${fileNodeType(file)}:${file.path}`;
}

function functionNodeId(filePath, name) {
  return `function:${filePath}:${name}`;
}

function classNodeId(filePath, name) {
  return `class:${filePath}:${name}`;
}

function hashId(prefix, source, target, extra = '') {
  const digest = crypto.createHash('sha1').update(`${prefix}|${source}|${target}|${extra}`).digest('hex').slice(0, 10);
  return `edge:${prefix}:${digest}`;
}

function addNode(nodes, node) {
  if (!nodes.has(node.id)) nodes.set(node.id, node);
}

function addEdge(edges, edge) {
  if (!edges.has(edge.id)) edges.set(edge.id, edge);
}

const fileSummary = new Map([
  ['apps/web/src/main.tsx', 'React 应用入口，创建根节点并挂载 App，同时加载全局样式。'],
  ['apps/web/src/App.tsx', '应用壳层，连接 Zustand 日历状态、月份切换、日历网格和日详情面板。'],
  ['apps/web/src/components/CalendarHeader.tsx', '顶部月份导航组件，提供上一月/下一月按钮和原生月份选择器。'],
  ['apps/web/src/components/CalendarGrid.tsx', '月视图网格组件，展示日期、节假日标记、待办数量、完成数量和实际记录提示。'],
  ['apps/web/src/components/DayDetail.tsx', '选中日期的详情面板，处理新增、编辑、删除、完成、继承 TODO 和实际记录。'],
  ['apps/web/src/store/todoStore.ts', 'Zustand 状态中心，负责数据迁移、读取、延迟保存和所有日历写操作。'],
  ['apps/web/src/lib/date.ts', '日期工具库，封装 DateKey、月份边界、日期加减、日历格生成和中文日期格式化。'],
  ['apps/web/src/lib/todos.ts', 'TODO 业务规则库，负责可见任务、完成状态、继承任务和记录对象创建。'],
  ['apps/web/src/lib/holidays.ts', '2026 年节假日与调休标记表，并提供日历样式 class 选择函数。'],
  ['apps/web/src/types/todos.ts', '待办日历的数据模型定义，包括日期键、日记录、任务、实际记录和保存状态。'],
  ['apps/web/vite.config.ts', 'Vite 配置，同时定义开发期 /api/todos JSON 读写中间件。'],
  ['apps/web/data/todos.json', '本地待办日历数据文件，作为开发 API 的持久化存储。'],
  ['apps/web/src/styles.css', 'Tailwind 基础样式和 iOS 风格视觉辅助 class。'],
  ['apps/web/index.html', 'Web 应用 HTML 宿主页面，提供 React 挂载点。'],
  ['apps/web/package.json', 'Web 子应用依赖和脚本配置，声明 React、Vite、Zustand 与 Tailwind。'],
  ['package.json', '根工作区脚本和开发依赖配置，转发 dev/build/lint/typecheck 到 Web 子包。'],
  ['pnpm-workspace.yaml', 'pnpm monorepo 工作区配置，包含 apps/* 包。'],
  ['tsconfig.json', '根 TypeScript 项目引用配置。'],
  ['apps/web/tsconfig.json', 'Web 子应用 TypeScript 编译配置。'],
  ['eslint.config.js', '仓库 ESLint 扁平配置。'],
  ['commitlint.config.cjs', '提交信息规范配置，使用 conventional commits 规则。'],
  ['.prettierrc.json', 'Prettier 格式化规则配置。'],
  ['.husky/pre-commit', '提交前钩子，执行仓库质量检查命令。'],
  ['.husky/commit-msg', '提交信息钩子，调用 commitlint 校验提交消息。'],
  ['apps/web/tailwind.config.ts', 'Tailwind 内容扫描和主题扩展配置。'],
  ['apps/web/postcss.config.js', 'PostCSS 插件配置，启用 Tailwind 与 Autoprefixer。'],
]);

function genericFileSummary(file) {
  if (file.fileCategory === 'config') return `${file.path} 的项目配置文件，参与构建、类型检查、样式或工具链行为。`;
  if (file.language === 'typescript') return `${file.path} 的 TypeScript 源文件，承载应用逻辑或 UI 组件。`;
  if (file.language === 'css') return `${file.path} 的样式文件，定义全局视觉规则。`;
  return `${file.path} 是项目中的 ${file.language} 文件。`;
}

function tagsForFile(file) {
  const tags = [];
  if (file.path.includes('/components/')) tags.push('界面组件');
  if (file.path.includes('/lib/')) tags.push('业务工具');
  if (file.path.includes('/store/')) tags.push('状态管理');
  if (file.path.includes('/types/')) tags.push('类型模型');
  if (file.path.includes('/data/')) tags.push('本地数据');
  if (file.path.includes('vite.config')) tags.push('开发服务');
  if (file.fileCategory === 'config') tags.push('配置');
  if (!tags.length) tags.push(file.language === 'typescript' ? '源码' : '项目文件');
  return tags;
}

function complexityForLines(lines) {
  if (lines >= 250) return 'complex';
  if (lines >= 80) return 'moderate';
  return 'simple';
}

const nodes = new Map();
const edges = new Map();
const structureByPath = new Map();
for (const batch of batches.batches) {
  const output = readJson(path.join(intermediateDir, `batch-${batch.batchIndex}.json`));
  for (const result of output.results) {
    structureByPath.set(result.path, result);
  }
}

for (const file of scan.files) {
  const structure = structureByPath.get(file.path);
  const id = fileNodeId(file);
  addNode(nodes, {
    id,
    type: fileNodeType(file),
    name: path.basename(file.path),
    filePath: file.path,
    summary: fileSummary.get(file.path) || genericFileSummary(file),
    language: file.language,
    complexity: complexityForLines(file.sizeLines),
    tags: tagsForFile(file),
    metrics: structure?.metrics || {
      totalLines: file.sizeLines,
      functionCount: structure?.functions?.length || 0,
      classCount: structure?.classes?.length || 0,
      importCount: scan.importMap[file.path]?.length || 0,
    },
  });
}

for (const [filePath, structure] of structureByPath) {
  const file = scan.files.find((item) => item.path === filePath);
  if (!file) continue;
  const parent = fileNodeId(file);
  for (const fn of structure.functions || []) {
    const id = functionNodeId(filePath, fn.name);
    addNode(nodes, {
      id,
      type: 'function',
      name: fn.name,
      filePath,
      lineStart: fn.startLine,
      lineEnd: fn.endLine,
      summary: `${fn.name} 定义在 ${filePath}，承担该文件中的主要交互或业务逻辑。`,
      complexity: complexityForLines((fn.endLine || fn.startLine || 0) - (fn.startLine || 0) + 1),
      tags: ['函数', filePath.includes('/components/') ? '组件逻辑' : '业务逻辑'],
    });
    addEdge(edges, {
      id: hashId('contains', parent, id),
      source: parent,
      target: id,
      type: 'contains',
      weight: 1,
      direction: 'forward',
      description: `${path.basename(filePath)} 包含函数 ${fn.name}。`,
    });
  }
  for (const cls of structure.classes || []) {
    const id = classNodeId(filePath, cls.name);
    addNode(nodes, {
      id,
      type: 'class',
      name: cls.name,
      filePath,
      lineStart: cls.startLine,
      lineEnd: cls.endLine,
      summary: `${cls.name} 定义了 ${filePath} 中的类型或类结构。`,
      complexity: 'simple',
      tags: ['类型结构'],
    });
    addEdge(edges, {
      id: hashId('contains', parent, id),
      source: parent,
      target: id,
      type: 'contains',
      weight: 1,
      direction: 'forward',
      description: `${path.basename(filePath)} 包含类型结构 ${cls.name}。`,
    });
  }
}

const fileIdByPath = new Map(scan.files.map((file) => [file.path, fileNodeId(file)]));
for (const [sourcePath, targets] of Object.entries(scan.importMap || {})) {
  const source = fileIdByPath.get(sourcePath);
  if (!source) continue;
  for (const targetPath of targets) {
    const target = fileIdByPath.get(targetPath);
    if (!target) continue;
    addEdge(edges, {
      id: hashId('imports', source, target),
      source,
      target,
      type: 'imports',
      weight: 0.7,
      direction: 'forward',
      description: `${sourcePath} 导入 ${targetPath}。`,
    });
  }
}

const functionByName = new Map();
for (const node of nodes.values()) {
  if (node.type !== 'function') continue;
  if (!functionByName.has(node.name)) functionByName.set(node.name, []);
  functionByName.get(node.name).push(node.id);
}

for (const [filePath, structure] of structureByPath) {
  for (const call of structure.callGraph || []) {
    const source = functionNodeId(filePath, call.caller);
    if (!nodes.has(source)) continue;
    const calleeName = String(call.callee || '').split('.').pop();
    const candidates = functionByName.get(calleeName) || [];
    const target = candidates.find((id) => id.includes(`:${filePath}:`)) || candidates[0];
    if (!target || source === target) continue;
    addEdge(edges, {
      id: hashId('calls', source, target, String(call.lineNumber || '')),
      source,
      target,
      type: 'calls',
      weight: 0.8,
      direction: 'forward',
      description: `${call.caller} 在第 ${call.lineNumber || '?'} 行调用 ${calleeName}。`,
    });
  }
}

const storeNode = fileIdByPath.get('apps/web/src/store/todoStore.ts');
const dataNode = fileIdByPath.get('apps/web/data/todos.json');
const viteNode = fileIdByPath.get('apps/web/vite.config.ts');
if (storeNode && dataNode) {
  addEdge(edges, {
    id: hashId('reads_from', storeNode, dataNode),
    source: storeNode,
    target: dataNode,
    type: 'reads_from',
    weight: 0.5,
    direction: 'forward',
    description: 'todoStore 通过 /api/todos 读取本地 JSON 数据。',
  });
  addEdge(edges, {
    id: hashId('writes_to', storeNode, dataNode),
    source: storeNode,
    target: dataNode,
    type: 'writes_to',
    weight: 0.5,
    direction: 'forward',
    description: 'todoStore 在状态变更后通过 PUT /api/todos 写回本地 JSON 数据。',
  });
}
if (viteNode && dataNode) {
  addEdge(edges, {
    id: hashId('serves', viteNode, dataNode),
    source: viteNode,
    target: dataNode,
    type: 'serves',
    weight: 0.5,
    direction: 'forward',
    description: 'Vite 开发中间件把 todos.json 暴露为 /api/todos。',
  });
}
if (viteNode && storeNode) {
  addEdge(edges, {
    id: hashId('routes', viteNode, storeNode),
    source: viteNode,
    target: storeNode,
    type: 'routes',
    weight: 0.5,
    direction: 'forward',
    description: 'Vite API 路由与前端 store 的 fetch/writeData 调用相互配合。',
  });
}

const semanticEdges = [
  ['config:pnpm-workspace.yaml', 'config:package.json', 'configures', 'pnpm workspace 配置根包所在的工作区边界。'],
  ['config:package.json', 'config:apps/web/package.json', 'configures', '根 package 脚本委派到 Web 子应用包。'],
  ['config:tsconfig.json', 'config:apps/web/tsconfig.json', 'configures', '根 TypeScript 配置引用 Web 子项目配置。'],
  ['config:apps/web/tsconfig.json', 'file:apps/web/src/main.tsx', 'configures', 'Web TypeScript 配置约束应用入口和源码编译。'],
  ['config:apps/web/package.json', 'file:apps/web/vite.config.ts', 'depends_on', 'Web 包脚本和依赖驱动 Vite 配置运行。'],
  ['file:apps/web/index.html', 'file:apps/web/src/main.tsx', 'serves', 'HTML 宿主页面加载 React 入口脚本。'],
  ['file:apps/web/postcss.config.js', 'file:apps/web/src/styles.css', 'configures', 'PostCSS 配置处理 Tailwind 样式入口。'],
  ['file:apps/web/tailwind.config.ts', 'file:apps/web/src/styles.css', 'configures', 'Tailwind 配置决定全局样式可扫描的 class 来源。'],
  ['file:eslint.config.js', 'file:apps/web/src/App.tsx', 'configures', 'ESLint 配置约束前端源码质量规则。'],
  ['config:.prettierrc.json', 'config:package.json', 'configures', 'Prettier 配置服务于根格式化脚本。'],
  ['file:commitlint.config.cjs', 'file:.husky/commit-msg', 'configures', 'commitlint 配置被 commit-msg 钩子使用。'],
  ['file:.husky/commit-msg', 'file:commitlint.config.cjs', 'depends_on', 'commit-msg 钩子依赖 commitlint 规则配置。'],
  ['file:.husky/pre-commit', 'config:package.json', 'triggers', 'pre-commit 钩子触发根包定义的质量检查流程。'],
];
for (const [source, target, type, description] of semanticEdges) {
  if (!nodes.has(source) || !nodes.has(target)) continue;
  addEdge(edges, {
    id: hashId(type, source, target, description),
    source,
    target,
    type,
    weight: type === 'depends_on' || type === 'configures' ? 0.6 : 0.5,
    direction: 'forward',
    description,
  });
}

const layerDefs = [
  {
    id: 'layer:workspace-tooling',
    name: '工作区与工具链',
    description: '根工作区、代码格式化、Lint、提交规范、TypeScript 和 PostCSS/Tailwind 等工程化配置。',
    match: (p) => [
      'package.json',
      'pnpm-workspace.yaml',
      'tsconfig.json',
      '.prettierrc.json',
      'eslint.config.js',
      'commitlint.config.cjs',
      '.husky/pre-commit',
      '.husky/commit-msg',
      'apps/web/package.json',
      'apps/web/tsconfig.json',
      'apps/web/postcss.config.js',
      'apps/web/tailwind.config.ts',
    ].includes(p),
  },
  {
    id: 'layer:app-shell',
    name: '应用入口与布局',
    description: 'HTML 宿主、React 挂载入口、App 壳层和全局样式，负责把应用组装到首屏。',
    match: (p) => ['apps/web/index.html', 'apps/web/src/main.tsx', 'apps/web/src/App.tsx', 'apps/web/src/styles.css'].includes(p),
  },
  {
    id: 'layer:calendar-ui',
    name: '日历界面组件',
    description: '面向用户的日历头部、月网格和单日详情组件。',
    match: (p) => p.startsWith('apps/web/src/components/'),
  },
  {
    id: 'layer:state-and-domain',
    name: '状态与领域规则',
    description: 'Zustand store、日期计算、TODO 可见性/继承规则、节假日标记和领域类型。',
    match: (p) => p === 'apps/web/src/store/todoStore.ts' || p.startsWith('apps/web/src/lib/') || p.startsWith('apps/web/src/types/'),
  },
  {
    id: 'layer:local-data-api',
    name: '本地数据与开发 API',
    description: '开发期 JSON API 和本地持久化数据文件。',
    match: (p) => ['apps/web/vite.config.ts', 'apps/web/data/todos.json'].includes(p),
  },
];

const assigned = new Set();
const layers = layerDefs.map((layer) => {
  const nodeIds = scan.files
    .filter((file) => layer.match(file.path))
    .map((file) => fileNodeId(file))
    .filter((id) => {
      if (assigned.has(id)) return false;
      assigned.add(id);
      return true;
    });
  return {
    id: layer.id,
    name: layer.name,
    description: layer.description,
    nodeIds,
  };
});

const unassigned = scan.files.map((file) => fileNodeId(file)).filter((id) => !assigned.has(id));
if (unassigned.length) {
  layers.push({
    id: 'layer:other-project-files',
    name: '其他项目文件',
    description: '未归入主要架构层的辅助文件。',
    nodeIds: unassigned,
  });
}

const tour = [
  {
    order: 1,
    title: '从工作区脚本开始',
    description: '先看根 package.json 和 pnpm-workspace.yaml，理解这是一个 pnpm monorepo，根脚本会转发到 Web 子应用。',
    nodeIds: ['config:package.json', 'config:pnpm-workspace.yaml', 'config:apps/web/package.json'],
    languageLesson: '注意 package scripts 如何表达项目的真实入口：dev/build/lint/typecheck 都指向 @todo-calender/web。',
  },
  {
    order: 2,
    title: '应用如何启动',
    description: 'index.html 提供挂载点，main.tsx 挂载 React，App.tsx 负责把月份状态、日历网格和详情面板组合起来。',
    nodeIds: ['file:apps/web/index.html', 'file:apps/web/src/main.tsx', 'file:apps/web/src/App.tsx'],
  },
  {
    order: 3,
    title: '阅读日历界面',
    description: 'CalendarHeader 控制月份导航，CalendarGrid 展示整月概览，DayDetail 承担单日 TODO 和实际记录的编辑流程。',
    nodeIds: [
      'file:apps/web/src/components/CalendarHeader.tsx',
      'file:apps/web/src/components/CalendarGrid.tsx',
      'file:apps/web/src/components/DayDetail.tsx',
    ],
  },
  {
    order: 4,
    title: '理解领域规则',
    description: 'date.ts 负责日期和日历格，todos.ts 负责可见 TODO、完成和继承规则，types/todos.ts 定义共享数据结构。',
    nodeIds: ['file:apps/web/src/lib/date.ts', 'file:apps/web/src/lib/todos.ts', 'file:apps/web/src/types/todos.ts'],
  },
  {
    order: 5,
    title: '状态与持久化闭环',
    description: 'todoStore.ts 管理前端状态并调用 /api/todos；vite.config.ts 在开发服务器中实现该 API，并读写 data/todos.json。',
    nodeIds: ['file:apps/web/src/store/todoStore.ts', 'file:apps/web/vite.config.ts', 'config:apps/web/data/todos.json'],
  },
];

const graph = {
  version: '1.0.0',
  project: {
    name: scan.projectName,
    languages: scan.languages,
    frameworks: scan.frameworks,
    description: scan.projectDescription,
    analyzedAt: new Date().toISOString(),
    gitCommitHash: commit,
  },
  nodes: [...nodes.values()],
  edges: [...edges.values()],
  layers,
  tour,
};

fs.writeFileSync(path.join(intermediateDir, 'layers.json'), JSON.stringify(layers, null, 2), 'utf8');
fs.writeFileSync(path.join(intermediateDir, 'tour.json'), JSON.stringify(tour, null, 2), 'utf8');
fs.writeFileSync(path.join(intermediateDir, 'assembled-graph.json'), JSON.stringify(graph, null, 2), 'utf8');

console.log(JSON.stringify({
  nodes: graph.nodes.length,
  edges: graph.edges.length,
  layers: graph.layers.length,
  tourSteps: graph.tour.length,
}, null, 2));
