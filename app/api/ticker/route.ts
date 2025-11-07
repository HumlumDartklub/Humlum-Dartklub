// app/api/news/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // undgå cache mens vi bygger

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SHEET_API;
  if (!base) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_SHEET_API mangler i .env.local' },
      { status: 500 }
    );
  }

  const url = `${base}?tab=NYHEDER`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json(
        { error: `GAS fejlede (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // GAS kan returnere {items:[...]} eller {rows:[...]} – vi accepterer begge.
    const raw: any[] =
      Array.isArray(data?.items) ? data.items :
      Array.isArray(data?.rows)  ? data.rows  : [];

    // Kun synlige (visible=YES), hvis feltet findes.
    const filtered = raw.filter((r: any) => {
      if (r?.visible === undefined) return true;
      const v = String(r.visible).trim().toUpperCase();
      return v === 'YES';
    });

    // Normaliseret output til frontend
    const items = filtered
      .map((r: any) => ({
        id:       r?.id ?? '',
        date:     r?.date ?? '',
        title:    r?.title ?? '',
        body_md:  r?.body_md ?? r?.body ?? '',
        image:    r?.image ?? '',
        status:   r?.status ?? '',
        pin:      r?.pin ?? '-',
        order:    Number(r?.order ?? 0),
        start_on: r?.start_on ?? '',
        end_on:   r?.end_on ?? '',
        channel:  r?.channel ?? ''
      }))
      .sort((a, b) => a.order - b.order);

    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Fetch fejl: ${err?.message || String(err)}` },
      { status: 500 }
    );
  }
}
