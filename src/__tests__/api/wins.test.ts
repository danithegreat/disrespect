import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Create mock functions that we can reference
const mockFindMany = vi.fn()
const mockCreate = vi.fn()

// Mock the database
vi.mock('@/lib/db', () => ({
  getPrisma: vi.fn(() => Promise.resolve({
    win: {
      findMany: mockFindMany,
      create: mockCreate,
    },
  })),
}))

// Mock getSession
const mockGetSession = vi.fn()
vi.mock('@/lib/auth', () => ({
  getSession: () => mockGetSession(),
}))

import { GET, POST } from '@/app/api/wins/route'

function createMockGetRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/wins')
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return new NextRequest(url, { method: 'GET' })
}

function createMockPostRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/wins', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('GET /api/wins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const request = createMockGetRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return wins for authenticated user', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockFindMany.mockResolvedValue([
      { id: '1', category: 'clutch_moment', note: 'Test note', weekStart: new Date() },
    ])

    const request = createMockGetRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.wins).toHaveLength(1)
    expect(data.wins[0].category).toBe('clutch_moment')
  })

  it('should respect weeks parameter', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockFindMany.mockResolvedValue([])

    const request = createMockGetRequest({ weeks: '4' })
    await GET(request)

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
        }),
      })
    )
  })
})

describe('POST /api/wins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const request = createMockPostRequest({ category: 'clutch_moment' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should reject invalid category', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })

    const request = createMockPostRequest({ category: 'invalid_category' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid category')
  })

  it('should reject missing category', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })

    const request = createMockPostRequest({})
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid category')
  })

  it('should accept clutch_moment category', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockCreate.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      category: 'clutch_moment',
      note: null,
      weekStart: new Date(),
      isShared: false,
    })

    const request = createMockPostRequest({ category: 'clutch_moment' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.win.category).toBe('clutch_moment')
  })

  it('should accept had_your_back category', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockCreate.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      category: 'had_your_back',
      note: null,
      weekStart: new Date(),
      isShared: false,
    })

    const request = createMockPostRequest({ category: 'had_your_back' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.win.category).toBe('had_your_back')
  })

  it('should accept real_talk category', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockCreate.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      category: 'real_talk',
      note: null,
      weekStart: new Date(),
      isShared: false,
    })

    const request = createMockPostRequest({ category: 'real_talk' })
    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  it('should accept goat_behavior category', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockCreate.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      category: 'goat_behavior',
      note: null,
      weekStart: new Date(),
      isShared: false,
    })

    const request = createMockPostRequest({ category: 'goat_behavior' })
    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  it('should include note when provided', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockCreate.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      category: 'clutch_moment',
      note: 'Saved the day!',
      weekStart: new Date(),
      isShared: false,
    })

    const request = createMockPostRequest({
      category: 'clutch_moment',
      note: 'Saved the day!'
    })
    await POST(request)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          note: 'Saved the day!',
        }),
      })
    )
  })

  it('should respect isShared flag', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockCreate.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      category: 'clutch_moment',
      note: null,
      weekStart: new Date(),
      isShared: true,
    })

    const request = createMockPostRequest({
      category: 'clutch_moment',
      isShared: true
    })
    await POST(request)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isShared: true,
        }),
      })
    )
  })

  it('should default isShared to false', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockCreate.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      category: 'clutch_moment',
      note: null,
      weekStart: new Date(),
      isShared: false,
    })

    const request = createMockPostRequest({ category: 'clutch_moment' })
    await POST(request)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isShared: false,
        }),
      })
    )
  })
})
