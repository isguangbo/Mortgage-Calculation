import React from 'react';
import { Clock } from 'lucide-react';
import MonthPicker from '../MonthPicker';
import { cn } from '../../utils/cn';
import { Prepayment } from '../../logic/calculator';

interface PrepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  setDate: (v: string) => void;
  amount: number | string;
  setAmount: (v: any) => void;
  strategy: Prepayment['strategy'];
  setStrategy: (v: Prepayment['strategy']) => void;
  onConfirm: () => void;
  isEditing: boolean;
}

const PrepaymentModal: React.FC<PrepaymentModalProps> = ({
  isOpen, onClose, date, setDate, amount, setAmount, strategy, setStrategy, onConfirm, isEditing
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4'>
      <div className='glass-card bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 transform animate-in fade-in zoom-in duration-200'>
        <h3 className='text-xl font-black text-slate-800 mb-6 flex items-center gap-2'>
          <Clock className='w-6 h-6 text-emerald-500' />
          {isEditing ? '编辑提前还款' : '添加提前还款'}
        </h3>
        <div className='space-y-5'>
          <MonthPicker label='还款年月' value={date} onChange={setDate} className='bg-slate-50' />
          <div>
            <label className='block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2'>还本金额 (万元)</label>
            <input
              type='number'
              step='1'
              placeholder='0'
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className='w-full p-3.5 glass-card rounded-xl bg-slate-50 font-bold input-focus no-spin'
            />
          </div>
          <div>
            <label className='block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2'>还款策略</label>
            <div className='space-y-3'>
              {(['reduce_payment', 'shorten_term'] as const).map(s => (
                <label
                  key={s}
                  className={cn(
                    'flex items-center p-4 border rounded-2xl cursor-pointer transition-all',
                    strategy === s ? 'bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-50' : 'bg-white border-slate-100'
                  )}
                >
                  <input type='radio' name='prepayStrategy' checked={strategy === s} onChange={() => setStrategy(s)} className='hidden' />
                  <div className={cn('w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center', strategy === s ? 'border-emerald-600' : 'border-slate-300')}>
                    {strategy === s && <div className='w-2 h-2 rounded-full bg-emerald-600' />}
                  </div>
                  <span className={cn('text-sm font-bold', strategy === s ? 'text-emerald-700' : 'text-slate-500')}>
                    {s === 'reduce_payment' ? '月供减少，期限不变 (缓解压力)' : '月供不变，缩短期限 (最省利息)'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className='flex gap-4 mt-8'>
          <button onClick={onClose} className='flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-all'>
            取消
          </button>
          <button onClick={onConfirm} className='flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all'>
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrepaymentModal;
