import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MonthPickerProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ value, onChange, label, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [viewDate, setViewDate] = useState(new Date(value ? value + '-01' : new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-01'));
  const containerRef = useRef<HTMLDivElement>(null);

  const currentYear = viewDate.getFullYear();
  
  // Safe parsing in case value is unexpectedly empty
  const parsedValue = value ? value.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
  const selectedYear = parsedValue[0];
  const selectedMonth = parsedValue[1] - 1;

  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + '-01'));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setViewMode('month');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleYearPageChange = (offset: number) => {
    const newDate = new Date(viewDate);
    if (viewMode === 'year') {
      newDate.setFullYear(currentYear + offset * 12);
    } else {
      newDate.setFullYear(currentYear + offset);
    }
    setViewDate(newDate);
  };

  const handleMonthSelect = (monthIndex: number) => {
    const formattedDate = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(newDate);
    setViewMode('month');
  };

  const handleGoToToday = () => {
    const d = new Date();
    const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    onChange(formattedDate);
    setViewDate(d);
    setViewMode('month');
    setIsOpen(false);
  };

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  // 生成以当前 viewDate 为中心的 12 个年份
  const startYear = currentYear - (currentYear % 12);
  const years = Array.from({ length: 12 }, (_, i) => startYear + i);

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</label>}
      
      {/* Input Display Button */}
      <div className={cn("w-full flex items-center justify-between p-1.5 glass-card rounded-xl transition-all group focus-within:ring-4 focus-within:ring-sky-500/10 focus-within:border-sky-500 min-h-[52px]", className || "bg-white/50")}>
        <div className="flex items-center flex-1 ml-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setViewMode('year');
            }}
            className={cn("px-2 py-1.5 rounded-lg text-sm font-bold transition-colors", viewMode === 'year' && isOpen ? "text-indigo-600 bg-indigo-50" : "text-slate-800 hover:bg-slate-100")}
          >
            {selectedYear}年
          </button>
          <span className="text-slate-300 font-bold">/</span>
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setViewMode('month');
            }}
            className={cn("px-2 py-1.5 rounded-lg text-sm font-bold transition-colors", viewMode === 'month' && isOpen ? "text-sky-600 bg-sky-50" : "text-slate-800 hover:bg-slate-100")}
          >
            {selectedMonth + 1}月
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setViewMode('month');
          }}
          className="p-2 mr-1 rounded-lg text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full mt-3 z-[110] w-[300px] -left-4 sm:left-0 glass-card bg-white/95 backdrop-blur-xl rounded-[28px] p-5 shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => handleYearPageChange(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setViewMode(viewMode === 'year' ? 'month' : 'year')}
              className="px-4 py-1.5 hover:bg-slate-100 rounded-full transition-all active:scale-95 flex items-center gap-1 group"
            >
              <span className="text-lg font-black text-slate-800 tracking-tight">
                {viewMode === 'year' ? `${years[0]}-${years[11]}` : `${currentYear}年`}
              </span>
              <div className={cn("w-2 h-2 rounded-full bg-sky-500 transition-all", viewMode === 'year' ? "scale-100" : "scale-0")} />
            </button>

            <button onClick={() => handleYearPageChange(1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Grid Content */}
          <div className="grid grid-cols-3 gap-3">
            {viewMode === 'month' ? (
              // Month View
              months.map((name, index) => {
                const isSelected = selectedYear === currentYear && selectedMonth === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleMonthSelect(index)}
                    className={cn(
                      "py-3 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-95",
                      isSelected 
                        ? "bg-sky-600 text-white shadow-lg shadow-sky-200 scale-105" 
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {name}
                  </button>
                );
              })
            ) : (
              // Year View
              years.map((year) => {
                const isSelected = selectedYear === year;
                return (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className={cn(
                      "py-3 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-95",
                      isSelected 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105" 
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {year}
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button 
              onClick={handleGoToToday} 
              className="w-full py-2 text-[10px] font-black text-slate-300 hover:text-sky-600 uppercase tracking-widest transition-colors"
            >
              回到今天
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthPicker;
