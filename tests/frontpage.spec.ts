import dotenv from 'dotenv';
import { test, expect } from '@playwright/test';

// Load environment variables from .env file
dotenv.config();

// Access environment variables via process.env
const tssUrl = process.env.BASE_URL!;

test('test', async ({ page }) => {
  await page.goto(tssUrl);
  await expect(page.locator('h1')).toContainText('Trader Support Service');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('#main-content')).toContainText('Sign in to your account');
  await expect(page.locator('form')).toContainText('Email Address');
  await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
  await expect(page.locator('form')).toContainText('Password');
  await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
  await expect(page.locator('form')).toContainText('Sign in');
});