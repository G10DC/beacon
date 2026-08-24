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

// shipwright.validateCommitMessage is the arbiter of the commit format; this parser has
// to agree with it, because a release pipeline puts them in sequence. Each case below is
// a point where the two used to disagree, and none of them was observably broken alone.
describe('agreement with the commit-message validator', () => {
  const generator = new BeaconGenerator();

  it('does not accept a subject with no space after the colon', () => {
    const res = generator.parseCommits(['feat:no space']);
    assert.deepStrictEqual(res.categories.feat, []);
    assert.deepStrictEqual(res.categories.other, ['feat:no space']);
  });

  it('never produces an empty changelog entry', () => {
    const res = generator.parseCommits(['feat: ', 'fix:   ']);
    assert.deepStrictEqual(res.categories.feat, []);
    assert.deepStrictEqual(res.categories.fix, []);
    const md = generator.generateChangelog('1.0.0', res);
    assert.ok(!/^- *$/m.test(md), `an empty bullet reached the changelog:\n${md}`);
  });

  it('accepts every scope character the validator accepts', () => {
    const res = generator.parseCommits(['feat(a/b.c-d_e): x', 'feat(T-001): y', 'fix(WEB-12): z']);
    assert.deepStrictEqual(res.categories.feat, ['x', 'y']);
    assert.deepStrictEqual(res.categories.fix, ['z']);
    assert.deepStrictEqual(res.categories.other, []);
  });

  it('keeps a valid commit whose type has no section, with its type prefix', () => {
    const res = generator.parseCommits(['chore(deps): bump', 'ci: add a workflow']);
    assert.deepStrictEqual(res.categories.other, ['chore(deps): bump', 'ci: add a workflow']);
  });

  it('still detects the footer spelling of a breaking change', () => {
    const res = generator.parseCommits(['feat: new auth', 'BREAKING CHANGE: drop v1']);
    assert.strictEqual(res.suggestedBump, 'MAJOR');
    assert.strictEqual(res.categories.breaking.length, 1);
  });

  it('treats a bang as breaking only on a well-formed subject', () => {
    const res = generator.parseCommits(['feat(api)!: drop v1', 'not a commit!: at all']);
    assert.deepStrictEqual(res.categories.breaking, ['feat(api)!: drop v1']);
    assert.deepStrictEqual(res.categories.other, ['not a commit!: at all']);
  });
});
