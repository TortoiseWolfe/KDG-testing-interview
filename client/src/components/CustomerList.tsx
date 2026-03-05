import { useEffect, useState } from 'react'
import { getCustomers } from '../services/customerService'
import type { Customer } from '../types/Customer'

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {customers.map((c) => (
          <tr key={c.id}>
            <td>{c.name}</td>
            <td>{c.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
