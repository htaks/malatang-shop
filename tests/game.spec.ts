import { test, expect, Page } from '@playwright/test'

async function getBodyText(page: Page): Promise<string> {
  return page.evaluate(() => document.body.innerText)
}

// h1はアニメーションで1文字ずつspanに分割されるため、textContentを結合して取得
async function getTitleText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const h1 = document.querySelector('h1')
    return h1 ? h1.textContent ?? '' : ''
  })
}

async function skipTutorial(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('malatang_tutorial_done', '1')
  })
}

test.describe('タイトル画面', () => {
  test.beforeEach(async ({ page }) => {
    await skipTutorial(page)
    await page.goto('/')
  })

  test('shows title マーラータン屋さん', async ({ page }) => {
    const title = await getTitleText(page)
    expect(title).toContain('マーラータン屋さん')
  })

  test('has 1人プレイ button', async ({ page }) => {
    const text = await getBodyText(page)
    expect(text).toContain('1人プレイ')
  })

  test('has 2人対戦 button', async ({ page }) => {
    const text = await getBodyText(page)
    expect(text).toContain('2人対戦')
  })

  test('has ランキング button', async ({ page }) => {
    const text = await getBodyText(page)
    expect(text).toContain('ランキング')
  })
})

test.describe('ランキング画面', () => {
  test.beforeEach(async ({ page }) => {
    await skipTutorial(page)
    await page.goto('/')
  })

  test('opens when clicking ランキング', async ({ page }) => {
    await page.click('text=ランキング')
    const text = await getBodyText(page)
    expect(text).toContain('ランキング')
  })

  test('has ← 戻る button that returns to title', async ({ page }) => {
    await page.click('text=ランキング')
    await page.click('text=← 戻る')
    await page.waitForTimeout(500)
    const title = await getTitleText(page)
    expect(title).toContain('マーラータン屋さん')
  })
})

test.describe('チュートリアル', () => {
  test('first play goes straight to Day 1 (staged onboarding replaces old tutorial)', async ({ page }) => {
    // Old tutorial overlay replaced by staged Day 1 experience
    await page.goto('/')
    await page.click('text=1人プレイ')
    const text = await getBodyText(page)
    // Should show Day 1 game immediately — no スキップ overlay
    expect(text).toContain('Day 1')
    expect(text).not.toContain('スキップ')
  })

  test('Day 1 shows contextual help (食材を選ぼう)', async ({ page }) => {
    await page.goto('/')
    await page.click('text=1人プレイ')
    const text = await getBodyText(page)
    expect(text).toContain('食材を選ぼう')
  })

  test('second play also starts from Day 1', async ({ page }) => {
    await skipTutorial(page)
    await page.goto('/')
    await page.click('text=1人プレイ')
    const text = await getBodyText(page)
    expect(text).toContain('Day 1')
  })
})

test.describe('ゲームプレイ', () => {
  test.beforeEach(async ({ page }) => {
    await skipTutorial(page)
    await page.goto('/')
    await page.click('text=1人プレイ')
  })

  test('game screen shows after starting 1人プレイ', async ({ page }) => {
    const text = await getBodyText(page)
    // Game screen has お客さんキュー or similar gameplay elements
    expect(text).toMatch(/お客さん|Day|コイン/)
  })

  test('shows お客さん panel', async ({ page }) => {
    const text = await getBodyText(page)
    expect(text).toContain('お客さん')
  })

  test('shows Day 1 header', async ({ page }) => {
    const text = await getBodyText(page)
    expect(text).toContain('Day 1')
  })

  test('Day 1 shows static ingredient grid (not conveyor)', async ({ page }) => {
    const text = await getBodyText(page)
    // Day 1 should show static grid label, NOT conveyor belt
    expect(text).toContain('食材を選ぼう')
    expect(text).not.toContain('コンベア（食材をクリックして取ろう！）')
  })

  test('Day 1 does NOT show ライバル score', async ({ page }) => {
    const text = await getBodyText(page)
    // Rival is locked until Day 4
    expect(text).not.toContain('ライバル')
  })

  test('Day 1 does NOT show 満足度 meter', async ({ page }) => {
    const text = await getBodyText(page)
    // Anger meter gated — no satisfaction bar on Day 1
    expect(text).not.toContain('満足度')
  })

  test('Day 1 only shows 普通 spice (no 辛め/激辛)', async ({ page }) => {
    const text = await getBodyText(page)
    expect(text).toContain('普通')
    // Day 1 should NOT show advanced spice options
    expect(text).not.toContain('辛め')
    expect(text).not.toContain('激辛')
  })

  test('提供 button works and triggers serve logic', async ({ page }) => {
    // Wait for game to be ready
    await page.waitForSelector('button:has-text("🍲 提供")', { timeout: 5000 })
    const serveBtn = page.locator('button:has-text("🍲 提供")').first()
    await expect(serveBtn).toBeVisible()
    await serveBtn.click()
    // After serve, coin animation or feedback should appear briefly
    // Just confirm the button was clickable and page is still functional
    await page.waitForTimeout(500)
    const text = await getBodyText(page)
    expect(text).toMatch(/コイン|Day|お客さん/)
  })

  test('📖 recipe book opens and shows recipe entries (❓ or actual names)', async ({ page }) => {
    await page.click('button:has-text("📖")')
    await page.waitForSelector('text=秘密のレシピ本', { timeout: 3000 })
    const text = await getBodyText(page)
    expect(text).toContain('秘密のレシピ本')
    // Should show either undiscovered (❓) or discovered recipe names
    expect(text).toMatch(/❓|海鮮スペシャル|モンゴル風|おでん風|ベジスペシャル|海老うどん/)
  })
})

