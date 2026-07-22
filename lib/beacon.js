import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Beacon Release Notes & Changelog Generator
 */
export class BeaconGenerator {
  parseCommits(commitLines) {
    const categories = {
      breaking: [],
      feat: [],
      fix: [],
      perf: [],
      refactor: [],
      docs: [],
      other: []
    };

    const lines = typeof commitLines === 'string' ? commitLines.split('\n') : commitLines;

    lines.forEach(rawLine => {
      const line = rawLine.trim();
      if (!line) return;

      if (/BREAKING CHANGE|!:/i.test(line)) {
        categories.breaking.push(line);
      } else if (/^feat(\([a-z0-9-]+\))?:/i.test(line)) {
        categories.feat.push(line.replace(/^feat(\([a-z0-9-]+\))?:\s*/i, ''));
      } else if (/^fix(\([a-z0-9-]+\))?:/i.test(line)) {
        categories.fix.push(line.replace(/^fix(\([a-z0-9-]+\))?:\s*/i, ''));
      } else if (/^perf(\([a-z0-9-]+\))?:/i.test(line)) {
        categories.perf.push(line.replace(/^perf(\([a-z0-9-]+\))?:\s*/i, ''));
      } else if (/^refactor(\([a-z0-9-]+\))?:/i.test(line)) {
        categories.refactor.push(line.replace(/^refactor(\([a-z0-9-]+\))?:\s*/i, ''));
      } else if (/^docs(\([a-z0-9-]+\))?:/i.test(line)) {
        categories.docs.push(line.replace(/^docs(\([a-z0-9-]+\))?:\s*/i, ''));
      } else {
        categories.other.push(line);
      }
    });

    let suggestedBump = 'PATCH';
    if (categories.breaking.length > 0) suggestedBump = 'MAJOR';
    else if (categories.feat.length > 0) suggestedBump = 'MINOR';

    return { categories, suggestedBump };
  }

  generateChangelog(version, commitData) {
    const { categories, suggestedBump } = typeof commitData.categories ? commitData : this.parseCommits(commitData);
    const dateStr = new Date().toISOString().split('T')[0];

    let md = `## [${version}] - ${dateStr}\n`;
    md += `*Suggested SemVer Bump*: \`${suggestedBump}\`\n\n`;

    if (categories.breaking.length > 0) {
      md += `### ⚠️ BREAKING CHANGES\n`;
      categories.breaking.forEach(item => { md += `- ${item}\n`; });
      md += `\n`;
    }

    if (categories.feat.length > 0) {
      md += `### 🚀 Features\n`;
      categories.feat.forEach(item => { md += `- ${item}\n`; });
      md += `\n`;
    }

    if (categories.fix.length > 0) {
      md += `### 🐛 Bug Fixes\n`;
      categories.fix.forEach(item => { md += `- ${item}\n`; });
      md += `\n`;
    }

    if (categories.perf.length > 0) {
      md += `### ⚡ Performance\n`;
      categories.perf.forEach(item => { md += `- ${item}\n`; });
      md += `\n`;
    }

    if (categories.refactor.length > 0) {
      md += `### 🛠 Refactoring\n`;
      categories.refactor.forEach(item => { md += `- ${item}\n`; });
      md += `\n`;
    }

    if (categories.docs.length > 0) {
      md += `### 📚 Documentation\n`;
      categories.docs.forEach(item => { md += `- ${item}\n`; });
      md += `\n`;
    }

    return md;
  }
}

// CLI Handler
if (process.argv[1] && process.argv[1].endsWith('beacon.js')) {
  const args = process.argv.slice(2);
  const generator = new BeaconGenerator();
  let version = 'v1.0.0';
  const vIdx = args.indexOf('--version');
  if (vIdx !== -1 && args[vIdx + 1]) version = args[vIdx + 1];

  let rawCommits = '';
  const cIdx = args.indexOf('--commits');
  if (cIdx !== -1 && args[cIdx + 1]) {
    rawCommits = args[cIdx + 1];
  } else {
    try {
      rawCommits = execSync('git log -n 50 --oneline', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    } catch (e) {
      rawCommits = 'feat: initial release';
    }
  }

  const parsed = generator.parseCommits(rawCommits);
  console.log(generator.generateChangelog(version, parsed));
}
