import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BeaconGenerator } from '../lib/beacon.js';

describe('BeaconGenerator', () => {
  it('parses commits and suggests minor version bump for features', () => {
    const generator = new BeaconGenerator();
    const commits = [
      'feat: add user login API',
      'fix: handle empty password input',
      'docs: update README'
    ];
    const res = generator.parseCommits(commits);
    assert.strictEqual(res.suggestedBump, 'MINOR');
    assert.strictEqual(res.categories.feat.length, 1);
    assert.strictEqual(res.categories.fix.length, 1);
    assert.strictEqual(res.categories.docs.length, 1);
  });

  it('suggests major version bump for breaking changes', () => {
    const generator = new BeaconGenerator();
    const commits = [
      'feat: new auth system',
      'BREAKING CHANGE: drop v1 endpoint support'
    ];
    const res = generator.parseCommits(commits);
    assert.strictEqual(res.suggestedBump, 'MAJOR');
    assert.strictEqual(res.categories.breaking.length, 1);
  });

  it('generates clean markdown changelog', () => {
    const generator = new BeaconGenerator();
    const commits = ['feat: initial release'];
    const parsed = generator.parseCommits(commits);
    const md = generator.generateChangelog('v1.0.0', parsed);
    assert.match(md, /## \[v1\.0\.0\]/);
    assert.match(md, /### 🚀 Features/);
  });
});
