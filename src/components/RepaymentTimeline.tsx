import React from 'react';
import { Clock } from 'lucide-react';

interface RepaymentTimelineProps {
  actualMonths: number;
  originalMonths: number;
  monthsSaved: number;
}

const RepaymentTimeline: React.FC<RepaymentTimelineProps> = ({
  actualMonths,
  originalMonths,
  monthsSaved
}) => {
  return (
    <div className='glass-card rounded-[32px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8'>
      <div className='flex items-center gap-4 sm:gap-6 w-full md:w-auto'>
        <div className='w-12 h-12 sm:w-16 sm:h-16 bg-sky-50 rounded-2xl flex items-center justify-center shrink-0'>
          <Clock className='w-6 h-6 sm:w-8 sm:h-8 text-sky-600' />
        </div>
        <div className='min-w-0'>
          <div className='text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest truncate'>实际结清周期</div>
          <div className='text-2xl sm:text-3xl xl:text-4xl font-black text-slate-800 mt-1 truncate'>
            {actualMonths} <span className='text-lg sm:text-xl font-bold text-slate-300'>个月</span>
          </div>
        </div>
      </div>
      <div className='flex items-center gap-6 sm:gap-8 md:text-right w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100'>
        <div className='min-w-0'>
          <div className='text-xs sm:text-sm font-bold text-slate-400 mb-1'>原计划周期</div>
          <div className='text-lg sm:text-xl font-bold text-slate-700 truncate'>{originalMonths} 期</div>
        </div>
        {monthsSaved > 0 && (
          <div className='bg-emerald-50 text-emerald-700 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-emerald-100 shrink-0'>
            <div className='text-[9px] font-black uppercase tracking-widest mb-0.5'>提前结清</div>
            <div className='text-sm sm:text-base font-black leading-none'>提前 {monthsSaved} 个月</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepaymentTimeline;
