import { google } from 'googleapis';
import { DOC_COLUMNS, type Driver } from './status';

export async function getDrivers(): Promise<Driver[]> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !rawKey || !sheetId) {
    throw new Error(
      'Faltan credenciales de Google Sheets. Configura GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY y GOOGLE_SHEET_ID (ver .env.example).'
    );
  }

  const auth = new google.auth.JWT({
    email,
    key: rawKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'A:Z' });
  const rows = res.data.values || [];
  const [header, ...dataRows] = rows;
  if (!header) return [];

  const colIndex = (name: string) => header.indexOf(name);

  return dataRows
    .filter(row => row[colIndex('Conductor')])
    .map(row => {
      const get = (name: string) => {
        const idx = colIndex(name);
        return idx === -1 ? '' : (row[idx] || '').toString().trim();
      };
      const docs: Record<string, string> = {};
      DOC_COLUMNS.forEach(col => { docs[col] = get(col); });
      return {
        name: get('Conductor'),
        phone: get('Telefono'),
        vehicle: get('Vehiculo'),
        plate: get('Placa'),
        docs,
        notes: get('Notas'),
      };
    });
}
