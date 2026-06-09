import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatCurrencyCompact } from '../../utils/currency.js';

/** Generate last N months as YYYY-MM strings, oldest first */
function getLastNMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

function shortMonth(yyyyMm) {
  const [y, m] = yyyyMm.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-IN', { month: 'short' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-900 dark:text-white text-sm">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export default function MonthlyTrendChart({ data }) {
  const last6 = getLastNMonths(6);
  const dataMap = Object.fromEntries((data || []).map((d) => [d.month, d.total_paise]));
  const chartData = last6.map((month) => ({
    label: shortMonth(month),
    total_paise: dataMap[month] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCurrencyCompact(v)}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
        <Bar dataKey="total_paise" fill="#2563eb" radius={[4, 4, 0, 0]} name="Total" maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
