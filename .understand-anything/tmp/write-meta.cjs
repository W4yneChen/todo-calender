const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const scan = JSON.parse(
  fs.readFileSync(path.join(root, '.understand-anything/intermediate/scan-result.json'), 'utf8'),
);
const gitCommitHash = fs
  .readFileSync(path.join(root, '.understand-anything/intermediate/commit.txt'), 'utf8')
  .trim();

fs.writeFileSync(
  path.join(root, '.understand-anything/meta.json'),
  JSON.stringify(
    {
      lastAnalyzedAt: new Date().toISOString(),
      gitCommitHash,
      version: '1.0.0',
      analyzedFiles: scan.files.length,
    },
    null,
    2,
  ),
  'utf8',
);

console.log(`meta.json: ${scan.files.length} analyzed files`);
