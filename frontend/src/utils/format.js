export function fmt(n, digits = 2) {
  if (n === null || n === undefined || n === '') return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function money(n) {
  if (n === null || n === undefined || n === '') return '—';
  return `$${fmt(n, 2)}`;
}

export function statusClass(status) {
  const value = String(status || '').toLowerCase();
  if (['approved', 'available', 'feasible', 'completed', 'healthy'].some((s) => value.includes(s))) return 'bg-status-valid/10 text-status-valid';
  if (['pending', 'in review', 'vendor confirmation', 'limited', 'watch', 'planned'].some((s) => value.includes(s))) return 'bg-status-pending/10 text-status-pending';
  if (['rejected', 'unavailable', 'not feasible', 'critical', 'cancelled'].some((s) => value.includes(s))) return 'bg-status-invalid/10 text-status-invalid';
  if (['low', 'draft'].some((s) => value.includes(s))) return 'bg-status-pending/10 text-status-pending';
  return 'bg-chart-hover text-muted';
}

export function errorMessage(err, fallback = 'Something went wrong') {
  return err?.response?.data?.message || err?.message || fallback;
}

export function downloadCsv(filename, rows) {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadXlsx(filename, rows) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows || []);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, filename);
}
