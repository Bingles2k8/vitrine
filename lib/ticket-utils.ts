import { randomBytes } from 'crypto'

export function generateTicketCode(): string {
  return 'VIT-' + randomBytes(16).toString('hex').toUpperCase()
}
