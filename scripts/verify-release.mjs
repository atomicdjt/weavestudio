import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const startedAt = new Date().toISOString();
const status = git('status', '--porcelain');
const receipt = {
  schemaVersion: 1, commit: git('rev-parse', 'HEAD'), startedAt,
  treeDirty: Boolean(status), workingDiffSha256: createHash('sha256').update(git('diff', '--binary', 'HEAD')).update(status).digest('hex'),
  nodeVersion: process.version, platform: process.platform,
  ciRunUrl: process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null,
  steps: [], result: 'running', finishedAt: null,
};
const steps = [
  ['npm', ['audit', '--omit=dev']], ['npm', ['test']], ['npm', ['run', 'lint']],
  ['npm', ['run', 'typecheck']], ['npm', ['run', 'build']], ['npm', ['run', 'test:browser']],
  [process.execPath, ['scripts/validate-docs.mjs']], ['npm', ['run', 'package:acquisition']],
];
mkdirSync('release', { recursive: true });
const save = () => writeFileSync('release/VERIFICATION.json', JSON.stringify(receipt, null, 2) + '\n');
save();
let failed = false;
for (const [command, args] of steps) {
  const stepStartedAt = new Date().toISOString();
  const started = Date.now();
  console.log(`\nVerification: ${command} ${args.join(' ')} [${receipt.commit}]`);
  // Only fixed commands from the list above are passed to cmd on Windows.
  const windowsNpm = process.platform === 'win32' && command === 'npm';
  const result = spawnSync(windowsNpm ? 'cmd.exe' : command, windowsNpm ? ['/d', '/s', '/c', 'npm.cmd', ...args] : args, { stdio: 'inherit' });
  const exitCode = result.status ?? 1;
  receipt.steps.push({ command: `${command} ${args.join(' ')}`, startedAt: stepStartedAt, finishedAt: new Date().toISOString(), elapsedMs: Date.now() - started, exitCode, error: result.error?.message ?? null });
  save();
  if (exitCode !== 0) { failed = true; break; }
}
receipt.finishedAt = new Date().toISOString();
receipt.result = failed ? 'failed' : 'passed';
save();
console.log(`Verification ${receipt.result}: release/VERIFICATION.json (commit ${receipt.commit}, dirty=${receipt.treeDirty})`);
process.exitCode = failed ? 1 : 0;
