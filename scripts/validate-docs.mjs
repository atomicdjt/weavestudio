import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

function runValidation() {
  let hasErrors = false;
  const rootDir = process.cwd();

  const fail = (msg) => {
    console.error(msg);
    hasErrors = true;
  };

  // 1. Verify .seller-private is ignored
  try {
    execSync('git check-ignore .seller-private/foo.txt', { stdio: 'ignore' });
  } catch (e) {
    fail('Error: .seller-private is not ignored by git.');
  }

  // 2. Verify scripts/package-release.mjs excludes
  const packageRelease = readFileSync(join(rootDir, 'scripts', 'package-release.mjs'), 'utf8');
  if (!packageRelease.includes("'.seller-private'") || !packageRelease.includes("'.worktrees'")) {
    fail('Error: scripts/package-release.mjs does not exclude .seller-private or .worktrees.');
  }

  // 3. Verify docs/acquisition is not tracked
  const trackedAcquisition = execSync('git ls-files docs/acquisition').toString().trim();
  if (trackedAcquisition.length > 0) {
    fail(`Error: docs/acquisition contains tracked files: ${trackedAcquisition}`);
  }

  // 4. Verify mailto links
  const acquirePage = readFileSync(join(rootDir, 'src', 'pages', 'AcquirePage.tsx'), 'utf8');
  if (!acquirePage.includes('mailto:davidelsey9513@gmail.com')) {
    fail('Error: AcquirePage.tsx missing valid mailto link.');
  }
  const docsPage = readFileSync(join(rootDir, 'src', 'pages', 'DocsPage.tsx'), 'utf8');
  if (!docsPage.includes('mailto:davidelsey9513@gmail.com')) {
    fail('Error: DocsPage.tsx missing valid mailto link.');
  }

  // 5. Verify LICENSE.md owner
  const licenseContent = readFileSync(join(rootDir, 'LICENSE.md'), 'utf8');
  if (!licenseContent.includes('Copyright © 2026 David Turner')) {
    fail('Error: LICENSE.md missing actual copyright owner (David Turner).');
  }
  if (licenseContent.includes('[Seller Name]')) {
    fail('Error: LICENSE.md contains placeholder [Seller Name].');
  }

  // 6. Verify legal templates marked as drafts
  const apaFile = join(rootDir, 'docs', 'buyer', 'legal', 'ASSET_PURCHASE_AND_IP_ASSIGNMENT_TEMPLATE.md');
  const ndaFile = join(rootDir, 'docs', 'buyer', 'legal', 'NDA_TEMPLATE.md');
  if (existsSync(apaFile) && !/legal.?review/i.test(readFileSync(apaFile, 'utf8'))) {
    fail('Error: APA template missing legal review warning.');
  }
  if (existsSync(ndaFile) && !/legal.?review/i.test(readFileSync(ndaFile, 'utf8'))) {
    fail('Error: NDA template missing legal review warning.');
  }

  // 7. Verify confidential content and unauthorized placeholders
  const restrictedPatterns = [
    /\.invalid/i,
    /\[Security Email\]/i,
    /\[Acquisition Email\]/i,
    /\[CONFIDENTIAL\]/i,
    /docs\/acquisition\//i,
    /\$3,500/i,
    /\b3500\b/,
    /\$4,500/i,
    /\b4500\b/,
    /\$5,000–\$5,750/i,
    /\$5,000-\$5,750/i,
    /confidential floor/i,
    /target close/i,
    /negotiation strategy/i,
    /scoring notes/i
  ];
  const sellerNamePattern = /\[Seller Name\]/i;

  const allowedLegalFiles = [
    'docs/buyer/legal/NDA_TEMPLATE.md',
    'docs/buyer/legal/ASSET_PURCHASE_AND_IP_ASSIGNMENT_TEMPLATE.md'
  ];

  // List all tracked files to scan
  const allTracked = execSync('git ls-files').toString().trim().split('\n').filter(Boolean);
  
  for (const file of allTracked) {
    if (file === 'scripts/validate-docs.mjs') continue; // Skip self

    const isLegalTemplate = allowedLegalFiles.includes(file.replace(/\\/g, '/'));
    let content;
    try {
      content = readFileSync(join(rootDir, file), 'utf8');
    } catch {
      continue; // skip binary or unreadable
    }

    for (const regex of restrictedPatterns) {
      if (regex.test(content)) {
        fail(`Error: Restricted content found in ${file} matching ${regex}`);
      }
    }

    // Only allow [Seller Name] inside explicit legal templates
    if (!isLegalTemplate && sellerNamePattern.test(content)) {
      fail(`Error: [Seller Name] placeholder found in non-legal file ${file}`);
    }
  }

  if (hasErrors) {
    console.error('Document validation failed.');
    process.exit(1);
  } else {
    console.log('Document validation passed.');
  }
}

runValidation();
