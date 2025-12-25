import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../lib/auth'

describe('hashPassword', () => {
  it('should hash a password', async () => {
    const password = 'testPassword123'
    const hash = await hashPassword(password)

    expect(hash).toBeDefined()
    expect(hash).not.toBe(password)
    expect(hash.length).toBeGreaterThan(50) // bcrypt hashes are typically 60 chars
  })

  it('should produce different hashes for same password', async () => {
    const password = 'testPassword123'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)

    expect(hash1).not.toBe(hash2) // Different salts
  })

  it('should handle empty password', async () => {
    const hash = await hashPassword('')
    expect(hash).toBeDefined()
    expect(hash.length).toBeGreaterThan(50)
  })

  it('should handle special characters', async () => {
    const password = 'p@$$w0rd!@#$%^&*()'
    const hash = await hashPassword(password)

    expect(hash).toBeDefined()
    expect(hash).not.toBe(password)
  })

  it('should handle long passwords', async () => {
    const password = 'a'.repeat(100)
    const hash = await hashPassword(password)

    expect(hash).toBeDefined()
  })

  it('should handle unicode characters', async () => {
    const password = '密码测试🔐'
    const hash = await hashPassword(password)

    expect(hash).toBeDefined()
  })
})

describe('verifyPassword', () => {
  it('should verify correct password', async () => {
    const password = 'testPassword123'
    const hash = await hashPassword(password)

    const result = await verifyPassword(password, hash)
    expect(result).toBe(true)
  })

  it('should reject incorrect password', async () => {
    const password = 'testPassword123'
    const hash = await hashPassword(password)

    const result = await verifyPassword('wrongPassword', hash)
    expect(result).toBe(false)
  })

  it('should reject similar but wrong password', async () => {
    const password = 'testPassword123'
    const hash = await hashPassword(password)

    const result = await verifyPassword('testPassword124', hash)
    expect(result).toBe(false)
  })

  it('should be case sensitive', async () => {
    const password = 'TestPassword'
    const hash = await hashPassword(password)

    const result = await verifyPassword('testpassword', hash)
    expect(result).toBe(false)
  })

  it('should handle empty password verification', async () => {
    const password = ''
    const hash = await hashPassword(password)

    const result = await verifyPassword('', hash)
    expect(result).toBe(true)
  })

  it('should handle special characters', async () => {
    const password = 'p@$$w0rd!@#$%^&*()'
    const hash = await hashPassword(password)

    const result = await verifyPassword(password, hash)
    expect(result).toBe(true)
  })

  it('should handle unicode characters', async () => {
    const password = '密码测试🔐'
    const hash = await hashPassword(password)

    const result = await verifyPassword(password, hash)
    expect(result).toBe(true)
  })
})
