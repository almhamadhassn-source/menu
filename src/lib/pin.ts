import crypto from 'crypto'

function getPepper(): string {
  const pepper = process.env.STAFF_CODE_PEPPER
  if (!pepper) throw new Error('STAFF_CODE_PEPPER is not set')
  return pepper
}

// HMAC over per-row salting: PINs are short (low entropy either way), and this lets login do a
// direct indexed `where code_hash = $1` lookup instead of scanning every staff row to find a match.
export function hashCode(pin: string): string {
  return crypto.createHmac('sha256', getPepper()).update(pin).digest('hex')
}
