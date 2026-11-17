import test from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORTED_LANGUAGES, TRANSLATIONS, LanguageCode } from './translations';
import { THEMES, ThemeId } from '../theme/themes';

test('Supports exactly 10 commercial languages with valid metadata', () => {
  assert.equal(SUPPORTED_LANGUAGES.length, 10);

  const ar = SUPPORTED_LANGUAGES.find(l => l.code === 'ar');
  assert.ok(ar);
  assert.equal(ar?.dir, 'rtl');

  const fa = SUPPORTED_LANGUAGES.find(l => l.code === 'fa');
  assert.ok(fa);
  assert.equal(fa?.dir, 'rtl');

  const en = SUPPORTED_LANGUAGES.find(l => l.code === 'en');
  assert.ok(en);
  assert.equal(en?.dir, 'ltr');

  const fr = SUPPORTED_LANGUAGES.find(l => l.code === 'fr');
  assert.ok(fr);
  assert.equal(fr?.dir, 'ltr');

  const de = SUPPORTED_LANGUAGES.find(l => l.code === 'de');
  assert.ok(de);
  assert.equal(de?.dir, 'ltr');

  const zh = SUPPORTED_LANGUAGES.find(l => l.code === 'zh');
  assert.ok(zh);
  assert.equal(zh?.dir, 'ltr');
});

test('Every language dictionary has all mandatory keys defined and non-empty', () => {
  const arKeys = Object.keys(TRANSLATIONS.ar);
  assert.ok(arKeys.length >= 45);

  const codes: LanguageCode[] = ['ar', 'en', 'fr', 'de', 'it', 'tr', 'ru', 'zh', 'es', 'fa'];

  codes.forEach(code => {
    const dict = TRANSLATIONS[code];
    assert.ok(dict, `Dictionary for ${code} must exist`);

    arKeys.forEach(key => {
      const val = (dict as any)[key];
      assert.ok(val !== undefined && val !== null && String(val).trim().length > 0, 
        `Key ${key} in language ${code} should have non-empty text`);
    });
  });
});

test('Theme configurations contain all 4 distinct themes with Eye Comfort preset', () => {
  const themeIds: ThemeId[] = ['emerald', 'azure', 'amber', 'comfort'];
  
  themeIds.forEach(id => {
    const theme = THEMES[id];
    assert.ok(theme, `Theme ${id} must exist`);
    assert.ok(theme.previewColor.startsWith('#'), `Theme ${id} must have hex color`);
    assert.ok(theme.accentBg.length > 0);
    assert.ok(theme.accentText.length > 0);
  });

  // Verify Eye Comfort Theme
  const comfort = THEMES.comfort;
  assert.ok(comfort.nameAr.includes('راحة العين'));
  assert.equal(comfort.id, 'comfort');
});
