import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Public build-identity endpoint: lets you verify which build a deployment is
// actually serving. `buildId` changes on every `next build`.
export async function GET() {
  let buildId = 'unknown'
  try {
    buildId = readFileSync(path.join(process.cwd(), '.next', 'BUILD_ID'), 'utf8').trim()
  } catch {
    // BUILD_ID missing (dev or standalone path differs) — report unknown
  }
  return NextResponse.json({
    name: 'creatoros',
    commit: process.env.APP_COMMIT || null,
    buildId,
    builtAt: process.env.APP_BUILT_AT || null,
  })
}
