import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatMoney, formatWan } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AnnualRepaymentChartProps {
  schedule: any[];
}

const AnnualRepaymentChart: React.FC<AnnualRepaymentChartProps> = ({ schedule }) => {
  const chartData = useMemo(() => {
    const yData: Record<string, { p: number; i: number }> = {};
    schedule.forEach(r => {
      const y = r.date.split('-')[0];
      if (!yData[y]) yData[y] = { p: 0, i: 0 };
      yData[y].p += r.principal + r.prepaymentAmount;
      yData[y].i += r.interest;
    });

    const labels = Object.keys(yData).map(y => y + '年');
    return {
      labels,
      datasets: [
        {
          label: '偿还本金 (含提前)',
          data: Object.values(yData).map(d => d.p),
          backgroundColor: '#38bdf8',
          stack: 'stack0'
        },
        {
          label: '支付利息',
          data: Object.values(yData).map(d => d.i),
          backgroundColor: '#fb923c',
          stack: 'stack0'
        }
      ]
    };
  }, [schedule]);

  return (
    <div className='glass-card rounded-[40px] p-8'>
      <h3 className='text-xl font-black text-slate-800 mb-8 flex items-center gap-3'>
        <BarChart3 className='w-6 h-6 text-indigo-500' />
        年度还款资产结构
      </h3>
      <div className='h-[400px]'>
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' as const, labels: { usePointStyle: true, boxWidth: 8, font: { weight: 'bold' } } },
              tooltip: {
                backgroundColor: '#fff',
                titleColor: '#1e293b',
                bodyColor: '#475569',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12,
                callbacks: { label: c => `${c.dataset.label}: ${formatMoney(c.parsed.y || 0)}` }
              }
            },
            scales: {
              x: { stacked: true, grid: { display: false }, ticks: { font: { weight: 'bold' } } },
              y: { stacked: true, border: { display: false }, ticks: { font: { weight: 500 }, callback: v => formatWan(Number(v)) } }
            }
          }}
        />
      </div>
    </div>
  );
};

export default AnnualRepaymentChart;
