import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? `set (${process.env.R2_ACCOUNT_ID.length} chars)` : 'MISSING',
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? `set (${process.env.R2_ACCESS_KEY_ID.length} chars)` : 'MISSING',
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? `set (${process.env.R2_SECRET_ACCESS_KEY.length} chars)` : 'MISSING',
    R2_OBJECT_IMAGES_PUBLIC_URL: process.env.R2_OBJECT_IMAGES_PUBLIC_URL ?? 'MISSING',
  })
}
