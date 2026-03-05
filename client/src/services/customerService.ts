import type { Customer } from '../types/Customer'

const API_BASE = '/api/customers'

export async function getCustomers(): Promise<Customer[]> {
  const response = await fetch(API_BASE)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

export async function createCustomer(
  customer: Omit<Customer, 'id' | 'createdAt'>
): Promise<Customer> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}
