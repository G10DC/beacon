import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

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
      const line = String(rawLine ?? '').trim();
      if (!line) return;

      // ONE pattern, and it is deliberately the same shape shipwright validates with.
      //
      // This used to be seven near-copies of a regex that had drifted from shipwright's,
      // and every point of drift produced a changelog that disagreed with the commit hook
      // about what a valid commit is:
      //
      //   `feat:no space`      shipwright rejects it; this categorised it as a feature
      //                        with the summary "no space"
      //   `feat: `             shipwright rejects it; this emitted a bare "- " bullet, a
      //                        released changelog line that says nothing
      //   `chore(a/b.c-d): x`  shipwright accepts it; the scope class here was
      //                        [a-z0-9-], so it fell through to `other` and lost its
      //                        category
      //
      // Neither tool was observably broken on its own. The disagreement only shows up
      // when something puts them in sequence, which is exactly what a release pipeline
      // does: a commit the hook would have blocked still reaches the changelog if it was
      // made with --no-verify, or before the hook existed, or on a merge.
      // BREAKING CHANGE is a FOOTER token, not a subject prefix: it arrives on its own
      // line from the commit body and is never a conventional subject. It is checked
      // first, and unconditionally, because requiring a valid subject here would silently
      // stop detecting the documented spelling of a breaking change.
      if (/BREAKING[ -]CHANGE/i.test(line)) {
        categories.breaking.push(line);
        return;
      }

      const m = line.match(
        /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|opt)(?:\(([A-Za-z0-9._/-]+)\))?(!)?: (.+)$/
      );

      // Not a conventional commit. It goes to `other` verbatim rather than being parsed
      // into a category it does not belong in: an entry nobody can categorise is still an
      // entry, and dropping it would hide a release note.
      if (!m) {
        categories.other.push(line);
        return;
      }

      const [, type, , bang, summary] = m;
      if (bang) {
        categories.breaking.push(line);
        return;
      }
      // A valid commit whose type has no rendered section — chore, test, ci, build,
      // style, revert, opt — keeps its whole subject under `other`. The type prefix is
      // the only thing distinguishing those entries once they are uncategorised, and
      // dropping it would make the section unreadable.
      if (Object.prototype.hasOwnProperty.call(categories, type)) categories[type].push(summary.trim());
      else categories.other.push(line);
    });

    let suggestedBump = 'PATCH';
    if (categories.breaking.length > 0) suggestedBump = 'MAJOR';
    else if (categories.feat.length > 0) suggestedBump = 'MINOR';

    return { categories, suggestedBump };
  }

  generateChangelog(version, commitData) {
    // `typeof x` is always a truthy string, so this used to always take the
    // `commitData` branch and never call parseCommits() on raw input.
    const { categories, suggestedBump } = commitData && commitData.categories
      ? commitData
      : this.parseCommits(commitData);
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

    // `other` was collected and never rendered, so everything the parser could not
    // categorise vanished between parseCommits() and the changelog. A caller reading the
    // parse result saw those entries; a caller reading the changelog did not, and nothing
    // said so.
    //
    // Most of them are chore and ci commits nobody wants in release notes. Some of them
    // are subjects that are not conventional commits at all — and those are exactly the
    // ones that might be a release note, written by someone who did not know the format.
    // Silently discarding both is how a genuine change leaves no trace.
    if (categories.other.length > 0) {
      md += `### 📦 Other changes\n`;
      categories.other.forEach(item => { md += `- ${item}\n`; });
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
  const rangeIdx = args.indexOf('--range');
  const countIdx = args.indexOf('--count');
  if (cIdx !== -1 && args[cIdx + 1]) {
    rawCommits = args[cIdx + 1];
  } else {
    try {
      // No shell: each value is a separate argv entry, so --range can't inject.
      const gitArgs = ['log', '--oneline'];
      if (rangeIdx !== -1 && args[rangeIdx + 1]) {
        gitArgs.push(args[rangeIdx + 1]); // e.g. "v1.2.0..HEAD"
      } else {
        const count = countIdx !== -1 && /^\d+$/.test(args[countIdx + 1] || '') ? args[countIdx + 1] : '50';
        gitArgs.push('-n', count);
      }
      rawCommits = execFileSync('git', gitArgs, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    } catch (e) {
      rawCommits = 'feat: initial release';
    }
  }

  const parsed = generator.parseCommits(rawCommits);
  console.log(generator.generateChangelog(version, parsed));
}
