import { NextResponse } from 'next/server';
import { getDrivers } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const drivers = await getDrivers();
    return NextResponse.json({ drivers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