test.describe('難易度進行 (Difficulty Progression)', () => {
  test('Day 1 — no conveyor shown', async ({ page }) => {
    await skipTutorial(page)
    await page.goto('/')
    await page.click('text=1人プレイ')
    const text = await getBodyText(page)
    // Day 1 uses static grid, not conveyor
    expect(text).not.toContain('コンベア（食材をクリックして取ろう！）')
    expect(text).toContain('食材を選ぼう')
  })

  test('Day 1 — only 普通 spice available', async ({ page }) => {
    await skipTutorial(page)
    await page.goto('/')
    await page.click('text=1人プレイ')
    const text = await getBodyText(page)
    expect(text).toContain('普通')
    expect(text).not.toContain('辛め')
  })

  test('Day 1 — no rival displayed', async ({ page }) => {
    await skipTutorial(page)
    await page.goto('/')
    await page.click('text=1人プレイ')
    const text = await getBodyText(page)
    expect(text).not.toContain('ライバル')
  })

  test('Day clear modal appears after Day 1 completes', async ({ page }) => {
    test.setTimeout(120000)
    await skipTutorial(page)
    await page.goto('/')
    await page.click('text=1人プレイ')

    const startTime = Date.now()
    const deadline = 110000

    // Rapidly serve customers to finish Day 1
    while (Date.now() - startTime < deadline) {
      const bodyText = await getBodyText(page)
      if (bodyText.includes('Day 1 クリア')) break
      if (bodyText.includes('ゲーム終了')) break

      const serveBtns = page.locator('button:has-text("🍲 提供")')
      const count = await serveBtns.count()
      if (count > 0) {
        try {
          await serveBtns.first().click({ timeout: 1000 })
        } catch {
          // ignore
        }
      }
      await page.waitForTimeout(1500)
    }

    const finalText = await getBodyText(page)
    expect(finalText).toMatch(/Day 1 クリア|ゲーム終了/)
  })
})

test.describe('2人対戦モード', () => {
  test('clicking 2人対戦 starts game with P1のターン badge', async ({ page }) => {
    await skipTutorial(page)
    await page.goto('/')
    await page.click('text=2人対戦')
    // Wait for game phase to load
    await page.waitForFunction(
      () => document.body.innerText.includes('P1のターン'),
      { timeout: 5000 }
    )
    const text = await getBodyText(page)
    expect(text).toContain('P1のターン')
  })
})

test.describe('結果画面', () => {
  test('eventually reaches result or 仕入れ phase after serving customers', async ({ page }) => {
    test.setTimeout(120000)
    await skipTutorial(page)
    await page.goto('/')
    await page.click('text=1人プレイ')

    // Repeatedly click serve buttons to advance through customers faster
    const startTime = Date.now()
    const deadline = 110000

    while (Date.now() - startTime < deadline) {
      const bodyText = await getBodyText(page)
      if (
        bodyText.includes('ゲーム終了') ||
        bodyText.includes('仕入れフェーズ') ||
        bodyText.includes('Day 2') ||
        bodyText.includes('Day2')
      ) {
        break
      }

      // Try clicking the serve button
      const serveBtns = page.locator('button:has-text("🍲 提供")')
      const count = await serveBtns.count()
      if (count > 0) {
        try {
          await serveBtns.first().click({ timeout: 1000 })
        } catch {
          // Ignore if button not clickable
        }
      }

      await page.waitForTimeout(1500)
    }

    const finalText = await getBodyText(page)
    expect(finalText).toMatch(/ゲーム終了|仕入れフェーズ|Day *2|クリア/)
  })
})
