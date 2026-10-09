import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  const requestHeaders = await headers();
  const raw = requestHeaders.get('cf-ipcountry')?.trim().toUpperCase();

  // Always return the 2-letter ISO code (or null) — never a display name or
  // placeholder text. The client maps the code to a display name itself and
  // validates it before use; returning names here used to crash the client's
  // Intl.DisplayNames lookup for US/GB, leaving "your country" stuck.
  const country =
    raw && raw !== 'XX' && raw !== 'T1' && /^[A-Z]{2}$/.test(raw) ? raw : null;

  return NextResponse.json(
    { country },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
