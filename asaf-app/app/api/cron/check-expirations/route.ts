import { NextResponse } from 'next/server';
import { getDrivers } from '@/lib/sheets';
import { daysUntil } from '@/lib/status';

export const dynamic = 'force-dynamic';

interface UrgentItem {
  driver: string;
  doc: string;
  date: string;
  days: number;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const drivers = await getDrivers();
  const urgent: UrgentItem[] = [];
  drivers.forEach(d => {
    Object.entries(d.docs).forEach(([doc, date]) => {
      if (!date) return;
      const days = daysUntil(date);
      if (days <= 7) urgent.push({ driver: d.name, doc, date, days });
    });
  });
  urgent.sort((a, b) => a.days - b.days);

  if (urgent.length === 0) {
    return NextResponse.json({ sent: false, urgent: 0 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.ALERT_EMAIL_TO;
  let sent = false;

  if (resendKey && to) {
    const lines = urgent
      .map(u => `- ${u.driver} — ${u.doc}: ${u.date} (${u.days < 0 ? `caducó hace ${Math.abs(u.days)} días` : `en ${u.days} días`})`)
      .join('\n');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Asaf Transportation <alerts@resend.dev>',
        to: [to],
        subject: `${urgent.length} documento(s) por vencer — Asaf Transportation`,
        text: `Estos documentos vencen en 7 días o menos (o ya caducaron):\n\n${lines}\n\nRevisa el panel para más detalle.`,
      }),
    });
    sent = res.ok;
  }

  return NextResponse.json({ sent, urgent: urgent.length, items: urgent });
}
