// tests/setup/global-setup.ts
import { chromium } from '@playwright/test'
import type { FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up global test environment...')
  
  // Launch browser for auth setup if needed
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Check if the app is running
    const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000/secret'
    console.log(`🌐 Checking if app is running at ${baseURL}...`)
    
    // Wait for the app to be ready
    let retries = 0
    const maxRetries = 30
    
    while (retries < maxRetries) {
      try {
        await page.goto(baseURL, { timeout: 5000 })
        console.log('✅ App is running and accessible')
        break
      } catch (error) {
        retries++
        if (retries === maxRetries) {
          console.error('❌ App is not accessible. Make sure to run `npm run dev` before running E2E tests.')
          throw new Error(`App not accessible at ${baseURL}. Please start the development server.`)
        }
        console.log(`⏳ Waiting for app to be ready... (${retries}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    // Setup test data or authentication if needed
    await setupTestData(page, baseURL)
    
  } finally {
    await browser.close()
  }
  
  console.log('✅ Global setup completed')
}

async function setupTestData(page: any, baseURL: string) {
  console.log('📊 Setting up test data...')
  
  // If your app has a special test data setup endpoint, call it here
  // For now, we'll just verify basic functionality
  
  try {
    // Navigate to home page to verify basic functionality
    await page.goto(baseURL)
    
    // Check if the main page loads correctly
    const title = await page.title()
    console.log(`📄 Page title: ${title}`)
    
    // You can add more setup here like:
    // - Creating test users
    // - Setting up test posts
    // - Configuring test database
    
  } catch (error) {
    console.warn('⚠️  Test data setup encountered an error:', error)
    // Don't fail the entire test run for data setup issues
  }
}

export default globalSetup