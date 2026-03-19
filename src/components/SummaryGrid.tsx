import React from 'react';
import { TrendingDown } from 'lucide-react';
import { formatMoneySimple } from '../utils/format';

interface SummaryGridProps {
  remainingPrincipal: number;
  remainingInterest: number;
  paidPrincipal: number;
  paidInterest: number;
  savedInterest: number;
}

const SummaryGrid: React.FC<SummaryGridProps> = ({
  remainingPrincipal,
  remainingInterest,
  paidPrincipal,
  paidInterest,
  savedInterest
}) => {
  return (
    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6'>
      <div className='glass-card rounded-[28px] p-5 sm:p-6 transition-transform hover:scale-[1.02] overflow-hidden'>
        <div className='text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 truncate'>当前剩余本金</div>
        <div className='text-lg sm:text-xl xl:text-2xl font-black text-slate-800 break-all leading-tight'>{formatMoneySimple(remainingPrincipal)}</div>
        <div className='mt-3 inline-flex items-center text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase tracking-tighter'>剩余本金余额</div>
      </div>
      
      <div className='glass-card rounded-[28px] p-5 sm:p-6 transition-transform hover:scale-[1.02] overflow-hidden'>
        <div className='text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 text-rose-400 truncate'>当前剩余利息</div>
        <div className='text-lg sm:text-xl xl:text-2xl font-black text-rose-500 break-all leading-tight'>{formatMoneySimple(remainingInterest)}</div>
        <div className='mt-3 inline-flex items-center text-[9px] font-bold px-2 py-0.5 bg-rose-50 text-rose-400 rounded-full uppercase tracking-tighter'>待付利息总额</div>
      </div>

      <div className='glass-card rounded-[28px] p-5 sm:p-6 transition-transform hover:scale-[1.02] overflow-hidden'>
        <div className='text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 text-sky-400 truncate'>累计已还本金</div>
        <div className='text-lg sm:text-xl xl:text-2xl font-black text-sky-600 break-all leading-tight'>{formatMoneySimple(paidPrincipal)}</div>
        <div className='mt-3 inline-flex items-center text-[9px] font-bold px-2 py-0.5 bg-sky-50 text-sky-500 rounded-full uppercase tracking-tighter'>已还本金总计</div>
      </div>

      <div className='glass-card rounded-[28px] p-5 sm:p-6 transition-transform hover:scale-[1.02] overflow-hidden'>
        <div className='text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 text-orange-400 truncate'>累计已还利息</div>
        <div className='text-lg sm:text-xl xl:text-2xl font-black text-orange-500 break-all leading-tight'>{formatMoneySimple(paidInterest)}</div>
        <div className='mt-3 inline-flex items-center text-[9px] font-bold px-2 py-0.5 bg-orange-50 text-orange-400 rounded-full uppercase tracking-tighter'>已付利息总计</div>
      </div>

      <div className='bg-emerald-600 rounded-[28px] p-5 sm:p-6 shadow-xl shadow-emerald-200/50 transition-transform hover:scale-[1.02] relative overflow-hidden group'>
        <div className='relative z-10 text-[10px] sm:text-xs font-bold text-emerald-100 uppercase tracking-widest mb-2 sm:mb-3 truncate'>预计总省利息</div>
        <div className='relative z-10 text-lg sm:text-xl xl:text-2xl font-black text-white break-all leading-tight'>{formatMoneySimple(savedInterest)}</div>
        <div className='relative z-10 mt-3 inline-flex items-center text-[9px] font-bold px-2 py-0.5 bg-emerald-500 text-white rounded-full uppercase tracking-tighter'>优化获益评估</div>
        <TrendingDown className='absolute right-[-15px] bottom-[-15px] w-24 h-24 text-white opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500' />
      </div>
    </div>
  );
};

export default SummaryGrid;
