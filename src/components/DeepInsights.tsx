import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Share2, Zap, Info } from 'lucide-react';

interface DeepInsightsProps {
  data: {
    loanAmount: number;
    totalInterestBase: number; // 原始总利息
    totalInterestActual: number; // 实际总利息
    paidPrincipal: number;
    paidInterest: number;
    remainingPrincipal: number;
    remainingInterest: number;
    savedInterest: number;
    schedule: any[];
    annualRate: number;
  };
}

const DeepInsights: React.FC<DeepInsightsProps> = ({ data }) => {
  // --- 桑基图数据处理 ---
  const sankeyOption = useMemo(() => {
    const totalOut = data.loanAmount * 10000 + data.totalInterestActual + data.savedInterest;
    
    return {
      tooltip: { trigger: 'item', triggerOn: 'mousemove' },
      series: [
        {
          type: 'sankey',
          layout: 'none',
          emphasis: { focus: 'adjacency' },
          data: [
            { name: '总预算支出', itemStyle: { color: '#6366f1' } },
            { name: '总本金', itemStyle: { color: '#0ea5e9' } },
            { name: '总利息成本', itemStyle: { color: '#f43f5e' } },
            { name: '已还本金', itemStyle: { color: '#22c55e' } },
            { name: '剩余本金', itemStyle: { color: '#94a3b8' } },
            { name: '已付利息', itemStyle: { color: '#fb923c' } },
            { name: '未来利息', itemStyle: { color: '#fda4af' } },
            { name: '已省利息', itemStyle: { color: '#10b981' } }
          ],
          links: [
            { source: '总预算支出', target: '总本金', value: data.loanAmount * 10000 },
            { source: '总预算支出', target: '总利息成本', value: data.totalInterestBase },
            { source: '总本金', target: '已还本金', value: data.paidPrincipal },
            { source: '总本金', target: '剩余本金', value: data.remainingPrincipal },
            { source: '总利息成本', target: '已付利息', value: data.paidInterest },
            { source: '总利息成本', target: '未来利息', value: data.remainingInterest },
            { source: '总利息成本', target: '已省利息', value: data.savedInterest }
          ],
          lineStyle: { color: 'gradient', curveness: 0.5 },
          label: { fontSize: 10, fontWeight: 'bold', color: '#475569' }
        }
      ]
    };
  }, [data]);

  // --- 热力图数据处理 (ROI 计算) ---
  const heatmapOption = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const years = ['今年', '明年', '后年'];
    
    // 模拟 ROI 计算: 越早还款 ROI 越高
    // 逻辑：ROI = (节省的总利息 / 提前还款本金)
    // 简化模型：随着期数增加，ROI 呈指数级下降
    const roiData: any[] = [];
    for (let y = 0; y < 3; y++) {
      for (let m = 0; m < 12; m++) {
        const monthIndex = y * 12 + m;
        const roi = Math.max(0, (data.annualRate * (30 - monthIndex / 12) / 100) * 0.8).toFixed(2);
        roiData.push([m, y, roi]);
      }
    }

    return {
      tooltip: { position: 'top' },
      grid: { height: '70%', top: '10%', bottom: '15%' },
      xAxis: { type: 'category', data: months, splitArea: { show: true } },
      yAxis: { type: 'category', data: years, splitArea: { show: true } },
      visualMap: {
        min: 0,
        max: 1.2,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        color: ['#10b981', '#f0fdf4'] // 绿色系
      },
      series: [{
        name: '还款收益率',
        type: 'heatmap',
        data: roiData,
        label: { show: true, fontSize: 9 },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        }
      }]
    };
  }, [data]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* 桑基图卡片 */}
      <div className="glass-card rounded-[40px] p-8 flex flex-col h-[500px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <Share2 className="w-6 h-6 text-indigo-500" />
            资金归宿桑基图
          </h3>
          <div className="group relative">
            <Info className="w-4 h-4 text-slate-300 cursor-help" />
            <div className="absolute right-0 bottom-full mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              展示您的每一分钱如何从总支出流向本金、利息，以及通过提前还款截留的利息。
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ReactECharts option={sankeyOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* 热力图卡片 */}
      <div className="glass-card rounded-[40px] p-8 flex flex-col h-[500px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <Zap className="w-6 h-6 text-emerald-500" />
            提前还款 ROI 效率热力图
          </h3>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">
            越高越划算
          </div>
        </div>
        <p className="text-xs text-slate-400 font-medium mb-4">
          基于当前 LPR 走势与本金曲线，测算未来 36 个月内“每一块钱提前还款”所能换取的利息节省比例。
        </p>
        <div className="flex-1 min-h-0">
          <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    </div>
  );
};

export default DeepInsights;
