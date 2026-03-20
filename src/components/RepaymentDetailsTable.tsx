import React, { useEffect, useRef } from 'react';
import { Calendar, Target, TrendingDown, Clock, Download } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatMoneySimple } from '../utils/format';
import { exportToCSV } from '../utils/export';

interface RepaymentDetailsTableProps {
  schedule: any[];
  monthsPaid: number;
  scrollToEventId?: string; // 外部触发的跳转 ID
}

const RepaymentDetailsTable: React.FC<RepaymentDetailsTableProps> = ({ schedule, monthsPaid, scrollToEventId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const isFirstRender = useRef(true);

  // 内部滚动核心函数：只滚动容器，不滚动页面
  const scrollToElement = (targetEl: HTMLElement | null, triggerWindowScroll = false) => {
    if (!targetEl || !scrollContainerRef.current) return;
    
    // 1. 微观轴：表格内部滚动
    const container = scrollContainerRef.current;
    const targetOffsetTop = targetEl.offsetTop;
    
    container.scrollTo({
      top: targetOffsetTop - 60,
      behavior: 'smooth'
    });

    // 2. 宏观轴：网页主窗口滚动 (仅在外部跳转时触发)
    if (triggerWindowScroll && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 1. 监听外部跳转指令 (LPR 或 提前还款跳转)
  useEffect(() => {
    if (scrollToEventId && rowRefs.current[scrollToEventId]) {
      // 触发双轴联动：内部滚动 + 外部页面滚动
      scrollToElement(rowRefs.current[scrollToEventId], true);
    }
  }, [scrollToEventId]);

  // 2. 监听时光机进度联动滚动
  useEffect(() => {
    // 首次加载绝对禁止滚动
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const targetPeriod = monthsPaid + 1;
    const targetKey = `period-${targetPeriod}`;
    if (rowRefs.current[targetKey]) {
      // 时光机仅触发内部微观滚动
      scrollToElement(rowRefs.current[targetKey], false);
    }
  }, [monthsPaid]);

  return (
    <div ref={containerRef} className='glass-card rounded-[40px] overflow-hidden flex flex-col h-[700px]'>
      <div className='p-8 border-b border-slate-100 bg-white/40 flex justify-between items-center'>
        <div>
          <h3 className='text-xl font-black text-slate-800 flex items-center gap-3'>
            <Calendar className='w-6 h-6 text-slate-400' />
            逐月还款流水明细
          </h3>
        </div>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => exportToCSV(schedule, `房贷还款流水明细`)}
            className='flex items-center gap-2 px-4 py-2 bg-white text-slate-600 font-bold rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95 text-xs'
          >
            <Download className='w-3.5 h-3.5 text-sky-500' />
            导出数据 (CSV)
          </button>
          <div className='px-3 py-1 bg-sky-50 text-sky-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-sky-100'>
            共计 {schedule.length} 期还款流水
          </div>
        </div>
      </div>
      
      {/* 关键：增加 relative 属性，使 offsetTop 计算基于此容器 */}
      <div ref={scrollContainerRef} className='overflow-x-auto overflow-y-auto flex-1 no-scrollbar scroll-smooth relative'>
        <table className='w-full text-sm text-left whitespace-nowrap border-separate border-spacing-0'>
          <thead className='text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 sticky top-0 z-20 backdrop-blur-md'>
            <tr>
              <th className='px-6 py-5 border-b border-slate-100'>期数</th>
              <th className='px-6 py-5 border-b border-slate-100'>账单日期</th>
              <th className='px-6 py-5 text-center border-b border-slate-100'>执行利率</th>
              <th className='px-6 py-5 text-center border-b border-slate-100'>计息天数</th>
              <th className='px-6 py-5 text-right border-b border-slate-100'>当月总支出</th>
              <th className='px-6 py-5 text-right text-sky-600 border-b border-slate-100'>还本金</th>
              <th className='px-6 py-5 text-right text-orange-500 border-b border-slate-100'>还利息</th>
              <th className='px-6 py-5 text-right border-b border-slate-100'>剩余本金</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-50'>
            {schedule.map((row, idx) => {
              const isHistory = idx < monthsPaid;
              const isNow = idx === monthsPaid;
              const rowKey = `period-${row.period}`;
              const eventKey = row.eventId;

              return (
                <React.Fragment key={idx}>
                  {isNow && (
                    <tr className='sticky top-[58px] z-10'>
                      <td colSpan={8} className='px-6 py-4 bg-sky-600 text-center text-xs text-white font-black tracking-[0.2em] shadow-lg uppercase'>
                        <div className='flex items-center justify-center gap-2'>
                          <Target className='w-3 h-3' />
                          上方为历史数据 | 下方为未来预测数据
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr 
                    ref={el => {
                      rowRefs.current[rowKey] = el;
                      if (eventKey) rowRefs.current[eventKey] = el;
                    }}
                    className={cn(
                      'hover:bg-sky-50/50 transition-all duration-150 group', 
                      isHistory && 'opacity-40 grayscale-[0.2]', 
                      row.isSpecial && 'bg-indigo-50/10'
                    )}
                  >
                    <td className='px-6 py-5 font-bold text-slate-400'>{row.period}期</td>
                    <td className='px-6 py-5'>
                      <div className='font-bold text-slate-700'>{row.date}</div>
                      <div className='text-[9px] font-bold text-slate-300 uppercase mt-0.5 tracking-tighter'>{row.periodStr}</div>
                    </td>
                    <td className='px-6 py-5 text-center'>
                      <span className='bg-white px-2 py-1 rounded-lg text-xs font-black text-slate-600 border border-slate-100 shadow-sm'>{row.rate}%</span>
                    </td>
                    <td className='px-6 py-5 text-center font-mono font-bold'>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[10px]',
                          row.days < 30 ? 'bg-sky-100 text-sky-700' : row.days > 30 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {row.days}天
                      </span>
                    </td>
                    <td className='px-6 py-5 text-right font-black text-slate-800 text-base'>{formatMoneySimple(row.payment)}</td>
                    <td className='px-6 py-5 text-right font-bold text-sky-600/80'>{formatMoneySimple(row.principal)}</td>
                    <td className='px-6 py-5 text-right font-bold text-orange-500/80'>{formatMoneySimple(row.interest)}</td>
                    <td className='px-6 py-5 text-right font-bold text-slate-500'>{formatMoneySimple(row.remainingPrincipal)}</td>
                  </tr>
                  
                  {/* 事件价值气泡渲染 */}
                  {(row.note || row.impactValue) && (
                    <tr className='bg-indigo-50/20'>
                      <td colSpan={8} className='px-6 py-3'>
                        <div className='flex items-center justify-end gap-4'>
                          {row.impactValue !== undefined && (
                            <div className={cn(
                              'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border',
                              row.impactValue > 0 ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'
                            )}>
                              {row.impactValue > 0 ? <TrendingDown className='w-3 h-3' /> : <Clock className='w-3 h-3' />}
                              {row.impactValue > 0 ? `利息节省: ¥${row.impactValue.toLocaleString()}` : `利息增加: ¥${Math.abs(row.impactValue).toLocaleString()}`}
                            </div>
                          )}
                          {row.note && (
                            <div className='text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2'>
                              <span className='w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse' />
                              {row.note}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RepaymentDetailsTable;
