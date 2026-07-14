import { execFileSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const steps = [['run', 'typecheck'], ['run', 'lint'], ['test'], ['run', 'build'], ['run', 'test:browser'], ['run', 'package:acquisition']];
for (const args of steps) {
  const command = process.platform === 'win32' ? 'cmd.exe' : npm;
  const commandArgs = process.platform === 'win32' ? ['/d', '/s', '/c', npm, ...args] : args;
  execFileSync(command, commandArgs, { stdio: 'inherit' });
}
console.log('Buyer verification complete. Inspect release/weavestudio-acquisition-package.zip and PACKAGE_MANIFEST.json.');
