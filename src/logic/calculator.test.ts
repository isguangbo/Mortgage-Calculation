import { describe, it, expect } from 'vitest';
import { calculateMortgage, Prepayment, LPRAdjustment } from './calculator';

describe('房贷计算引擎核心逻辑测试', () => {
  
  it('基础等额本息计算 (100万, 4.0%, 30年)', () => {
    const result = calculateMortgage(100, 4.0, 30, '2023-01', 15, 360, 'monthly', '等额本息', [], []);
    expect(result.schedule.length).toBe(360);
    // 理论月供: 1000000 * 0.04/12 * (1+0.04/12)^360 / ((1+0.04/12)^360 - 1) ≈ 4774.15
    expect(result.schedule[0].payment).toBeCloseTo(4774.15, 1);
  });

  it('基础等额本金计算 (100万, 4.0%, 30年)', () => {
    const result = calculateMortgage(100, 4.0, 30, '2023-01', 15, 360, 'monthly', '等额本金', [], []);
    expect(result.schedule.length).toBe(360);
    // 首月本金: 1000000 / 360 = 2777.78
    // 首月利息: 1000000 * 0.04 / 12 = 3333.33
    // 首月总还款: 6111.11
    expect(result.schedule[0].principal).toBeCloseTo(2777.78, 1);
    expect(result.schedule[0].interest).toBeCloseTo(3333.33, 1);
    expect(result.schedule[0].payment).toBeCloseTo(6111.11, 1);
  });

  it('LPR 重定价调整逻辑', () => {
    const adjustments: LPRAdjustment[] = [
      { id: 'adj1', date: '2023-06', newRate: 3.5 }
    ];
    // 1月份开始，6月份利率从4.0%降至3.5%
    const result = calculateMortgage(100, 4.0, 30, '2023-01', 15, 360, 'monthly', '等额本息', [], adjustments);
    
    // 前5个月 (1,2,3,4,5) 应该是 4.0%
    expect(result.schedule[4].rate).toBe(4.0);
    // 第6个月应该是 3.5%
    expect(result.schedule[5].rate).toBe(3.5);
    // 利率变动后的第一个完整月 (第7个月) 应该明显减少
    expect(result.schedule[6].payment).toBeLessThan(result.schedule[4].payment);
    // 第6个月作为变动月，因为有前15天的老息，可能依然较高，这是正常的
  });

  it('提前还款 - 缩短期限策略', () => {
    const prepayments: Prepayment[] = [
      { id: 'pre1', date: '2023-02', amount: 100000, strategy: 'shorten_term' }
    ];
    // 在第2个月还10万，不减月供，缩短期限
    const result = calculateMortgage(100, 4.0, 30, '2023-01', 15, 360, 'monthly', '等额本息', prepayments, []);
    
    // 总期数应该明显少于 360 期
    expect(result.schedule.length).toBeLessThan(350);
    // 第3个月的月供 (除了由于天数/利率变动引起的微调外) 应该与第1个月基本一致
    expect(result.schedule[2].payment).toBeCloseTo(result.schedule[0].payment, 1);
  });

  it('提前还款 - 减少月供策略', () => {
    const prepayments: Prepayment[] = [
      { id: 'pre1', date: '2023-02', amount: 100000, strategy: 'reduce_payment' }
    ];
    // 在第2个月还10万，月供减少，期限不变
    const result = calculateMortgage(100, 4.0, 30, '2023-01', 15, 360, 'monthly', '等额本息', prepayments, []);
    
    // 总期数仍然应该是 360 期 (由于最后会有极小本金结清，可能 ±1 期)
    expect(Math.abs(result.schedule.length - 360)).toBeLessThanOrEqual(1);
    // 第3个月的月供应该明显减小
    expect(result.schedule[2].payment).toBeLessThan(result.schedule[0].payment * 0.95);
  });

  it('银行标准对账模式 (补偿平滑逻辑)', () => {
    // 设置还款日为30日，1月份开始还款
    const result = calculateMortgage(100, 4.0, 30, '2023-01', 30, 360, 'bank_standard', '等额本息', [], []);
    
    // 2月份还款日对应日期: 2月28日 (平年最后一天)
    // 银行补偿逻辑计息天数: 30 + 28 - 30 = 28天
    const febRow = result.schedule[1]; // 2023-02
    expect(febRow.days).toBe(28);
    
    // 3月份还款日对应日期: 3月30日
    // 银行补偿逻辑计息天数: 30 + 30 - 28 = 32天
    const marRow = result.schedule[2]; // 2023-03
    expect(marRow.days).toBe(32);
    
    // 利息应该随天数波动 (3月份利息 > 2月份利息)
    expect(marRow.interest).toBeGreaterThan(febRow.interest);
  });
});
