import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/currency.js';

function CustomTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const pct = total > 0 ? ((item.total_paise / total) * 100).toFixed(1) : 0;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-left">
      <p className="font-medium text-gray-900 dark:text-white text-sm">{item.category_name}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(item.total_paise)}</p>
      <p className="text-xs text-gray-400">{pct}%</p>
    </div>
  );
}

export default function CategoryPieChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 dark:text-gray-500 text-sm">No expenses this month</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.total_paise, 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total_paise"
          nameKey="category_name"
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.category_id} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip total={total} />} />
        <Legend
          iconType="circle"
          iconSize={10}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: '#6b7280' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
