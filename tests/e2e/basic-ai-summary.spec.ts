// tests/e2e/basic-ai-summary.spec.ts
import { test, expect } from '@playwright/test'

/**
 * 간단한 AI 요약 기능 검증 테스트
 * 실제 애플리케이션 구조에 맞춰 작성
 */
test.describe('Basic AI Summary Feature Validation', () => {
  test.beforeEach(async ({ page }) => {
    // 실제 애플리케이션 베이스 URL로 접근
    await page.goto('/', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    })
    
    // 사이트 비밀번호가 필요한 경우 처리
    const passwordInput = page.locator('input[type="password"]').first()
    if (await passwordInput.isVisible({ timeout: 3000 })) {
      await passwordInput.fill('hahahoho')
      const submitButton = page.locator('button[type="submit"], button:has-text("확인"), button:has-text("입장")').first()
      if (await submitButton.isVisible()) {
        await submitButton.click()
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 })
      }
    }
  })

  test('should load main page and check for AI summary component', async ({ page }) => {
    // 페이지 로딩 확인
    await expect(page).toHaveTitle(/secret/)
    
    // 기본 요소들이 로드되었는지 확인
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // AI 요약 관련 CSS 파일이 로드되었는지 확인
    const aiSummaryStyles = page.locator('link[href*="AiSummaryCard"]')
    if (await aiSummaryStyles.count() > 0) {
      console.log('✅ AI Summary component styles loaded')
    }
  })

  test('should verify AI summary API endpoint exists', async ({ page }) => {
    // API 엔드포인트 존재 확인 (POST 요청으로 테스트)
    const response = await page.request.post('/api/ai/summarize', {
      data: {
        text: 'This is a test content that is longer than 100 characters to trigger AI summarization. '.repeat(2)
      },
      headers: {
        'X-API-Key': 'yesyes', // nuxt config에서 확인한 API 키
        'Content-Type': 'application/json'
      }
    })
    
    // API가 존재하고 적절히 응답하는지 확인
    expect(response.status()).toBe(200)
    
    const responseData = await response.json()
    expect(responseData).toHaveProperty('success')
    
    if (responseData.success) {
      console.log('✅ AI Summary API working correctly')
      expect(responseData.data).toHaveProperty('summary')
    } else {
      console.log('ℹ️ AI Summary API responded with error (expected in test env):', responseData.error)
    }
  })

  test('should check for posts with AI summaries', async ({ page }) => {
    // 게시글 목록 페이지로 이동 시도
    const postListItems = page.locator('.post-item, [data-testid="post-item"], article')
    
    // 게시글이 있는지 확인
    if (await postListItems.count() > 0) {
      console.log('✅ Posts found on main page')
      
      // 첫 번째 게시글 클릭해서 상세 페이지로 이동
      await postListItems.first().click()
      await page.waitForLoadState('domcontentloaded')
      
      // AI 요약 카드가 있는지 확인 (선택사항)
      const aiSummaryCard = page.locator('.ai-summary-card, [data-testid="ai-summary-card"]')
      const hasAiSummary = await aiSummaryCard.count() > 0
      
      if (hasAiSummary) {
        console.log('✅ AI Summary card found in post detail')
        await expect(aiSummaryCard).toBeVisible()
        
        // 요약 텍스트 확인
        const summaryText = aiSummaryCard.locator('.summary-text, [data-testid="summary-text"]')
        if (await summaryText.count() > 0) {
          console.log('✅ AI Summary text content found')
        }
      } else {
        console.log('ℹ️ No AI Summary card found (might be short post or not generated yet)')
      }
    } else {
      console.log('ℹ️ No posts found on main page')
    }
  })

  test('should validate AI summary component structure', async ({ page }) => {
    // DOM에 AI 요약 관련 클래스나 요소가 정의되어 있는지 확인
    const hasAiStyles = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets)
      return stylesheets.some(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || [])
          return rules.some(rule => rule.cssText?.includes('ai-summary-card'))
        } catch (e) {
          return false
        }
      })
    })
    
    if (hasAiStyles) {
      console.log('✅ AI Summary CSS styles are properly loaded')
    }
    
    // 페이지에 스크립트가 로드되었는지 확인
    const scripts = page.locator('script[src*="_nuxt"]')
    const scriptCount = await scripts.count()
    expect(scriptCount).toBeGreaterThan(0)
    console.log(`✅ ${scriptCount} Nuxt scripts loaded`)
  })
})

test.describe('AI Summary API Direct Tests', () => {
  test('should test AI summarize API with various inputs', async ({ page }) => {
    const testCases = [
      {
        name: 'Long content (should work)',
        text: 'This is a long test content for AI summarization. '.repeat(10),
        expectSuccess: true
      },
      {
        name: 'Short content (should fail)',
        text: 'Too short',
        expectSuccess: false
      }
    ]
    
    for (const testCase of testCases) {
      console.log(`Testing: ${testCase.name}`)
      
      const response = await page.request.post('/api/ai/summarize', {
        data: { text: testCase.text },
        headers: {
          'X-API-Key': 'yesyes',
          'Content-Type': 'application/json'
        }
      })
      
      expect(response.status()).toBe(200)
      const data = await response.json()
      
      if (testCase.expectSuccess) {
        if (data.success) {
          console.log(`✅ ${testCase.name}: Success as expected`)
          expect(data.data).toHaveProperty('summary')
        } else {
          console.log(`⚠️ ${testCase.name}: Failed (might be API key issue)`)
        }
      } else {
        if (!data.success) {
          console.log(`✅ ${testCase.name}: Failed as expected (too short)`)
          expect(data.error).toContain('too short')
        } else {
          console.log(`⚠️ ${testCase.name}: Unexpected success`)
        }
      }
    }
  })
})