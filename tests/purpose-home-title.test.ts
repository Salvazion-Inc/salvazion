import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HOME_TITLE_EN,
  HOME_TITLE_ES,
  HOME_TITLE_PT,
  PURPOSE,
  PURPOSE_ES,
  PURPOSE_PT,
  homeDocumentTitle,
  purposeHeroLines,
  purposeSentence,
} from '../lib/seo/config';

test('home hero lines are the official purpose in each language', () => {
  assert.equal(purposeHeroLines('en').join(' '), `${PURPOSE}.`);
  assert.equal(purposeHeroLines('es').join(' '), `${PURPOSE_ES}.`);
  assert.equal(purposeHeroLines('pt').join(' '), `${PURPOSE_PT}.`);
  assert.equal(purposeHeroLines(undefined).join(' '), `${PURPOSE}.`);
});

test('MTP title is the official purpose in each language', () => {
  assert.equal(purposeSentence('en'), `${PURPOSE}.`);
  assert.equal(purposeSentence('es'), `${PURPOSE_ES}.`);
  assert.equal(purposeSentence('pt'), `${PURPOSE_PT}.`);
  assert.equal(purposeSentence(undefined), `${PURPOSE}.`);
});

test('home tab title follows the language', () => {
  assert.equal(homeDocumentTitle('en'), HOME_TITLE_EN);
  assert.equal(HOME_TITLE_EN, 'Salvazion | Restore Salvation, Health and Freedom');
  assert.equal(homeDocumentTitle('es'), HOME_TITLE_ES);
  assert.equal(HOME_TITLE_ES, 'Salvazion | Restaurar Salvación, Salud y Libertad');
  assert.equal(homeDocumentTitle('pt'), HOME_TITLE_PT);
  assert.equal(HOME_TITLE_PT, 'Salvazion | Restaurar Salvação, Saúde e Liberdade');
  assert.equal(homeDocumentTitle(undefined), HOME_TITLE_EN);
});
