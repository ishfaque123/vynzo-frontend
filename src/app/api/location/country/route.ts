import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const COUNTRY_NAMES: Record<string, string> = {
  US: 'the United States',
  GB: 'the United Kingdom',
};

export async function GET() {
  const requestHeaders = await headers();
  const code = requestHeaders.get('cf-ipcountry')?.trim().toUpperCase();

  if (!code || code === 'XX' || code === 'T1') {
    return NextResponse.json({ country: 'your country' });
  }

  const country = COUNTRY_NAMES[code] ?? 'your country';

  return NextResponse.json(
    { country },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
