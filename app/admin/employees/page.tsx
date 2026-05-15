'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { getSiteName, getSiteUrl } from '@/lib/seo';
import {
  AdminPageHeader, adminPanel, adminStack, adminInput, adminLabel,
  adminTableHead, btnPrimary, btnSecondary,
} from '@/components/admin/ui';
import type { Employee, SalaryComponent, SalaryRecord, ApiError } from '@/types/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const now = new Date();

const EMPTY_FORM = { name: '', role: '', phone: '', email: '', joiningDate: '', monthlySalary: '', status: 'active' as 'active' | 'inactive' };
const EMPTY_PAY  = { month: String(now.getMonth() + 1), year: String(now.getFullYear()), amount: '', paymentMode: 'Bank Transfer', totalDays: '30', presentDays: '30', note: '' };
const PAYMENT_MODES = ['Bank Transfer', 'Cash', 'UPI', 'Cheque', 'NEFT', 'RTGS', 'IMPS'];

const PRESET_ALLOWANCES = ['Basic Pay', 'HRA', 'DA', 'Travel Allowance', 'Medical Allowance', 'Special Allowance', 'Bonus', 'Overtime'];
const PRESET_DEDUCTIONS = ['PF (Employee)', 'Professional Tax', 'TDS', 'Advance Recovery', 'Loan Recovery'];

type Modal = 'none' | 'form' | 'pay' | 'history';

function statusBadge(s: Employee['status']) {
  return s === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500';
}

