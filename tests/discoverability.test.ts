import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aiJson, aiTxt, robotsTxt } from '../lib/discoverability';

test('salvazion robots opens public pages to search and AI use', () => {
  const body = robotsTxt();
  const agents = body.match(/^User-agent: /gm) || [];
  const signals =
    body.match(/^Content-Signal: search=yes, ai-input=yes, ai-train=yes$/gm) || [];
  assert.equal(signals.length, agents.length);
  assert.ok(agents.length > 20);
  for (const token of [
    'Googlebot',
    'Bingbot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'GPTBot',
    'Claude-SearchBot',
    'ClaudeBot',
    'PerplexityBot',
    'Google-Extended',
    'DuckAssistBot',
    'Applebot',
  ]) {
    assert.match(body, new RegExp(`^User-agent: ${token}$`, 'm'));
  }
  assert.match(body, /^Allow: \/$/m);
  assert.equal(body.includes('\nDisallow: /\n'), false);
  assert.match(body, /^Disallow: \/api\/$/m);
  assert.match(body, /^Disallow: \/hub\/$/m);
  assert.match(body, /^Sitemap: https:\/\/salvazion\.org\/sitemap\.xml$/m);
});

test('salvazion ai policy allows citation and keeps private paths out of training', () => {
  const text = aiTxt();
  assert.match(text, /^Training: conditional$/m);
  assert.match(text, /^Indexing: allow$/m);
  assert.match(text, /^Scraping: allow$/m);
  assert.match(text, /^Training-Allow: \/$/m);
  assert.match(text, /^Training-Deny: \/api\/\*$/m);
  assert.match(text, /^Training-Deny: \/hub\/\*$/m);
  assert.match(text, /^Attribution: recommended$/m);
  assert.match(text, /Restore Salvation, Health and Freedom to the Human Person created in the image of God/);

  const json = JSON.parse(aiJson()) as {
    policies: { training: string; indexing: string; scraping: string };
    trainingDeny: string[];
    site: { url: string };
  };
  assert.equal(json.site.url, 'https://salvazion.org');
  assert.equal(json.policies.training, 'conditional');
  assert.equal(json.policies.indexing, 'allow');
  assert.equal(json.policies.scraping, 'allow');
  assert.ok(json.trainingDeny.includes('/api/*'));
});
