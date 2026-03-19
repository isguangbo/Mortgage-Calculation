import React from 'react';
import { Clock } from 'lucide-react';

interface FreedomCountdownProps {
  daysRemaining: number;
  debtPaidPercent: number;
  finalDate: string;
  actualMonths: number;
  monthsSaved: number;
}

const FreedomCountdown: React.FC<FreedomCountdownProps> = ({
  daysRemaining,
  debtPaidPercent,
  finalDate,
  actualMonths,
  monthsSaved
}) => {
  return (
    <div className='glass-card rounded-[40px] p-6 sm:p-8 bg-gradient-to-br from-indigo-900/95 to-slate-900 border-none shadow-2xl relative overflow-hidden group'>
      <div 
        className='absolute inset-0 opacity-[0.03] pointer-events-none'
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, white 1px, transparent 0),
            radial-gradient(circle at 6px 6px, white 1px, transparent 0)
          `,
          backgroundSize: '8px 8px'
        }}
      />
      <div className='absolute top-0 right-0 p-8'>
        <div className='w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl animate-pulse' />
      </div>

      <div className='relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8'>
        <div className='flex-1'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/30'>
              财务自由进度
            </div>
            {monthsSaved > 0 && (
              <div className='px-3 py-1 bg-sky-500/20 text-sky-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-sky-500/30 flex items-center gap-1.5'>
                <Clock className='w-3 h-3' />
                还款期已缩短 {monthsSaved} 个月
              </div>
            )}
          </div>
          
          <h2 className='text-3xl sm:text-4xl font-black text-white mb-2 flex items-baseline gap-3'>
            无债之身还需 <span className='text-emerald-400 tabular-nums'>{daysRemaining.toLocaleString()}</span> <span className='text-xl text-slate-400 font-bold'>天</span>
          </h2>
          <p className='text-slate-400 font-bold text-sm'>
            预计结清日期: <span className='text-slate-200'>{finalDate}</span> • 剩余 {actualMonths} 期
          </p>
        </div>

        <div className='lg:w-72 shrink-0'>
          <div className='flex justify-between items-end mb-3'>
            <div className='text-xs font-black text-slate-500 uppercase tracking-widest'>已还贷款比例</div>
            <div aria-label='债务偿还进度百分比' className='text-2xl font-black text-emerald-400 tabular-nums'>{(debtPaidPercent || 0).toFixed(1)}%</div>
          </div>
          <div className='h-3 w-full bg-slate-800 rounded-full overflow-hidden p-[1px] border border-slate-700/50'>
            <div 
              className='h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out relative group-hover:shadow-[0_0_20px_rgba(52,211,153,0.4)]'
              style={{ width: `${debtPaidPercent || 0}%` }}
            >
              <div className='absolute top-0 right-0 h-full w-4 bg-white/20 skew-x-12 -translate-x-1/2 blur-sm' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreedomCountdown;
