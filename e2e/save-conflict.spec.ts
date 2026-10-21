import { test, expect } from '@playwright/test';

test('a rejected save shows an error and keeps the edit', async ({ page }) => {
  // Break the save payload on purpose, then send it to the real server.
  // The server rejects it with 400, so nothing is written to the database.
  await page.route('**/api/v1/track/alignment', async (route) => {
    const body = route.request().postDataJSON(); // the payload the app built
    body.version = 'abc'; // break it on purpose
    await route.continue({ postData: JSON.stringify(body) }); // send it to the real server
  });

  await page.goto('/');

  // Change the text of line 1.
  await page.getByRole('button', { name: 'Edit text of line 1', exact: true }).click();
  await page.getByLabel('Edit line 1', { exact: true }).fill('My edited line');
  await page.keyboard.press('Enter');

  // Try to save.
  await page.getByRole('button', { name: 'Save changes' }).click();

  // The user sees the server's hint...
  await expect(page.getByRole('alert')).toContainText('send the integer "version"');
  // ...and the edit is still there, ready to be saved again.
  // (.first(): the text shows in the list, the stamp hint and the details panel.)
  await expect(page.getByText('My edited line').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeEnabled();
});
