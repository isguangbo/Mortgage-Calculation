import React, { useState, useMemo } from 'react';
import { Settings, AlertTriangle, History, TrendingDown, Clock, Plus, Edit2, Trash2, Target } from 'lucide-react';
import { cn } from '../utils/cn';
import { LPRAdjustment, Prepayment, RepaymentMethod, InterestRule, addMonths } from '../logic/calculator';
import MonthPicker from './MonthPicker';

interface LoanConfigSidebarProps {
  loanAmount: number | string;
  setLoanAmount: (v: any) => void;
  annualRate: number | string;
  setAnnualRate: (v: any) => void;
  loanYears: number;
  setLoanYears: (v: number) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  paymentDay: number | string;
  setPaymentDay: (v: any) => void;
  repaymentMethod: RepaymentMethod;
  setRepaymentMethod: (v: RepaymentMethod) => void;
  interestRule: InterestRule;
  setInterestRule: (v: InterestRule) => void;
  dailyBasis: 360 | 365;
  setDailyBasis: (v: 360 | 365) => void;
  monthsPaid: number | string;
  setMonthsPaid: (v: any) => void;
  maxMonths: number;
  rateAdjustments: LPRAdjustment[];
  prepayments: Prepayment[];
  onAddLPR: () => void;
  onEditLPR: (r: LPRAdjustment) => void;
  onDeleteLPR: (id: string | number) => void;
  onClearLPR: () => void;
  onAddPrepay: () => void;
  onEditPrepay: (p: Prepayment) => void;
  onDeletePrepay: (id: string | number) => void;
  onClearPrepay: () => void;
  onJumpToEvent: (id: string) => void;
}

