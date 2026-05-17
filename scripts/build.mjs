import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const originalIndex = readFileSync('index.html');

function run(command, args) {
  const exe = join('node_modules', '.bin', process.platform === 'win32' ? `${command}.cmd` : command);
  const result =
    process.platform === 'win32'
      ? spawnSync([exe, ...args].join(' '), { stdio: 'inherit', shell: true })
      : spawnSync(exe, args, { stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exitCode = result.status || 1;
  return result.status === 0;
}

try {
  copyFileSync('index.dev.html', 'index.html');
  console.log('index.html <- index.dev.html');
  if (!run('tsc', ['--noEmit'])) process.exit();
  if (!run('vite', ['build'])) process.exit();
} finally {
  writeFileSync('index.html', originalIndex);
}
