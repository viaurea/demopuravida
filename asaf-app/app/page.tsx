import { getDrivers } from '@/lib/sheets';
import Dashboard from '@/components/Dashboard';
import type { Driver } from '@/lib/status';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let drivers: Driver[] = [];
  let error: string | null = null;
  try {
    drivers = await getDrivers();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error desconocido al leer el Google Sheet.';
  }
  return <Dashboard initialDrivers={drivers} error={error} />;
}
