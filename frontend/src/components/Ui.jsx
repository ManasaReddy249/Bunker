import { statusClass } from '../utils/format';

export function Badge({ children, status }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(status || children)}`}>{children}</span>;
}

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-border bg-white p-5 shadow-card ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-base font-semibold text-navy">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ icon: Icon, label, value, tone = 'blue', onClick }) {
  const tones = {
    blue: 'bg-chart-hover text-primary',
    navy: 'bg-primary/10 text-navy',
    green: 'bg-status-valid/10 text-status-valid',
    red: 'bg-status-invalid/10 text-status-invalid',
    orange: 'bg-status-pending/10 text-status-pending'
  };
  const surfaces = {
    blue: 'bg-chart-hover',
    navy: 'bg-primary/5',
    green: 'bg-status-valid/5',
    red: 'bg-status-invalid/5',
    orange: 'bg-status-pending/5'
  };
  const content = (
    <>
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div className="text-2xl font-semibold text-navy">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </>
  );
  const className = `rounded-xl border border-border ${surfaces[tone]} p-4 text-left shadow-card transition duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary' : ''}`;
  return onClick
    ? <button type="button" className={className} onClick={onClick}>{content}</button>
    : <div className={className}>{content}</div>;
}

export function Empty({ title = 'No records yet', text = 'Data will appear here when SQL records exist or demo mode is enabled.' }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-chart-hover p-8 text-center text-muted">
      <div className="font-medium text-text">{title}</div>
      <p className="mt-1 text-sm">{text}</p>
    </div>
  );
}

export function Loading() {
  return <div className="p-8 text-center text-sm text-slate-500">Loading…</div>;
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="mb-4 rounded-lg border border-status-invalid/30 bg-status-invalid/10 px-3 py-2 text-sm text-status-invalid">{message}</div>;
}

export function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-navy">{title}</h3>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
        {children}
        {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, text, onCancel, onConfirm }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={(
        <>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm}>Confirm</button>
        </>
      )}
    >
      <p className="text-sm text-slate-600">{text}</p>
    </Modal>
  );
}
