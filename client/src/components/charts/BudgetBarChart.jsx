import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  ResponsiveContainer, Cell,
} from 'recharts';
import { formatCurrency, formatCurrencyCompact } from '../../utils/currency.js';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
      <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function BudgetBarChart({ budgets }) {
  const budgetedOnly = (budgets || []).filter((b) => b.budgetAmount > 0);

  if (budgetedOnly.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-gray-400 dark:text-gray-500 text-sm">No budgets set for this month</p>
      </div>
    );
  }

  const chartData = budgetedOnly.map((b) => ({
    name: b.categoryName,
    Budget: b.budgetAmount,
    Spent: b.spentAmount,
    isOver: b.spentAmount > b.budgetAmount,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#6b7280' }}
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
        <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, color: '#6b7280' }} />
        <Bar dataKey="Budget" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="Spent" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.isOver ? '#ef4444' : '#22c55e'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
