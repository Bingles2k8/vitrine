import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

// Scrypt-based passcode hashing. We store the 32-byte derived key and the
// 16-byte salt separately, both hex-encoded. Scrypt is built into Node so
// we avoid pulling in bcrypt (native binary) for a single use-case.

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>

const KEY_LEN = 32

export async function hashPasscode(passcode: string): Promise<{ hash: string; salt: string }> {
  const saltBuf = randomBytes(16)
  const keyBuf = await scryptAsync(passcode, saltBuf, KEY_LEN)
  return { hash: keyBuf.toString('hex'), salt: saltBuf.toString('hex') }
}

export async function verifyPasscode(passcode: string, hashHex: string, saltHex: string): Promise<boolean> {
  try {
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    if (expected.length !== KEY_LEN) return false
    const actual = await scryptAsync(passcode, salt, KEY_LEN)
    return timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}
