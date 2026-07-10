'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  type Driver,
  type DocStatus,
  daysUntil,
  statusOf,
  statusLabel,
  formatDate,
  initials,
  nearestDoc,
} from '@/lib/status';
import {
  TruckIcon, IdCardIcon, MailIcon, SettingsIcon, PhoneIcon, TagIcon,
  ClockIcon, CalendarIcon, SmartphoneIcon, AlertCircleIcon, FolderIcon,
  EditIcon, FileTextIcon, DollarIcon, AlertTriangleIcon, PackageIcon,
  InfoIcon, RefreshIcon,
} from './icons';

type Tab = 'panel' | 'ficha' | 'correos' | 'funciona';
type PanelFilter = 'todos' | DocStatus;
type EmailCat = 'todos' | 'firmar' | 'doc' | 'factura' | 'multa' | 'cliente';

interface EmailItem {
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  cat: Exclude<EmailCat, 'todos'>;
}

const EMAILS: EmailItem[] = [
  { sender: 'H-E-B Distribution', subject: 'Bill of Lading Pending Signature — Load #44521', snippet: 'Attached is the BOL for the 7/8 shipment, we need your signature to close out delivery...', date: 'hoy 09:12', cat: 'firmar' },
  { sender: 'Accounting Dept.', subject: 'July Payroll — Needs Your Signature', snippet: "Attached this month's payroll for review and signature before the 15th...", date: 'hoy 08:40', cat: 'firmar' },
  { sender: 'Progressive Commercial Insurance', subject: 'Fleet Policy Renewal — Sign by 7/31', snippet: 'Your fleet policy renewal is ready, signature required from the policyholder...', date: 'ayer 17:05', cat: 'firmar' },
  { sender: 'Carlos Méndez (driver)', subject: 'Scanned Renewed CDL', snippet: "Hey, here's the scan of my renewed CDL like you asked...", date: 'ayer 12:20', cat: 'doc' },
  { sender: 'Texas DPS Inspection Station', subject: 'Annual DOT Inspection Appointment Confirmed — Plate TX LKM-7788', snippet: 'Confirming your annual DOT inspection appointment for the vehicle with plate...', date: 'ayer 10:02', cat: 'doc' },
  { sender: 'Souto Truck Repair', subject: 'Invoice — Brake Repair, Kenworth T680', snippet: 'Attached invoice for brake repair and general inspection...', date: 'lun 16:44', cat: 'factura' },
  { sender: 'Pilot Flying J Fleet', subject: 'Monthly Fuel Statement — June', snippet: 'Your fleet fuel consumption statement for June is now available...', date: 'lun 09:15', cat: 'factura' },
  { sender: 'FMCSA / Texas DPS', subject: 'Roadside Inspection Violation Notice — Plate TX PQD-5566', snippet: 'A roadside inspection violation has been recorded for the vehicle with plate...', date: 'dom 19:30', cat: 'multa' },
  { sender: 'Walmart Distribution Center', subject: 'New Load Request — Route Houston–Dallas', snippet: 'Requesting transport service for next week, usual route...', date: 'vie 14:12', cat: 'cliente' },
  { sender: 'Home Depot Logistics', subject: 'Pickup Confirmed — Austin Warehouse', snippet: 'Confirming the scheduled pickup for next Monday at the Austin warehouse...', date: 'vie 11:03', cat: 'cliente' },
];

const EMAIL_META: Record<Exclude<EmailCat, 'todos'>, { label: string; icon: (s: { size?: number }) => JSX.Element; bg: string; color: string; tag: string }> = {
  firmar: { label: 'Para firmar', icon: EditIcon, bg: 'var(--red-soft)', color: 'var(--red)', tag: 'tag-firmar' },
  doc: { label: 'Documentación', icon: FileTextIcon, bg: 'var(--accent-soft)', color: 'var(--accent)', tag: 'tag-doc' },
  factura: { label: 'Factura', icon: DollarIcon, bg: 'var(--yellow-soft)', color: 'var(--yellow)', tag: 'tag-factura' },
  multa: { label: 'Multa/Incidencia', icon: AlertTriangleIcon, bg: 'var(--amber-soft)', color: 'var(--amber)', tag: 'tag-multa' },
  cliente: { label: 'Cliente/Pedido', icon: PackageIcon, bg: 'var(--green-soft)', color: 'var(--green)', tag: 'tag-cliente' },
};

function LogoBadge() {
  return (
    <div className="logo-badge">
      <TruckIcon size={20} />
      <div>
        <div className="lb-name">ASAF TRANSPORTATION</div>
        <div className="lb-sub">USDOT #1928374 · MC #698215</div>
      </div>
    </div>
  );
}

