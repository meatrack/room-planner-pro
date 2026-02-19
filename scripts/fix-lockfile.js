import { execSync } from 'child_process';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const projectDir = '/vercel/share/v0-project';
const lockFile = join(projectDir, 'package-lock.json');

// Delete existing lock file
if (existsSync(lockFile)) {
  unlinkSync(lockFile);
  console.log('Deleted existing package-lock.json');
} else {
  console.log('No existing package-lock.json found');
}

// Regenerate lock file
console.log('Regenerating package-lock.json...');
try {
  const output = execSync('npm install --package-lock-only', {
    cwd: projectDir,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  console.log(output);
  console.log('Lock file regenerated successfully!');
} catch (error) {
  console.error('Error regenerating lock file:', error.message);
  if (error.stderr) console.error('stderr:', error.stderr);
  if (error.stdout) console.log('stdout:', error.stdout);
}
