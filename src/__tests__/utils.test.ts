import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getWeekStart, formatWeekLabel, getPastWeeks, CATEGORIES, WIN_CATEGORIES } from '../lib/utils'

describe('getWeekStart', () => {
  it('should return Monday for a Wednesday', () => {
    // Wednesday, Dec 25, 2024
    const wednesday = new Date(2024, 11, 25)
    const result = getWeekStart(wednesday)

    expect(result.getDay()).toBe(1) // Monday
    expect(result.getDate()).toBe(23) // Dec 23
    expect(result.getMonth()).toBe(11) // December
    expect(result.getFullYear()).toBe(2024)
  })

  it('should return same Monday for a Monday input', () => {
    // Monday, Dec 23, 2024
    const monday = new Date(2024, 11, 23)
    const result = getWeekStart(monday)

    expect(result.getDay()).toBe(1)
    expect(result.getDate()).toBe(23)
  })

  it('should handle Sunday correctly (go back to previous Monday)', () => {
    // Sunday, Dec 29, 2024
    const sunday = new Date(2024, 11, 29)
    const result = getWeekStart(sunday)

    expect(result.getDay()).toBe(1) // Monday
    expect(result.getDate()).toBe(23) // Dec 23 (previous Monday)
  })

  it('should handle Saturday correctly', () => {
    // Saturday, Dec 28, 2024
    const saturday = new Date(2024, 11, 28)
    const result = getWeekStart(saturday)

    expect(result.getDay()).toBe(1)
    expect(result.getDate()).toBe(23)
  })

  it('should reset time to midnight', () => {
    const date = new Date(2024, 11, 25, 15, 30, 45)
    const result = getWeekStart(date)

    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
    expect(result.getMilliseconds()).toBe(0)
  })

  it('should handle month boundary correctly', () => {
    // Tuesday, Jan 2, 2024
    const tuesday = new Date(2024, 0, 2)
    const result = getWeekStart(tuesday)

    expect(result.getDay()).toBe(1)
    expect(result.getDate()).toBe(1) // Jan 1, 2024 was a Monday
  })

  it('should handle year boundary correctly', () => {
    // Wednesday, Jan 3, 2024
    const wednesday = new Date(2024, 0, 3)
    const result = getWeekStart(wednesday)

    expect(result.getDay()).toBe(1)
    expect(result.getDate()).toBe(1) // Monday Jan 1
    expect(result.getMonth()).toBe(0) // January
  })
})

describe('formatWeekLabel', () => {
  it('should format week label correctly', () => {
    const date = new Date(2024, 11, 23) // Dec 23
    const result = formatWeekLabel(date)

    expect(result).toBe('Week of Dec 23')
  })

  it('should handle different months', () => {
    const jan = new Date(2024, 0, 1)
    expect(formatWeekLabel(jan)).toBe('Week of Jan 1')

    const jul = new Date(2024, 6, 15)
    expect(formatWeekLabel(jul)).toBe('Week of Jul 15')
  })

  it('should handle single digit days', () => {
    const date = new Date(2024, 0, 8)
    expect(formatWeekLabel(date)).toBe('Week of Jan 8')
  })
})

describe('getPastWeeks', () => {
  beforeEach(() => {
    // Mock date to Wed Dec 25, 2024
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 11, 25))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return correct number of weeks', () => {
    const weeks = getPastWeeks(4)
    expect(weeks).toHaveLength(4)
  })

  it('should return weeks in reverse chronological order (most recent first)', () => {
    const weeks = getPastWeeks(3)

    // Most recent week first (current week: Dec 23)
    expect(weeks[0].getDate()).toBe(23)
    expect(weeks[0].getMonth()).toBe(11)

    // One week ago (Dec 16)
    expect(weeks[1].getDate()).toBe(16)
    expect(weeks[1].getMonth()).toBe(11)

    // Two weeks ago (Dec 9)
    expect(weeks[2].getDate()).toBe(9)
    expect(weeks[2].getMonth()).toBe(11)
  })

  it('should return empty array for count of 0', () => {
    const weeks = getPastWeeks(0)
    expect(weeks).toHaveLength(0)
  })

  it('should handle crossing month boundaries', () => {
    vi.setSystemTime(new Date(2024, 0, 10)) // Jan 10, 2024

    const weeks = getPastWeeks(3)

    // Current week: Jan 8 (Monday)
    expect(weeks[0].getMonth()).toBe(0)
    expect(weeks[0].getDate()).toBe(8)

    // One week ago: Jan 1
    expect(weeks[1].getMonth()).toBe(0)
    expect(weeks[1].getDate()).toBe(1)

    // Two weeks ago: Dec 25, 2023
    expect(weeks[2].getMonth()).toBe(11)
    expect(weeks[2].getFullYear()).toBe(2023)
  })
})

describe('CATEGORIES', () => {
  it('should have all required categories', () => {
    expect(CATEGORIES).toHaveProperty('credit_theft')
    expect(CATEGORIES).toHaveProperty('thrown_under_bus')
    expect(CATEGORIES).toHaveProperty('ghosted')
    expect(CATEGORIES).toHaveProperty('general_clowning')
  })

  it('should have label, color, and emoji for each category', () => {
    Object.values(CATEGORIES).forEach(category => {
      expect(category).toHaveProperty('label')
      expect(category).toHaveProperty('color')
      expect(category).toHaveProperty('emoji')
      expect(typeof category.label).toBe('string')
      expect(typeof category.color).toBe('string')
      expect(typeof category.emoji).toBe('string')
    })
  })
})

describe('WIN_CATEGORIES', () => {
  it('should have all required categories', () => {
    expect(WIN_CATEGORIES).toHaveProperty('clutch_moment')
    expect(WIN_CATEGORIES).toHaveProperty('had_your_back')
    expect(WIN_CATEGORIES).toHaveProperty('real_talk')
    expect(WIN_CATEGORIES).toHaveProperty('goat_behavior')
  })

  it('should have label, color, and emoji for each category', () => {
    Object.values(WIN_CATEGORIES).forEach(category => {
      expect(category).toHaveProperty('label')
      expect(category).toHaveProperty('color')
      expect(category).toHaveProperty('emoji')
      expect(typeof category.label).toBe('string')
      expect(typeof category.color).toBe('string')
      expect(typeof category.emoji).toBe('string')
    })
  })
})
