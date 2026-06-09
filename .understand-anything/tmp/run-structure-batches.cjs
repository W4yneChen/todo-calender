const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = process.cwd();
const skillDir = 'C:\\Users\\Lenovo\\.understand-anything\\repo\\understand-anything-plugin\\skills\\understand';
const batches = JSON.parse(
  fs.readFileSync(path.join(root, '.understand-anything/intermediate/batches.json'), 'utf8'),
);

const results = [];
for (const batch of batches.batches) {
  const index = batch.batchIndex;
  const inputPath = path.join(root, `.understand-anything/intermediate/batch-input-${index}.json`);
  const outputPath = path.join(root, `.understand-anything/intermediate/batch-${index}.json`);
  const input = {
    projectRoot: root,
    batchFiles: batch.files,
    batchImportData: batch.batchImportData,
  };
  fs.writeFileSync(inputPath, JSON.stringify(input, null, 2), 'utf8');
  const proc = spawnSync(
    'node',
    [path.join(skillDir, 'extract-structure.mjs'), inputPath, outputPath],
    { cwd: root, encoding: 'utf8' },
  );
  results.push({
    batchIndex: index,
    files: batch.files.map((file) => file.path),
    status: proc.status,
    stdout: proc.stdout,
    stderr: proc.stderr,
    outputPath,
  });
  if (proc.status !== 0) {
    console.error(proc.stderr || proc.stdout || `Batch ${index} failed`);
    process.exit(proc.status || 1);
  }
  console.log(`Analyzed batch ${index}/${batches.totalBatches}: ${batch.files.slice(0, 3).map((file) => file.path).join(', ')}${batch.files.length > 3 ? ', ...' : ''}`);
}

fs.writeFileSync(
  path.join(root, '.understand-anything/intermediate/structure-run-summary.json'),
  JSON.stringify(results, null, 2),
  'utf8',
);
