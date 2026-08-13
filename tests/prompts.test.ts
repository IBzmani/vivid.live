import assert from 'node:assert';
import { test, describe } from 'node:test';
import { getStyleGuide } from '../lib/prompts';

describe('Prompts & Style Guide Engine', () => {
  test('generates default Cinematic base style guide', () => {
    const guide = getStyleGuide('Cinematic', 'Drama');
    assert.ok(guide.includes('High-fidelity cinematic concept art'));
    assert.ok(guide.includes('NO text'));
  });

  test('applies Anime Comedy overlay correctly without text tropes', () => {
    const guide = getStyleGuide('Anime', 'Comedy');
    assert.ok(guide.includes('ANIME COMEDY'));
    assert.ok(guide.includes('NO speech bubbles'));
    assert.ok(guide.includes('chibi'));
  });

  test('applies Film Noir overlay correctly', () => {
    const guide = getStyleGuide('Cinematic', 'Noir');
    assert.ok(guide.includes('NOIR'));
    assert.ok(guide.includes('shadows'));
  });
});
