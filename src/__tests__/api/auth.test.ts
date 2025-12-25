import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Create shared mock functions
const mockUserFindUnique = vi.fn()
const mockUserCreate = vi.fn()
const mockSessionCreate = vi.fn()

// Mock the database with shared mock functions
vi.mock('@/lib/db', () => ({
  getPrisma: vi.fn(() => Promise.resolve({
    user: {
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
    },
    session: {
      create: mockSessionCreate,
    },
    invite: {
      findUnique: vi.fn(),
    },
    friendship: {
      createMany: vi.fn(),
    },
  })),
}))

// Mock auth functions
vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual('@/lib/auth')
  return {
    ...actual,
    createSession: vi.fn(() => Promise.resolve('mock-session-token')),
  }
})

import { POST as register } from '@/app/api/auth/register/route'
import { POST as login } from '@/app/api/auth/login/route'

function createMockRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject registration without email', async () => {
    const request = createMockRequest({
      password: 'password123',
      name: 'Test User',
      username: 'testuser',
    })

    const response = await register(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email, password, name, and username are required')
  })

  it('should reject registration without password', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
    })

    const response = await register(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email, password, name, and username are required')
  })

  it('should reject registration without name', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
    })

    const response = await register(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email, password, name, and username are required')
  })

  it('should reject registration without username', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    })

    const response = await register(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email, password, name, and username are required')
  })

  it('should reject invalid username format (too short)', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      username: 'ab',
    })

    const response = await register(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Username must be 3-20 characters, letters, numbers, and underscores only')
  })

  it('should reject invalid username format (too long)', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      username: 'a'.repeat(21),
    })

    const response = await register(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Username must be 3-20 characters, letters, numbers, and underscores only')
  })

  it('should reject invalid username format (special characters)', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      username: 'test@user',
    })

    const response = await register(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Username must be 3-20 characters, letters, numbers, and underscores only')
  })

  it('should accept valid username with underscores', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    mockUserCreate.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      username: 'test_user_123',
    })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      username: 'test_user_123',
    })

    const response = await register(request)
    expect(response.status).toBe(200)
  })

  it('should reject duplicate email', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: '1', email: 'test@example.com' })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      username: 'testuser',
    })

    const response = await register(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email already registered')
  })

  it('should reject duplicate username', async () => {
    mockUserFindUnique
      .mockResolvedValueOnce(null) // email check
      .mockResolvedValueOnce({ id: '1', username: 'testuser' }) // username check

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      username: 'testuser',
    })

    const response = await register(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Username already taken')
  })

  it('should successfully register a new user', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    mockUserCreate.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
    })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      username: 'testuser',
    })

    const response = await register(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('test@example.com')
    expect(data.user.username).toBe('testuser')
  })

  it('should set session cookie on successful registration', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    mockUserCreate.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
    })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      username: 'testuser',
    })

    const response = await register(request)

    const cookieHeader = response.headers.get('set-cookie')
    expect(cookieHeader).toBeTruthy()
    expect(cookieHeader).toContain('session=')
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject login without email', async () => {
    const request = createMockRequest({
      password: 'password123',
    })

    const response = await login(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email and password are required')
  })

  it('should reject login without password', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
    })

    const response = await login(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email and password are required')
  })

  it('should reject login with non-existent email', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    const request = createMockRequest({
      email: 'nonexistent@example.com',
      password: 'password123',
    })

    const response = await login(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid email or password')
  })
})
