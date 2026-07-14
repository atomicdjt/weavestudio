import { spawnSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const steps = [['run', 'typecheck'], ['run', 'lint'], ['test'], ['run', 'build'], ['run', 'test:browser'], ['run', 'package:acquisition']];
for (const args of steps) {
  const result = spawnSync(npm, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Buyer verification complete. Inspect release/weavestudio-acquisition-package.zip and PACKAGE_MANIFEST.json.');
