import React from 'react';
import { TrendingDown } from 'lucide-react';
import MonthPicker from '../MonthPicker';

interface LPRModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  setDate: (v: string) => void;
  rate: number | string;
  setRate: (v: any) => void;
  onConfirm: () => void;
  isEditing: boolean;
}

const LPRModal: React.FC<LPRModalProps> = ({
  isOpen, onClose, date, setDate, rate, setRate, onConfirm, isEditing
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4'>
      <div className='glass-card bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 transform animate-in fade-in zoom-in duration-200'>
        <h3 className='text-xl font-black text-slate-800 mb-6 flex items-center gap-2'>
          <TrendingDown className='w-6 h-6 text-indigo-500' />
          {isEditing ? '编辑 LPR 记录' : 'LPR 重定价'}
        </h3>
        <div className='space-y-5'>
          <MonthPicker label='生效年月' value={date} onChange={setDate} className='bg-slate-50' />
          <div>
            <label className='block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2'>新利率 (%)</label>
            <input
              type='number'
              step='0.01'
              value={rate}
              onChange={e => setRate(e.target.value)}
              className='w-full p-3.5 glass-card rounded-xl bg-slate-50 font-bold input-focus no-spin'
            />
          </div>
        </div>
        <div className='flex gap-4 mt-8'>
          <button onClick={onClose} className='flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-all'>
            取消
          </button>
          <button onClick={onConfirm} className='flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all'>
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default LPRModal;
