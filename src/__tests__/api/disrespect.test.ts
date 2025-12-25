import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Create mock functions that we can reference
const mockFindMany = vi.fn()
const mockCreate = vi.fn()

// Mock the database
vi.mock('@/lib/db', () => ({
  getPrisma: vi.fn(() => Promise.resolve({
    disrespect: {
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

import { GET, POST } from '@/app/api/disrespect/route'

function createMockGetRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/disrespect')
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return new NextRequest(url, { method: 'GET' })
}

function createMockPostRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/disrespect', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('GET /api/disrespect', () => {
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

  it('should return disrespects for authenticated user', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockFindMany.mockResolvedValue([
      { id: '1', category: 'credit_theft', note: 'Test note', weekStart: new Date() },
    ])

    const request = createMockGetRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.disrespects).toHaveLength(1)
    expect(data.disrespects[0].category).toBe('credit_theft')
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

describe('POST /api/disrespect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const request = createMockPostRequest({ category: 'credit_theft' })
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

  it('should accept credit_theft category', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockCreate.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      category: 'credit_theft',
      note: null,
      weekStart: new Date(),
      isShared: false,
    })

    const request = createMockPostRequest({ category: 'credit_theft' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.disrespect.category).toBe('credit_theft')
  })

  it('should accept thrown_under_bus category', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockCreate.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      category: 'thrown_under_bus',
      note: null,
      weekStart: new Date(),
      isShared: false,
    })

    const request = createMockPostRequest({ category: 'thrown_under_bus' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.disrespect.category).toBe('thrown_under_bus')
  })

  it('should accept ghosted category', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockCreate.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      category: 'ghosted',
      note: null,
      weekStart: new Date(),
      isShared: false,
    })

    const request = createMockPostRequest({ category: 'ghosted' })
    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  it('should accept general_clowning category', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockCreate.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      category: 'general_clowning',
      note: null,
      weekStart: new Date(),
      isShared: false,
    })

    const request = createMockPostRequest({ category: 'general_clowning' })
    const response = await POST(request)

    expect(response.status).toBe(200)
  })

  it('should include note when provided', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockCreate.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      category: 'credit_theft',
      note: 'Someone stole my idea',
      weekStart: new Date(),
      isShared: false,
    })

    const request = createMockPostRequest({
      category: 'credit_theft',
      note: 'Someone stole my idea'
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          note: 'Someone stole my idea',
        }),
      })
    )
  })

  it('should respect isShared flag', async () => {
    mockGetSession.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockCreate.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      category: 'credit_theft',
      note: null,
      weekStart: new Date(),
      isShared: true,
    })

    const request = createMockPostRequest({
      category: 'credit_theft',
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
      category: 'credit_theft',
      note: null,
      weekStart: new Date(),
      isShared: false,
    })

    const request = createMockPostRequest({ category: 'credit_theft' })
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
