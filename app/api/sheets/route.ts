// app/api/sheets/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_SHEET_API;
  if (!base) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_SHEET_API mangler i .env.local' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  // HP bruger både ?sheet= og ?tab= – vi accepterer begge
  const sheetParam = (searchParams.get('sheet') || searchParams.get('tab') || '').trim();
  if (!sheetParam) {
    return NextResponse.json({ error: 'Missing ?sheet or ?tab' }, { status: 400 });
  }

  const tab = sheetParam.toUpperCase();
  const url = `${base}?tab=${encodeURIComponent(tab)}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: `GAS fejlede (${res.status})` }, { status: res.status });
    }

    // Returnér både originalt GAS-svar og en pæn, normaliseret liste
    const data = await res.json();

    const raw: any[] =
      Array.isArray((data as any)?.rows) ? (data as any).rows :
      Array.isArray((data as any)?.items) ? (data as any).items : [];

    const itemsNormalized = raw
      .filter((r: any) => r?.visible === undefined || String(r.visible).trim().toUpperCase() === 'YES')
      .map((r: any) => ({
        id: r?.id ?? '',
        title: r?.title ?? '',
        body: r?.body ?? r?.body_md ?? '',
        image: r?.image ?? '',
        status: r?.status ?? '',
        link: r?.link ?? '',
        pin: r?.pin ?? '-',
        date: r?.date ?? '',
        order: Number(r?.order ?? 0),
        start_on: r?.start_on ?? '',
        end_on: r?.end_on ?? '',
        channel: r?.channel ?? '',
      }))
      .sort((a, b) => a.order - b.order);

    return NextResponse.json({ ok: true, tab, ...data, itemsNormalized });
  } catch (err: any) {
    return NextResponse.json({ error: `Fetch fejl: ${err?.message || String(err)}` }, { status: 500 });
  }
}
