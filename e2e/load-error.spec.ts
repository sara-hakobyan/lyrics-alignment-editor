import { test, expect } from '@playwright/test';

test('a failed load shows an error, and "Try again" opens the editor', async ({ page }) => {
  // The server is "down" until the retry. Not a request count: StrictMode loads twice in dev.
  let serverDown = true;
  await page.route('**/api/v1/track', (route) =>
    serverDown
      ? route.fulfill({ status: 503, json: { hint: 'The server is down for maintenance.' } })
      : route.continue()
  );

  await page.goto('/');

  // No track loaded, so the error screen shows the server's hint.
  await expect(page.getByRole('heading', { name: "Couldn't open the editor" })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText('The server is down for maintenance.');

  // Once the server is back, retrying loads the track and leaves the error screen.
  serverDown = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'You Verse You' })).toBeVisible();
  await expect(page.getByRole('heading', { name: "Couldn't open the editor" })).toBeHidden();
});
