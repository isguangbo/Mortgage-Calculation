# 🏦 Mortgage Repayment Assistant (房贷核心级测算系统 Pro Max)

一个极其精准、深度解构银行底层算法的现代化房贷计算与理财推演系统。不仅支持常规的等额本息/本金计算，还完美复刻了真实银行系统的“补偿平滑逻辑”、LPR 跨月分段计息以及各种复杂的提前还款策略。内置 AI 智能分析顾问，为您提供高情商的财务建议。

## ✨ 核心特性

- **🏦 银行级精确算力**：
  - **补偿平滑算法**：完美解决 2月/3月 天数波动导致的利息差额，精准对齐四大行真实账单。
  - **LPR 分段计息**：支持 1 号生效 vs 非 1 号生效的按天按老/新利率分段拆分计息。
  - **理论本金曲线**：确保在利率剧烈变动时，月供曲线依然保持平滑，不出现断崖式突变。

- **⚙️ 极度灵活的模拟推演**：
  - 支持记录并叠加**无数次** LPR 历史/未来重定价。
  - 支持多笔、多批次的**提前还款**叠加，支持“月供减少期限不变”及“月供不变期限缩短”两种经典策略混合计算。
  - 支持单条记录的编辑与一键清空。
  - **时光机功能**：Apple 级日期滚轮与精准期数输入联动，一键穿梭查看未来某年某月的结余与明细。

- **🤖 内置 AI 智能理财顾问**：
  - 接入大模型能力（默认配置通义千问 Qwen-Max）。
  - 根据当前贷款剩余本金、利息支出、提前还款频率及宏观市场利率，一键生成定制化的分析报告和理财建议。

- **💎 UI/UX Pro Max**：
  - 极致现代的玻璃拟态（Glassmorphism）设计语言。
  - 响应式双列布局，左侧沉浸式参数调优，右侧实时数据大屏反馈。
  - 苹果级手感的双视图（年/月）高频时间选择器。
  - 可视化的动态资产结构堆叠柱状图 (Chart.js)。

## 🚀 技术栈

- **框架**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **语言**: TypeScript (强类型约束，确保金融计算 0 偏差)
- **样式**: [Tailwind CSS](https://tailwindcss.com/) (高度定制化的原子类)
- **图标**: [Lucide React](https://lucide.dev/)
- **图表**: [Chart.js](https://www.chartjs.org/) + react-chartjs-2
- **AI 接口**: 阿里云 DashScope / Google Gemini

## 📦 安装与本地运行

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/MortgageRepaymentAssistant.git
cd MortgageRepaymentAssistant

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```
打开浏览器访问 `http://localhost:5173` 即可体验。

## 🧠 配置 AI 智能顾问

为了激活 AI 顾问功能，您需要配置大语言模型的 API Key。
目前代码默认使用阿里云的**通义千问 (Qwen-Max)**。

1. 前往 [阿里云 DashScope 控制台](https://dashscope.console.aliyun.com/apiKey) 申请 API Key。
2. 打开 `src/components/AIAdvisor.tsx` 文件。
3. 找到第 23 行左右，填入您的 Key：
   ```typescript
   const apiKey = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
   ```

*注：项目已在 `vite.config.ts` 中配置了本地跨域代理(`/api/dashscope`)，本地开发可直接无缝联调。上线部署时请改用后端转发或其他安全鉴权方式。*

## 🧪 单元测试

为了保障金融计算引擎的绝对精确，本项目配备了由 `Vitest` 驱动的核心算法测试用例，覆盖：
- 等额本息/本金基准测试
- LPR 跨月调整递减验证
- 提前还款策略断言
- 银行 360/365天 补偿平滑对账断言

运行测试：
```bash
npm run test
```

## 📄 License

MIT License. 
欢迎提交 Issue 和 Pull Request 一起优化这个强大的引擎！
