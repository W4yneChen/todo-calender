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
  path.join(root, '.understand-anything/intermediate/fingerprint-input.json'),
  JSON.stringify(
    {
      projectRoot: root,
      sourceFilePaths: scan.files.map((file) => file.path),
      gitCommitHash,
    },
    null,
    2,
  ),
  'utf8',
);

console.log(`fingerprint-input.json: ${scan.files.length} files`);
