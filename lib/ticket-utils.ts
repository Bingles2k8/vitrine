import { randomBytes } from 'crypto'

export function generateTicketCode(): string {
  return 'VIT-' + randomBytes(4).toString('hex').toUpperCase().slice(0, 6)
}
