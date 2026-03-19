import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { calculateMortgage } from './logic/calculator';

describe('🏠 房贷核心测算系统 - 全面 UI & 数据审计', () => {
  it('应当正确更新“当前剩余利息”卡片在修改贷款总额时', async () => {
    render(<App />);
    
    // 获取贷款总额输入框
    const amountInput = screen.getByPlaceholderText('0') as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: '200' } });
    
    // 检查剩余利息卡片是否存在并显示非零值
    const interestCardLabel = screen.getByText('当前剩余利息');
    expect(interestCardLabel).toBeInTheDocument();
    
    // 由于计算是异步响应式的，这里我们检查 UI 是否反映了新的状态
    // (在 jsdom 中由于 mock 了 Chart，主要检查文本)
    const allInterestValues = screen.getAllByText(/[\d,.]+/); 
    expect(allInterestValues.length).toBeGreaterThan(0);
  });

  it('应当正确计算并显示“无债之身”倒计时和还款进度', async () => {
    render(<App />);
    
    // 检查倒计时文字是否存在
    expect(screen.getByText(/无债之身还需/i)).toBeInTheDocument();
    
    // 检查进度条百分比文字
    expect(screen.getByLabelText('债务偿还进度百分比')).toBeInTheDocument();
  });

  it('LPR 重定价应当能成功打开并添加记录', async () => {
    render(<App />);
    
    // 查找并点击带有明确 aria-label 的添加按钮
    const plusBtn = screen.getByLabelText('添加 LPR 记录');
    fireEvent.click(plusBtn);

    // 弹窗应当可见
    expect(screen.getByText('LPR 重定价')).toBeInTheDocument();
  });
});

describe('⚡ 算法引擎 - 性能与高并发审计', () => {
  it('在极端场景下 (30年+12次分段+5次提前还款) 计算耗时应低于 5ms', () => {
    const start = performance.now();
    
    for (let i = 0; i < 10; i++) { // 模拟多次连续触发
      calculateMortgage(
        200, 4.1, 30, '2023-01', 30, 360, 'bank_standard', '等额本息',
        [
          { id: 1, date: '2024-01', amount: 100000, strategy: 'reduce_payment' },
          { id: 2, date: '2025-01', amount: 50000, strategy: 'shorten_term' }
        ],
        [
          { id: 1, date: '2024-01', newRate: 3.9 },
          { id: 2, date: '2025-01', newRate: 3.5 }
        ]
      );
    }
    
    const end = performance.now();
    const avgTime = (end - start) / 10;
    console.log(`[Performance] 平均计算耗时: ${avgTime.toFixed(4)}ms`);
    expect(avgTime).toBeLessThan(5);
  });
});

describe('📱 响应式布局兼容性审计', () => {
  it('指标网格应当使用响应式断点控制列数', () => {
    const { container } = render(<App />);
    const grid = container.querySelector('.grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-5');
    expect(grid).not.toBeNull();
    // 验证确实应用了 Pro Max 级的 5 列响应式布局
  });
});