function Badge({ status }: { status: DocStatus }) {
  return (
    <span className={`badge ${status}`}>
      <span className="badge-dot" />{statusLabel(status)}
    </span>
  );
}

export default function Dashboard({ initialDrivers, error }: { initialDrivers: Driver[]; error: string | null }) {
  const router = useRouter();
  const [drivers] = useState<Driver[]>(initialDrivers);
  const [tab, setTab] = useState<Tab>('panel');
  const [search, setSearch] = useState('');
  const [panelFilter, setPanelFilter] = useState<PanelFilter>('todos');
  const [emailFilter, setEmailFilter] = useState<EmailCat>('todos');
  const [fichaName, setFichaName] = useState<string | null>(initialDrivers[0]?.name ?? null);
  const [refreshing, setRefreshing] = useState(false);

  const rows = useMemo(() => {
    return drivers
      .map(d => ({ driver: d, nearest: nearestDoc(d) }))
      .filter(r => {
        const q = search.trim().toLowerCase();
        const matchesSearch = !q || r.driver.name.toLowerCase().includes(q) || r.driver.plate.toLowerCase().includes(q);
        const matchesFilter = panelFilter === 'todos' || statusOf(r.nearest.days) === panelFilter;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => a.nearest.days - b.nearest.days);
  }, [drivers, search, panelFilter]);

  const kpis = useMemo(() => {
    let ok = 0, warning = 0, expired = 0;
    drivers.forEach(d => Object.values(d.docs).forEach(date => {
      if (!date) return;
      const s = statusOf(daysUntil(date));
      if (s === 'ok') ok++; else if (s === 'warning') warning++; else expired++;
    }));
    return { ok, warning, expired, total: ok + warning + expired };
  }, [drivers]);

  const fichaDriver = drivers.find(d => d.name === fichaName) ?? drivers[0] ?? null;

  function openFicha(name: string) {
    setFichaName(name);
    setTab('ficha');
  }

  async function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  }

  const filteredEmails = EMAILS.filter(e => emailFilter === 'todos' || e.cat === emailFilter);

  return (
    <>
      <div className="tabs">
        <button className={`tab ${tab === 'panel' ? 'active' : ''}`} onClick={() => setTab('panel')}>
          <TruckIcon />Panel de Conductores
        </button>
        <button className={`tab ${tab === 'ficha' ? 'active' : ''}`} onClick={() => setTab('ficha')}>
          <IdCardIcon />Ficha del Conductor
        </button>
        <button className={`tab ${tab === 'correos' ? 'active' : ''}`} onClick={() => setTab('correos')}>
          <MailIcon />Correos para Firmar
        </button>
        <button className={`tab ${tab === 'funciona' ? 'active' : ''}`} onClick={() => setTab('funciona')}>
          <SettingsIcon />Cómo Funciona
        </button>
      </div>

      {tab === 'panel' && (
        <div className="wrap">
          <div className="page-header">
            <div>
              <h1>Panel de <span>Conductores y Flota</span></h1>
              <p>Asaf Transportation · Datos y documentación siempre al día</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
                <RefreshIcon size={13} />{refreshing ? 'Actualizando…' : 'Actualizar'}
              </button>
              <LogoBadge />
            </div>
          </div>

          {error && (
            <div className="error-box">
              <AlertTriangleIcon />
              <div>
                <strong>No se pudo leer el Google Sheet.</strong> {error}
              </div>
            </div>
          )}

          <div className="kpi-grid">
            <div className="kpi blue"><div className="label">Conductores</div><div className="value">{drivers.length}</div><div className="sub">Flota activa</div></div>
            <div className="kpi green"><div className="label">Documentos al día</div><div className="value">{kpis.ok}</div><div className="sub">de {kpis.total} documentos totales</div></div>
            <div className="kpi yellow"><div className="label">Próximos a caducar</div><div className="value">{kpis.warning}</div><div className="sub">en los próximos 30 días</div></div>
            <div className="kpi red"><div className="label">Caducados</div><div className="value">{kpis.expired}</div><div className="sub">requieren acción inmediata</div></div>
          </div>

          <div className="toolbar">
            <input
              className="search-input"
              type="text"
              placeholder="Buscar por conductor o placa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className={`filter-chip ${panelFilter === 'todos' ? 'active' : ''}`} onClick={() => setPanelFilter('todos')}>Todos</button>
            <button className={`filter-chip ${panelFilter === 'expired' ? 'active' : ''}`} onClick={() => setPanelFilter('expired')}><span className="chip-dot expired" />Caducados</button>
            <button className={`filter-chip ${panelFilter === 'warning' ? 'active' : ''}`} onClick={() => setPanelFilter('warning')}><span className="chip-dot warning" />Próximos a caducar</button>
            <button className={`filter-chip ${panelFilter === 'ok' ? 'active' : ''}`} onClick={() => setPanelFilter('ok')}><span className="chip-dot ok" />Al día</button>
          </div>

          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Conductor</th><th>Vehículo</th><th>Placa</th>
                    <th>Próximo vencimiento</th><th>Documento</th><th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const s = statusOf(r.nearest.days);
                    const dayTxt = r.nearest.days < 0
                      ? `Caducó hace ${Math.abs(r.nearest.days)} días`
                      : `En ${r.nearest.days} días`;
                    return (
                      <tr key={r.driver.name} onClick={() => openFicha(r.driver.name)}>
                        <td>
                          <div className="driver-cell">
                            <div className="avatar">{initials(r.driver.name)}</div>
                            <div>
                              <div className="driver-name">{r.driver.name}</div>
                              <div className="driver-sub">{r.driver.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td>{r.driver.vehicle}</td>
                        <td><span className="plate">{r.driver.plate}</span></td>
                        <td>{formatDate(r.nearest.date)} <span className="driver-sub">· {dayTxt}</span></td>
                        <td>{r.nearest.label}</td>
                        <td><Badge status={s} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && <div className="empty-state">No hay conductores que coincidan con la búsqueda.</div>}
          </div>

          <div className="note-box">
            <InfoIcon />
            <div>Datos leídos en vivo del Google Sheet de la cuenta de viaurea. Para editar un conductor, actualiza el Sheet y pulsa <strong>Actualizar</strong> arriba.</div>
          </div>
        </div>
      )}

      {tab === 'ficha' && (
        <div className="wrap">
          <div className="page-header">
            <div>
              <h1>Ficha del <span>Conductor</span></h1>
              <p>Documentación completa, vehículo asignado y vencimientos</p>
            </div>
            <LogoBadge />
          </div>

          <div className="layout-2col">
            <div className="card">
              <div className="driver-list-mini">
                {drivers.map(d => {
                  const n = nearestDoc(d);
                  const s = statusOf(n.days);
                  return (
                    <div key={d.name} className={`mini-row ${d.name === fichaDriver?.name ? 'active' : ''}`} onClick={() => setFichaName(d.name)}>
                      <div className="mini-avatar">{initials(d.name)}</div>
                      <div><div className="mini-name">{d.name}</div><div className="mini-sub">{d.plate}</div></div>
                      <div className={`status-dot ${s}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="card">
                {fichaDriver && (
                  <>
                    <div className="ficha-top">
                      <div className="ficha-avatar">{initials(fichaDriver.name)}</div>
                      <div>
                        <div className="ficha-name">{fichaDriver.name}</div>
                        <Badge status={statusOf(nearestDoc(fichaDriver).days)} />
                        <div className="ficha-meta">
                          <span><PhoneIcon size={14} /><strong>{fichaDriver.phone}</strong></span>
                          <span><TruckIcon size={14} /><strong>{fichaDriver.vehicle}</strong></span>
                          <span><TagIcon size={14} />Placa <strong>{fichaDriver.plate}</strong></span>
                        </div>
                      </div>
                    </div>
                    <div className="doc-grid">
                      {Object.entries(fichaDriver.docs).map(([label, date]) => {
                        const days = daysUntil(date);
                        const st = statusOf(days);
                        const dayTxt = !date
                          ? 'Sin fecha registrada'
                          : days < 0 ? `Caducado hace ${Math.abs(days)} días` : `Caduca en ${days} días`;
                        return (
                          <div className="doc-item" key={label}>
                            <div className="doc-item-top"><span className="doc-label">{label}</span><Badge status={st} /></div>
                            <div className="doc-date">{formatDate(date)}</div>
                            <div className="doc-days">{dayTxt}</div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {!fichaDriver && <div className="empty-state">No hay conductores cargados en el Sheet todavía.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'correos' && (
        <div className="wrap">
          <div className="page-header">
            <div>
              <h1>Correos <span>Clasificados</span></h1>
              <p>Así se organizaría la bandeja de entrada por categorías automáticas</p>
            </div>
            <LogoBadge />
          </div>

          <div className="email-filters">
            <button className={`filter-chip ${emailFilter === 'todos' ? 'active' : ''}`} onClick={() => setEmailFilter('todos')}>Todos</button>
            {(Object.keys(EMAIL_META) as Exclude<EmailCat, 'todos'>[]).map(cat => {
              const meta = EMAIL_META[cat];
              const IconComp = meta.icon;
              return (
                <button key={cat} className={`filter-chip ${emailFilter === cat ? 'active' : ''}`} onClick={() => setEmailFilter(cat)}>
                  <IconComp size={13} />{meta.label === 'Factura' ? 'Facturas' : meta.label === 'Documentación' ? 'Documentación' : meta.label === 'Multa/Incidencia' ? 'Multas / Incidencias' : meta.label === 'Cliente/Pedido' ? 'Clientes / Pedidos' : meta.label}
                </button>
              );
            })}
          </div>

          <div className="card">
            {filteredEmails.map((e, i) => {
              const meta = EMAIL_META[e.cat];
              const IconComp = meta.icon;
              return (
                <div className="email-item" key={i}>
                  <div className="email-icon" style={{ background: meta.bg, color: meta.color }}><IconComp size={18} /></div>
                  <div className="email-body">
                    <div className="email-top"><span className="email-sender">{e.sender}</span><span className="email-date">{e.date}</span></div>
                    <div className="email-subject">{e.subject}</div>
                    <div className="email-snippet">{e.snippet}</div>
                    <span className={`email-tag ${meta.tag}`}>{meta.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="note-box" style={{ marginTop: 16 }}>
            <InfoIcon />
            <div>Los correos y remitentes son <strong>ejemplos ilustrativos</strong> — todavía no está conectado el Gmail real de la empresa. Es el siguiente paso pendiente de construir.</div>
          </div>
        </div>
      )}

      {tab === 'funciona' && (
        <div className="wrap">
          <div className="page-header">
            <div>
              <h1>Cómo <span>funciona el sistema</span></h1>
              <p>Panel en vivo conectado al Google Sheet de viaurea</p>
            </div>
            <LogoBadge />
          </div>

          <div className="mgmt-card">
            <div className="mgmt-card-header">
              <div className="mgmt-card-icon"><IdCardIcon size={20} /></div>
              <div>
                <div className="mgmt-card-title">Ficha centralizada por conductor</div>
                <div className="mgmt-card-sub">Todo lo necesario en un solo sitio</div>
              </div>
            </div>
            <ul className="mgmt-points">
              <li>Datos personales, <strong>vehículo asignado y placa</strong> siempre visibles</li>
              <li>CDL, certificado médico DOT, revisión MVR, Drug &amp; Alcohol Clearinghouse, registro del vehículo, inspección anual DOT y seguro, <strong>con fecha de caducidad</strong></li>
              <li>Un <strong>semáforo de estado</strong> (verde/amarillo/rojo) para ver de un vistazo qué falta renovar</li>
              <li><strong>Editar un conductor = editar una fila del Google Sheet.</strong> El panel se actualiza al pulsar Actualizar</li>
            </ul>
          </div>

          <div className="mgmt-card">
            <div className="mgmt-card-header">
              <div className="mgmt-card-icon"><ClockIcon size={20} /></div>
              <div>
                <div className="mgmt-card-title">Alertas automáticas de caducidad</div>
                <div className="mgmt-card-sub">Un correo diario si algo se acerca o ya venció</div>
              </div>
            </div>
            <div className="timeline-flow">
              <div className="tf-step">
                <div className="tf-dot"><CalendarIcon size={18} /></div>
                <div className="tf-content">
                  <div className="tf-time">30 días antes</div>
                  <div className="tf-title">Primer aviso visual</div>
                  <div className="tf-desc">El panel marca el documento en <strong>amarillo</strong> automáticamente.</div>
                </div>
              </div>
              <div className="tf-step">
                <div className="tf-dot"><SmartphoneIcon size={18} /></div>
                <div className="tf-content">
                  <div className="tf-time">7 días antes (y cada día después)</div>
                  <div className="tf-title">Email automático</div>
                  <div className="tf-desc">Una tarea programada en Vercel revisa el Sheet cada mañana y manda un correo con la lista de documentos urgentes.</div>
                </div>
              </div>
              <div className="tf-step">
                <div className="tf-dot"><AlertCircleIcon size={18} /></div>
                <div className="tf-content">
                  <div className="tf-time">Día de caducidad</div>
                  <div className="tf-title">Marcado como caducado</div>
                  <div className="tf-desc">Pasa a <strong>rojo</strong> en el panel hasta que se actualice la fecha en el Sheet.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mgmt-card">
            <div className="mgmt-card-header">
              <div className="mgmt-card-icon"><FolderIcon size={20} /></div>
              <div>
                <div className="mgmt-card-title">Falta por construir</div>
                <div className="mgmt-card-sub">Lo que sigue después de este panel</div>
              </div>
            </div>
            <ul className="mgmt-points">
              <li><strong>Registro automático de correos:</strong> conectar el Gmail de viaurea para guardar cada correo relevante junto a la ficha del conductor</li>
              <li><strong>Datos reales:</strong> sustituir la plantilla de ejemplo del Sheet por los conductores reales de la flota</li>
              <li><strong>Desplegar en Vercel:</strong> ver <code>SETUP.md</code> en el repositorio para los pasos exactos</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