function printSlip(emp: Employee, record: SalaryRecord, siteName: string, siteUrl: string) {
  const month = MONTHS[record.month - 1];
  const fmt = (n: number) => `&#8377;${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const generatedOn = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const paidOn      = new Date(record.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const joinedOn    = emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  // Use stored components, fall back to single "Basic Pay = monthlySalary" row
  const allowances: SalaryComponent[] = (emp.allowances && emp.allowances.length > 0)
    ? emp.allowances
    : [{ name: 'Basic Pay', amount: emp.monthlySalary }];
  const deductions: SalaryComponent[] = emp.deductions || [];

  const grossEarnings = allowances.reduce((s, c) => s + c.amount, 0);
  const totalDeductions = deductions.reduce((s, c) => s + c.amount, 0);
  const netPay = record.amount; // admin-confirmed net amount

  const allowanceRows = allowances.map(c =>
    `<tr><td>${c.name}</td><td class="amount">${fmt(c.amount)}</td></tr>`
  ).join('');

  const deductionRows = deductions.length > 0
    ? deductions.map(c => `<tr><td>${c.name}</td><td class="amount deduct">${fmt(c.amount)}</td></tr>`).join('')
    : `<tr><td style="color:#9ca3af;font-style:italic">No deductions</td><td class="amount" style="color:#9ca3af">${fmt(0)}</td></tr>`;

  const noteRow = record.note
    ? `<div style="margin:16px 0;padding:10px 14px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 6px 6px 0;font-size:12px;color:#92400e"><strong>Note:</strong> ${record.note}</div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>Salary Slip &mdash; ${emp.name} &mdash; ${month} ${record.year}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#e5e7eb;color:#111827;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:13px}
  .page{max-width:760px;margin:28px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.12)}

  /* Header */
  .header{background:linear-gradient(135deg,#312e81 0%,#4338ca 50%,#6d28d9 100%);padding:26px 36px;display:flex;justify-content:space-between;align-items:center}
  .brand-name{font-size:26px;font-weight:800;color:#fff;letter-spacing:-.5px}
  .brand-sub{font-size:10px;color:rgba(255,255,255,.55);margin-top:4px;text-transform:uppercase;letter-spacing:.18em}
  .slip-tag{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:10px 20px;text-align:right}
  .slip-tag-title{font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:rgba(255,255,255,.55)}
  .slip-tag-period{font-size:20px;font-weight:700;color:#fff;margin-top:2px}

  /* Employee band */
  .empband{background:#eef2ff;border-bottom:2px solid #c7d2fe;padding:16px 36px;display:flex;gap:0}
  .emp-col{flex:1;padding-right:20px}
  .emp-col:last-child{padding-right:0}
  .emp-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:3px}
  .emp-val{font-size:14px;font-weight:700;color:#1e1b4b}

  /* Info cards */
  .cards{display:flex;gap:10px;padding:16px 36px;background:#f9fafb;border-bottom:1px solid #e5e7eb;flex-wrap:wrap}
  .card{flex:1;background:#fff;border:1px solid #e0e7ff;border-radius:8px;padding:10px 14px}
  .card-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:3px}
  .card-val{font-size:12px;font-weight:600;color:#1e1b4b}

  /* Body */
  .body{padding:24px 36px}
  .cols{display:flex;gap:24px}
  .col{flex:1}

  /* Section */
  .sec-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:#6366f1;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e0e7ff;display:flex;justify-content:space-between;align-items:center}
  .sec-title span{font-weight:600;color:#1e1b4b;font-size:12px;letter-spacing:0;text-transform:none}

  /* Tables */
  table{width:100%;border-collapse:collapse;margin-bottom:4px}
  tbody tr{border-bottom:1px solid #f3f4f6}
  tbody tr:last-child{border-bottom:none}
  tbody td{padding:8px 10px;color:#374151}
  .amount{text-align:right;font-weight:600;font-variant-numeric:tabular-nums;color:#1e1b4b}
  .deduct{color:#dc2626}
  .subtotal-row td{background:#f5f3ff;font-weight:700;color:#4338ca;border-top:2px solid #ddd6fe;padding:9px 10px}
  .subtotal-row .amount{color:#4338ca}

  /* Net pay */
  .netpay{background:linear-gradient(135deg,#312e81 0%,#4338ca 60%,#6d28d9 100%);border-radius:10px;padding:20px 28px;display:flex;justify-content:space-between;align-items:center;margin-top:20px}
  .np-left{color:rgba(255,255,255,.75);font-size:12px;line-height:1.8}
  .np-left strong{color:#fff;font-size:14px}
  .np-amount{text-align:right}
  .np-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:rgba(255,255,255,.55);margin-bottom:4px}
  .np-val{font-size:32px;font-weight:800;color:#fff;letter-spacing:-1px}

  /* Footer */
  .footer{background:#f9fafb;border-top:1px solid #e5e7eb;padding:12px 36px;display:flex;justify-content:space-between;align-items:center;margin-top:28px}
  .footer-txt{font-size:11px;color:#9ca3af;line-height:1.6}
  .badge{display:inline-block;border:1px solid #d1d5db;border-radius:4px;padding:1px 7px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af}

  @media print{
    body{background:#fff}
    .page{box-shadow:none;margin:0;border-radius:0;max-width:100%}
  }
</style>
</head><body>
<div class="page">

  <div class="header">
    <div>
      <div class="brand-name">${siteName}</div>
      <div class="brand-sub">Payroll &amp; HR Department</div>
    </div>
    <div class="slip-tag">
      <div class="slip-tag-title">Salary Slip</div>
      <div class="slip-tag-period">${month} ${record.year}</div>
    </div>
  </div>

  <div class="empband">
    <div class="emp-col"><div class="emp-lbl">Employee Name</div><div class="emp-val">${emp.name}</div></div>
    <div class="emp-col"><div class="emp-lbl">Designation</div><div class="emp-val">${emp.role}</div></div>
    ${emp.email ? `<div class="emp-col"><div class="emp-lbl">Email</div><div class="emp-val" style="font-size:13px">${emp.email}</div></div>` : ''}
    ${emp.phone ? `<div class="emp-col"><div class="emp-lbl">Phone</div><div class="emp-val" style="font-size:13px">${emp.phone}</div></div>` : ''}
  </div>

  <div class="cards">
    <div class="card"><div class="card-lbl">Pay Period</div><div class="card-val">${month} ${record.year}</div></div>
    <div class="card"><div class="card-lbl">Date of Joining</div><div class="card-val">${joinedOn}</div></div>
    <div class="card"><div class="card-lbl">Payment Date</div><div class="card-val">${paidOn}</div></div>
    <div class="card"><div class="card-lbl">Working Days</div><div class="card-val">${record.totalDays ?? '—'}</div></div>
    <div class="card"><div class="card-lbl">Days Present</div><div class="card-val">${record.presentDays ?? '—'}</div></div>
    <div class="card"><div class="card-lbl">Payment Mode</div><div class="card-val">${record.paymentMode || 'Bank Transfer'}</div></div>
  </div>

  <div class="body">
    <div class="cols">

      <div class="col">
        <div class="sec-title">Earnings <span>${fmt(grossEarnings)}</span></div>
        <table><tbody>
          ${allowanceRows}
          <tr class="subtotal-row"><td>Total Earnings</td><td class="amount">${fmt(grossEarnings)}</td></tr>
        </tbody></table>
      </div>

      <div class="col">
        <div class="sec-title">Deductions <span style="color:#dc2626">${fmt(totalDeductions)}</span></div>
        <table><tbody>
          ${deductionRows}
          <tr class="subtotal-row" style="--c:#fef2f2"><td style="color:#dc2626">Total Deductions</td><td class="amount deduct">${fmt(totalDeductions)}</td></tr>
        </tbody></table>
      </div>

    </div>

    ${noteRow}

    <div class="netpay">
      <div class="np-left">
        Gross Earnings &nbsp;&mdash;&nbsp; Total Deductions<br/>
        <strong>${fmt(grossEarnings)} &nbsp;&minus;&nbsp; ${fmt(totalDeductions)}</strong>
      </div>
      <div class="np-amount">
        <div class="np-lbl">Net Pay</div>
        <div class="np-val">${fmt(netPay)}</div>
      </div>
    </div>

  </div>

  <div class="footer">
    <div class="footer-txt">Generated on ${generatedOn} &nbsp;&bull;&nbsp; <span class="badge">Confidential</span><br/><a href="${siteUrl}" style="color:#6366f1;text-decoration:none;font-size:11px">${siteUrl}</a></div>
    <div class="footer-txt" style="text-align:right">This is a system-generated document.<br/>No physical signature required.</div>
  </div>

</div>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

// ─── Component row editor ────────────────────────────────────────────────────
function ComponentEditor({
  label, items, presets, onChange,
}: { label: string; items: SalaryComponent[]; presets: string[]; onChange: (v: SalaryComponent[]) => void }) {
  const add = (name = '') => onChange([...items, { name, amount: 0 }]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof SalaryComponent, val: string) =>
    onChange(items.map((c, idx) => idx === i ? { ...c, [field]: field === 'amount' ? Number(val) || 0 : val } : c));

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-indigo-950/70">{label}</p>
      <div className="space-y-2">
        {items.map((c, i) => (
          <div key={i} className="flex gap-2">
            <input className={`${adminInput} flex-1`} placeholder="Component name" value={c.name} onChange={e => update(i, 'name', e.target.value)} />
            <input className={`${adminInput} w-32`} type="number" placeholder="Amount" value={c.amount || ''} onChange={e => update(i, 'amount', e.target.value)} />
            <button type="button" onClick={() => remove(i)} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-bold text-rose-500 hover:bg-rose-100 transition">✕</button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {presets.map(p => (
          <button key={p} type="button" onClick={() => add(p)}
            className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700 hover:bg-indigo-100 transition">
            + {p}
          </button>
        ))}
        <button type="button" onClick={() => add()}
          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 transition">
          + Custom
        </button>
      </div>
      {items.length > 0 && (
        <p className="mt-1.5 text-right text-xs font-semibold text-indigo-700">
          Total: {formatPrice(items.reduce((s, c) => s + (c.amount || 0), 0))}
        </p>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [modal, setModal]         = useState<Modal>('none');
  const [selected, setSelected]   = useState<Employee | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [allowances, setAllowances] = useState<SalaryComponent[]>([]);
  const [deductions, setDeductions] = useState<SalaryComponent[]>([]);
  const [payForm, setPayForm]     = useState(EMPTY_PAY);
  const siteName = getSiteName();
  const siteUrl = getSiteUrl();

  const totalMonthlySalary = employees.filter(e => e.status === 'active').reduce((s, e) => s + e.monthlySalary, 0);

  useEffect(() => {
    api.get('/employees')
      .then(({ data }) => setEmployees(data.employees))
      .catch((err: unknown) => toast.error((err as ApiError).response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setForm(EMPTY_FORM); setAllowances([]); setDeductions([]); setSelected(null); setModal('form');
  };
  const openEdit = (e: Employee) => {
    setForm({ name: e.name, role: e.role, phone: e.phone || '', email: e.email || '',
      joiningDate: e.joiningDate ? e.joiningDate.slice(0, 10) : '',
      monthlySalary: String(e.monthlySalary), status: e.status });
    setAllowances(e.allowances || []);
    setDeductions(e.deductions || []);
    setSelected(e); setModal('form');
  };
  const openPay = (e: Employee) => {
    setSelected(e);
    const netPay = (e.allowances?.reduce((s, c) => s + c.amount, 0) || e.monthlySalary) -
                   (e.deductions?.reduce((s, c) => s + c.amount, 0) || 0);
    setPayForm({ ...EMPTY_PAY, amount: String(netPay || e.monthlySalary) });
    setModal('pay');
  };
  const openHistory = (e: Employee) => { setSelected(e); setModal('history'); };
  const closeModal = () => { setModal('none'); setSelected(null); };

  const handleSaveEmployee = async () => {
    if (!form.name.trim() || !form.role.trim() || !form.monthlySalary) {
      toast.error('Name, role, and salary are required'); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, monthlySalary: Number(form.monthlySalary), allowances, deductions };
      if (selected) {
        const { data } = await api.put(`/employees/${selected._id}`, payload);
        setEmployees(prev => prev.map(e => e._id === selected._id ? data.employee : e));
        toast.success('Employee updated');
      } else {
        const { data } = await api.post('/employees', payload);
        setEmployees(prev => [data.employee, ...prev]);
        toast.success('Employee added');
      }
      closeModal();
    } catch (err: unknown) {
      toast.error((err as ApiError).response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handlePaySalary = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = { month: Number(payForm.month), year: Number(payForm.year), amount: Number(payForm.amount) || selected.monthlySalary, paymentMode: payForm.paymentMode, totalDays: Number(payForm.totalDays) || undefined, presentDays: Number(payForm.presentDays) || undefined, note: payForm.note };
      const { data } = await api.post(`/employees/${selected._id}/salary`, payload);
      setEmployees(prev => prev.map(e => e._id === selected._id ? data.employee : e));
      toast.success('Salary recorded');
      closeModal();
    } catch (err: unknown) {
      toast.error((err as ApiError).response?.data?.message || 'Failed to record salary');
    } finally { setSaving(false); }
  };

  const handleDeleteSalary = async (recordId: string) => {
    if (!selected || !confirm('Delete this salary record?')) return;
    try {
      const { data } = await api.delete(`/employees/${selected._id}/salary/${recordId}`);
      const updated = data.employee;
      setEmployees(prev => prev.map(e => e._id === selected._id ? updated : e));
      setSelected(updated);
    } catch (err: unknown) {
      toast.error((err as ApiError).response?.data?.message || 'Delete failed');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Delete this employee and all salary records?')) return;
    try {
      await api.delete(`/employees/${id}`);
      setEmployees(prev => prev.filter(e => e._id !== id));
      toast.success('Employee deleted');
    } catch (err: unknown) {
      toast.error((err as ApiError).response?.data?.message || 'Delete failed');
    }
  };

  const paidThisMonth = (emp: Employee) =>
    emp.salaryRecords.find(r => r.month === now.getMonth() + 1 && r.year === now.getFullYear());

  return (
    <div className={adminStack}>
      <AdminPageHeader
        title="Employees"
        description="Manage your team, salary components, and generate professional salary slips."
        actions={<button onClick={openAdd} className={`${btnPrimary} px-4 py-2 text-sm`}>+ Add employee</button>}
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total employees', value: employees.length },
          { label: 'Active', value: employees.filter(e => e.status === 'active').length },
          { label: 'Monthly payroll', value: formatPrice(totalMonthlySalary) },
          { label: 'Paid this month', value: employees.filter(e => paidThisMonth(e)).length },
        ].map(s => (
          <div key={s.label} className={`${adminPanel} p-4`}>
            <p className="text-lg font-semibold text-indigo-950">{s.value}</p>
            <p className="text-xs text-indigo-950/50 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add / Edit */}
      {modal === 'form' && (
        <div className={`${adminPanel} p-6`}>
          <h2 className="mb-4 text-sm font-semibold text-indigo-950">{selected ? 'Edit employee' : 'New employee'}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {[
              { key: 'name', label: 'Full name', placeholder: 'e.g. Priya Sharma' },
              { key: 'role', label: 'Role / Designation', placeholder: 'e.g. Packing Staff' },
              { key: 'phone', label: 'Phone', placeholder: '9876543210' },
              { key: 'email', label: 'Email', placeholder: 'priya@example.com' },
              { key: 'joiningDate', label: 'Joining date', placeholder: '', type: 'date' },
              { key: 'monthlySalary', label: 'Gross salary (₹)', placeholder: '0', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className={adminLabel}>{f.label}</label>
                <input className={adminInput} type={f.type || 'text'} placeholder={f.placeholder}
                  value={(form as Record<string, string>)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className={adminLabel}>Status</label>
              <select className={adminInput} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 mb-6">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <ComponentEditor label="Earnings / Allowances" items={allowances} presets={PRESET_ALLOWANCES} onChange={setAllowances} />
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-4">
              <ComponentEditor label="Deductions" items={deductions} presets={PRESET_DEDUCTIONS} onChange={setDeductions} />
            </div>
          </div>

          {(allowances.length > 0 || deductions.length > 0) && (
            <div className="mb-4 flex items-center justify-end gap-6 rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-sm">
              <span className="text-indigo-950/60">Gross: <strong className="text-indigo-900">{formatPrice(allowances.reduce((s, c) => s + c.amount, 0))}</strong></span>
              <span className="text-rose-600/70">Deductions: <strong className="text-rose-600">{formatPrice(deductions.reduce((s, c) => s + c.amount, 0))}</strong></span>
              <span className="text-emerald-700">Net Pay: <strong>{formatPrice(allowances.reduce((s, c) => s + c.amount, 0) - deductions.reduce((s, c) => s + c.amount, 0))}</strong></span>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleSaveEmployee} disabled={saving} className={`${btnPrimary} px-4 py-2 text-sm disabled:opacity-60`}>
              {saving ? 'Saving…' : selected ? 'Update' : 'Add employee'}
            </button>
            <button onClick={closeModal} className={`${btnSecondary} px-4 py-2 text-sm`}>Cancel</button>
          </div>
        </div>
      )}

      {/* Pay salary */}
      {modal === 'pay' && selected && (
        <div className={`${adminPanel} p-6 max-w-md`}>
          <h2 className="mb-1 text-sm font-semibold text-indigo-950">Record salary — {selected.name}</h2>
          <p className="mb-4 text-xs text-indigo-950/50">Gross {formatPrice(selected.monthlySalary)} / month</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={adminLabel}>Month</label>
              <select className={adminInput} value={payForm.month} onChange={e => setPayForm(p => ({ ...p, month: e.target.value }))}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={adminLabel}>Year</label>
              <input className={adminInput} type="number" value={payForm.year} onChange={e => setPayForm(p => ({ ...p, year: e.target.value }))} />
            </div>
            <div>
              <label className={adminLabel}>Net amount paid (₹)</label>
              <input className={adminInput} type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div>
              <label className={adminLabel}>Payment mode</label>
              <select className={adminInput} value={payForm.paymentMode} onChange={e => setPayForm(p => ({ ...p, paymentMode: e.target.value }))}>
                {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={adminLabel}>Total working days</label>
              <input className={adminInput} type="number" min="1" max="31" value={payForm.totalDays} onChange={e => setPayForm(p => ({ ...p, totalDays: e.target.value }))} />
            </div>
            <div>
              <label className={adminLabel}>Days present</label>
              <input className={adminInput} type="number" min="0" max="31" value={payForm.presentDays} onChange={e => setPayForm(p => ({ ...p, presentDays: e.target.value }))} />
            </div>
            <div>
              <label className={adminLabel}>Note (optional)</label>
              <input className={adminInput} placeholder="Bonus, advance…" value={payForm.note} onChange={e => setPayForm(p => ({ ...p, note: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handlePaySalary} disabled={saving} className={`${btnPrimary} px-4 py-2 text-sm disabled:opacity-60`}>
              {saving ? 'Recording…' : 'Record payment'}
            </button>
            <button onClick={closeModal} className={`${btnSecondary} px-4 py-2 text-sm`}>Cancel</button>
          </div>
        </div>
      )}

      {/* Salary history */}
      {modal === 'history' && selected && (
        <div className={`${adminPanel} p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-indigo-950">Salary history — {selected.name}</h2>
              <p className="text-xs text-indigo-950/50">Total paid: {formatPrice(selected.salaryRecords.reduce((s, r) => s + r.amount, 0))}</p>
            </div>
            <button onClick={closeModal} className={`${btnSecondary} px-3 py-1.5 text-xs`}>Close</button>
          </div>
          {selected.salaryRecords.length === 0 ? (
            <p className="py-8 text-center text-sm text-indigo-950/40">No salary records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className={adminTableHead}>
                  <th className="px-4 py-3 text-left">Period</th>
                  <th className="px-4 py-3 text-left">Net paid</th>
                  <th className="px-4 py-3 text-left">Paid on</th>
                  <th className="px-4 py-3 text-left">Note</th>
                  <th className="px-4 py-3" />
                </tr></thead>
                <tbody className="divide-y divide-indigo-100/60">
                  {[...selected.salaryRecords].sort((a, b) => b.year - a.year || b.month - a.month).map(r => (
                    <tr key={r._id} className="hover:bg-indigo-50/40 transition">
                      <td className="px-4 py-3 font-medium">{MONTHS_SHORT[r.month - 1]} {r.year}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-emerald-700">{formatPrice(r.amount)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(r.paidAt)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{r.note || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => printSlip(selected, r, siteName, siteUrl)}
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition">
                            Salary slip
                          </button>
                          <button onClick={() => handleDeleteSalary(r._id)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 transition">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Employee table */}
      <div className={adminPanel}>
        <div className="border-b border-indigo-100/80 px-5 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-indigo-950">All employees</h2>
        </div>
        {loading ? (
          <div className="py-14 text-center text-sm text-indigo-950/40">Loading…</div>
        ) : employees.length === 0 ? (
          <div className="py-14 text-center text-sm text-indigo-950/40">No employees yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={adminTableHead}>
                  <th className="px-5 py-3 text-left sm:px-6">Name</th>
                  <th className="px-5 py-3 text-left sm:px-6">Role</th>
                  <th className="px-5 py-3 text-left sm:px-6">Gross / Net</th>
                  <th className="px-5 py-3 text-left sm:px-6">This month</th>
                  <th className="px-5 py-3 text-left sm:px-6">Status</th>
                  <th className="px-5 py-3 sm:px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100/60">
                {employees.map(emp => {
                  const paid = paidThisMonth(emp);
                  const gross = emp.allowances?.reduce((s, c) => s + c.amount, 0) || emp.monthlySalary;
                  const ded   = emp.deductions?.reduce((s, c) => s + c.amount, 0) || 0;
                  const net   = gross - ded;
                  return (
                    <tr key={emp._id} className="transition hover:bg-indigo-50/50">
                      <td className="px-5 py-3.5 sm:px-6">
                        <p className="font-medium text-slate-800">{emp.name}</p>
                        {emp.email && <p className="text-[11px] text-slate-400">{emp.email}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 sm:px-6">{emp.role}</td>
                      <td className="px-5 py-3.5 sm:px-6">
                        <p className="font-semibold tabular-nums text-slate-800">{formatPrice(gross)}</p>
                        {ded > 0 && <p className="text-[11px] text-emerald-600">Net {formatPrice(net)}</p>}
                      </td>
                      <td className="px-5 py-3.5 sm:px-6">
                        {paid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" /> Paid {formatPrice(paid.amount)}
                          </span>
                        ) : emp.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" /> Pending
                          </span>
                        ) : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 sm:px-6">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(emp.status)}`}>{emp.status}</span>
                      </td>
                      <td className="px-5 py-3.5 sm:px-6">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button onClick={() => openPay(emp)} className={`${btnPrimary} px-2.5 py-1 text-xs`}>Pay salary</button>
                          <button onClick={() => openHistory(emp)} className={`${btnSecondary} px-2.5 py-1 text-xs`}>History</button>
                          <button onClick={() => openEdit(emp)} className={`${btnSecondary} px-2.5 py-1 text-xs`}>Edit</button>
                          <button onClick={() => handleDeleteEmployee(emp._id)} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 transition">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
