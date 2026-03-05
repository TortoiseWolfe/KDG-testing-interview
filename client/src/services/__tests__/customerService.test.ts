import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCustomers, createCustomer } from '../customerService'

describe('customerService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('getCustomers', () => {
    it('returns parsed customer array on success', async () => {
      const mockData = [{ id: 1, name: 'Jane', email: 'jane@test.com', createdAt: '2026-01-01' }]
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response)

      const result = await getCustomers()

      expect(result).toEqual(mockData)
      expect(fetch).toHaveBeenCalledWith('/api/customers')
    })

    it('throws on non-OK response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)

      await expect(getCustomers()).rejects.toThrow('HTTP 500')
    })
  })

  describe('createCustomer', () => {
    it('sends POST with correct body and returns customer', async () => {
      const input = { name: 'Jane', email: 'jane@test.com' }
      const mockResponse = { id: 1, ...input, createdAt: '2026-01-01' }
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await createCustomer(input)

      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
    })

    it('throws on non-OK response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 400,
      } as Response)

      await expect(createCustomer({ name: '', email: '' })).rejects.toThrow('HTTP 400')
    })
  })
})
