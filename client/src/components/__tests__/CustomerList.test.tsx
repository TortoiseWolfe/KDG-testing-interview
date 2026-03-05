import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomerList } from '../CustomerList'

describe('CustomerList', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {})
    )
    render(<CustomerList />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders customers after fetch', async () => {
    const mockCustomers = [
      { id: 1, name: 'Jane Doe', email: 'jane@example.com', createdAt: '2026-01-01' },
      { id: 2, name: 'John Smith', email: 'john@example.com', createdAt: '2026-01-02' },
    ]

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCustomers),
    } as Response)

    render(<CustomerList />)

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('John Smith')).toBeInTheDocument()
    })
  })

  it('renders error message when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network failure'))

    render(<CustomerList />)

    await waitFor(() => {
      expect(screen.getByText('Error: Network failure')).toBeInTheDocument()
    })
  })
})