const LoanConfigSidebar: React.FC<LoanConfigSidebarProps> = ({
  loanAmount, setLoanAmount, annualRate, setAnnualRate, loanYears, setLoanYears,
  startDate, setStartDate, paymentDay, setPaymentDay, repaymentMethod, setRepaymentMethod,
  interestRule, setInterestRule, dailyBasis, setDailyBasis, monthsPaid, setMonthsPaid,
  maxMonths, rateAdjustments, prepayments, onAddLPR, onEditLPR, onDeleteLPR, onClearLPR,
  onAddPrepay, onEditPrepay, onDeletePrepay, onClearPrepay, onJumpToEvent
}) => {
  return (
    <aside className='space-y-6 lg:sticky lg:top-6'>
      <div className='glass-card rounded-3xl p-7 relative z-20'>
        <h2 className='text-xl font-bold mb-6 flex items-center gap-3 text-slate-800'>
          <Settings className='w-5 h-5 text-sky-500' />
          贷款配置
        </h2>

        <div className='space-y-5'>
          <div className='group'>
            <label className='block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2'>贷款总额 (万元)</label>
            <input
              type='number'
              placeholder='0'
              value={loanAmount}
              onChange={e => setLoanAmount(e.target.value)}
              className='w-full p-4 glass-card rounded-2xl bg-white/50 text-xl font-bold text-slate-800 input-focus no-spin'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2'>利率 (%)</label>
              <input
                type='number'
                step='0.01'
                placeholder='0.00'
                value={annualRate}
                onChange={e => setAnnualRate(e.target.value)}
                className='w-full p-3.5 glass-card rounded-xl bg-white/50 font-bold input-focus no-spin'
              />
            </div>
            <div>
              <label className='block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2'>年限 (年)</label>
              <select
                value={loanYears}
                onChange={e => setLoanYears(Number(e.target.value))}
                className='w-full p-3.5 glass-card rounded-xl bg-white/50 font-bold input-focus cursor-pointer appearance-none'
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.2em'
                }}
              >
                {[10, 15, 20, 25, 30].map(y => (
                  <option key={y} value={y}>{y} 年</option>
                ))}
              </select>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <MonthPicker label='首期年月' value={startDate} onChange={setStartDate} />
            <div>
              <label className='block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2'>还款日</label>
              <input
                type='number'
                min='1'
                max='31'
                placeholder='1'
                value={paymentDay}
                onChange={e => setPaymentDay(e.target.value)}
                className='w-full p-3.5 glass-card rounded-xl bg-white/50 font-bold input-focus no-spin'
              />
            </div>
          </div>

          <div>
            <label className='block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2'>还款方式</label>
            <div className='flex bg-slate-100/50 p-1.5 rounded-2xl'>
              <button
                onClick={() => setRepaymentMethod('等额本息')}
                className={cn(
                  'flex-1 py-2.5 text-sm rounded-xl transition-all duration-300',
                  repaymentMethod === '等额本息' ? 'bg-white shadow-sm text-sky-600 font-bold scale-[1.02]' : 'text-slate-500 font-medium'
                )}
              >
                等额本息
              </button>
              <button
                onClick={() => setRepaymentMethod('等额本金')}
                className={cn(
                  'flex-1 py-2.5 text-sm rounded-xl transition-all duration-300',
                  repaymentMethod === '等额本金' ? 'bg-white shadow-sm text-sky-600 font-bold scale-[1.02]' : 'text-slate-500 font-medium'
                )}
              >
                等额本金
              </button>
            </div>
          </div>

          <div className='pt-4 mt-2 border-t border-slate-100 space-y-4'>
            <h3 className='text-xs font-bold text-rose-500 flex items-center gap-2'>
              <AlertTriangle className='w-4 h-4' /> 银行精算规则
            </h3>
            <div className='space-y-3'>
              <select
                value={interestRule}
                onChange={e => setInterestRule(e.target.value as InterestRule)}
                className='w-full p-2.5 glass-card rounded-xl bg-rose-50/20 text-xs font-bold text-rose-900 input-focus'
              >
                <option value='bank_standard'>银行真实模式 (补偿平滑)</option>
                <option value='monthly'>理论月平摊模式</option>
                <option value='daily'>绝对物理天数模式</option>
              </select>
              <select
                value={dailyBasis}
                onChange={e => setDailyBasis(Number(e.target.value) as 360 | 365)}
                className='w-full p-2.5 glass-card rounded-xl bg-rose-50/20 text-xs font-bold text-rose-900 input-focus'
              >
                <option value='360'>360天 (央行标准)</option>
                <option value='365'>365天 (特殊银行)</option>
              </select>
            </div>
          </div>

          <div className='pt-6 border-t border-slate-100'>
            <div className='flex items-center justify-between mb-4'>
              <span className='flex items-center gap-2 text-sm font-bold text-slate-700'>
                <History className='w-4 h-4 text-sky-500' />
                时光机进度
              </span>
              <button 
                onClick={() => onJumpToEvent('current')} 
                className='p-1.5 hover:bg-sky-50 text-sky-600 rounded-lg transition-colors'
                title='跳转至当期'
              >
                <Target className='w-4 h-4' />
              </button>
            </div>
            <div className='flex items-center gap-2 mb-4'>
              <div className='flex-1'>
                <MonthPicker 
                  value={addMonths(startDate, Number(monthsPaid) || 0)} 
                  onChange={newDate => {
                    const [sy, sm] = startDate.split('-').map(Number);
                    const [ny, nm] = newDate.split('-').map(Number);
                    const diff = Math.max(0, (ny - sy) * 12 + (nm - sm));
                    setMonthsPaid(diff);
                  }} 
                  className='!p-2.5 min-h-[44px]'
                />
              </div>
              <div className='w-24 relative shrink-0'>
                <input 
                  type='number' 
                  value={monthsPaid} 
                  onChange={e => setMonthsPaid(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))} 
                  className='w-full p-2.5 pr-6 glass-card rounded-xl bg-white/50 font-bold text-center text-slate-800 input-focus no-spin' 
                />
                <span className='absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold'>期</span>
              </div>
            </div>
            <input type='range' min='0' max={maxMonths} value={Number(monthsPaid) || 0} onChange={e => setMonthsPaid(Number(e.target.value))} className='w-full accent-sky-600' />
          </div>
        </div>
      </div>

      {/* LPR Records */}
      <div className='glass-card rounded-3xl p-6'>
        <div className='flex items-center justify-between mb-5'>
          <h2 className='text-base font-bold flex items-center gap-2 text-slate-800'>
            <TrendingDown className='w-5 h-5 text-indigo-500' />
            LPR 记录
          </h2>
          <div className='flex items-center gap-2'>
            {rateAdjustments.length > 0 && (
              <button aria-label='清除所有 LPR 记录' onClick={onClearLPR} className='px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors'>清空</button>
            )}
            <button aria-label='添加 LPR 记录' onClick={onAddLPR} className='p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 hover:scale-105 transition-all'>
              <Plus className='w-4 h-4' />
            </button>
          </div>
        </div>
        <div className='space-y-2'>
          {rateAdjustments.length > 0 ? (
            rateAdjustments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(r => (
              <div key={r.id} className='flex items-center justify-between p-3.5 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 group'>
                <div>
                  <div className='font-bold text-indigo-900 text-sm'>{r.date}</div>
                  <div className='text-indigo-600/80 text-xs font-medium'>重定价: {r.newRate}%</div>
                </div>
                <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <button onClick={() => onJumpToEvent(`lpr-${r.id}`)} className='text-sky-500 hover:text-sky-700 p-2 transition-colors' title='定位到此处'><Target className='w-4 h-4' /></button>
                  <button onClick={() => onEditLPR(r)} className='text-indigo-400 hover:text-indigo-600 p-2 transition-colors'><Edit2 className='w-4 h-4' /></button>
                  <button onClick={() => onDeleteLPR(r.id)} className='text-red-400 hover:text-red-600 p-2 transition-colors'><Trash2 className='w-4 h-4' /></button>
                </div>
              </div>
            ))
          ) : (
            <div className='text-center py-6 text-xs text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl'>无记录</div>
          )}
        </div>
      </div>

      {/* Prepayment Records */}
      <div className='glass-card rounded-3xl p-6'>
        <div className='flex items-center justify-between mb-5'>
          <h2 className='text-base font-bold flex items-center gap-2 text-slate-800'>
            <Clock className='w-5 h-5 text-emerald-500' />
            提前还款记录
          </h2>
          <div className='flex items-center gap-2'>
            {prepayments.length > 0 && (
              <button onClick={onClearPrepay} className='px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors'>清空</button>
            )}
            <button aria-label='添加提前还款记录' onClick={onAddPrepay} className='p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 hover:scale-105 transition-all'>
              <Plus className='w-4 h-4' />
            </button>
          </div>
        </div>
        <div className='space-y-2'>
          {prepayments.length > 0 ? (
            prepayments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(p => (
              <div key={p.id} className='flex items-center justify-between p-3.5 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 group'>
                <div>
                  <div className='font-bold text-emerald-800 text-sm'>{p.date} 还{p.amount / 10000}万</div>
                  <div className='text-emerald-600/70 text-[10px] font-bold uppercase tracking-tight'>
                    {p.strategy === 'reduce_payment' ? '供减,期不变' : '供不变,期短'}
                  </div>
                </div>
                <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <button onClick={() => onJumpToEvent(`prepay-${p.id}`)} className='text-sky-500 hover:text-sky-700 p-2 transition-colors' title='定位到此处'><Target className='w-4 h-4' /></button>
                  <button onClick={() => onEditPrepay(p)} className='text-emerald-500 hover:text-emerald-700 p-2 transition-colors'><Edit2 className='w-4 h-4' /></button>
                  <button onClick={() => onDeletePrepay(p.id)} className='text-red-400 hover:text-red-600 p-2 transition-colors'><Trash2 className='w-4 h-4' /></button>
                </div>
              </div>
            ))
          ) : (
            <div className='text-center py-6 text-xs text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl'>无记录</div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default LoanConfigSidebar;
