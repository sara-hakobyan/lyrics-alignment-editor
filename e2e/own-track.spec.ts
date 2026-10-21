import { test, expect } from '@playwright/test';

test('a track the user adds keeps its lines after a reload', async ({ page }) => {
  await page.goto('/');

  // Add a track from the track menu: audio file + 3 lyric lines.
  await page.getByRole('button', { name: /^Track:/ }).click();
  await page.getByRole('button', { name: 'Add track' }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Title').fill('Test Song');
  await form.getByLabel('Audio file').setInputFiles('apps/api/public/audio/you-verse-you.mp3');
  await form.getByLabel('Lyrics').fill('First line\nSecond line\nThird line');
  await form.getByRole('button', { name: 'Add track' }).click();

  // Open it: it has its own 3 lines, none timed yet.
  await page.getByRole('button', { name: /^Track:/ }).click();
  await page.getByRole('button', { name: /^Test Song/ }).click();
  await expect(page.getByRole('heading', { name: 'Lyrics (3)' })).toBeVisible();
  await expect(page.getByText('3 untimed')).toBeVisible();
  await expect(page.getByText('Second line')).toBeVisible();

  // Reload the page: the track is still there (saved in the browser).
  await page.reload();
  await page.getByRole('button', { name: /^Track:/ }).click();
  await page.getByRole('button', { name: /^Test Song/ }).click();
  await expect(page.getByRole('heading', { name: 'Lyrics (3)' })).toBeVisible();
  await expect(page.getByText('Second line')).toBeVisible();
});
