import React, { useState, useMemo, useEffect } from 'react'
import { Calculator, Settings, TrendingDown, Clock, Plus, Trash2, Edit2, Trash, DollarSign, AlertTriangle, History, Calendar, ChevronRight, BarChart3 } from 'lucide-react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { calculateMortgage, Prepayment, LPRAdjustment, RepaymentMethod, InterestRule, addMonths, formatMMDD } from './logic/calculator'
import AIAdvisor from './components/AIAdvisor'
import MonthPicker from './components/MonthPicker'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

const formatMoney = (amount: number) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2 }).format(amount)

const App: React.FC = () => {
	// --- States ---
	const [loanAmount, setLoanAmount] = useState<number | string>(133)
	const [annualRate, setAnnualRate] = useState<number | string>(4.1)
	const [loanYears, setLoanYears] = useState<number>(30)
	const [startDate, setStartDate] = useState<string>('2022-12')
	const [paymentDay, setPaymentDay] = useState<number | string>(30)
	const [repaymentMethod, setRepaymentMethod] = useState<RepaymentMethod>('等额本息')
	const [interestRule, setInterestRule] = useState<InterestRule>('bank_standard')
	const [dailyBasis, setDailyBasis] = useState<360 | 365>(360)

	const [monthsPaid, setMonthsPaid] = useState<number | string>(38)

	const [rateAdjustments, setRateAdjustments] = useState<LPRAdjustment[]>([
		{ id: 1, date: '2024-01', newRate: 4.0 },
		{ id: 2, date: '2024-10', newRate: 3.9 },
		{ id: 3, date: '2025-01', newRate: 3.3 },
		{ id: 4, date: '2026-01', newRate: 3.2 }
	])

	const [prepayments, setPrepayments] = useState<Prepayment[]>([])

	// Modals
	const [isLprModalOpen, setIsLprModalOpen] = useState(false)
	const [newLprDate, setNewLprDate] = useState('')
	const [newLprRate, setNewLprRate] = useState<number | string>('')
	const [editingLprId, setEditingLprId] = useState<string | number | null>(null)

	const [isPrepayModalOpen, setIsPrepayModalOpen] = useState(false)
	const [newPrepayDate, setNewPrepayDate] = useState('')
	const [newPrepayAmount, setNewPrepayAmount] = useState<number | string>(1)
	const [newPrepayStrategy, setNewPrepayStrategy] = useState<Prepayment['strategy']>('reduce_payment')
	const [editingPrepayId, setEditingPrepayId] = useState<string | number | null>(null)

	// --- Calculations ---
	const actualRun = useMemo(() => {
		return calculateMortgage(Number(loanAmount) || 0, Number(annualRate) || 0, loanYears, startDate, Number(paymentDay) || 0, dailyBasis, interestRule, repaymentMethod, prepayments, rateAdjustments)
	}, [loanAmount, annualRate, loanYears, startDate, paymentDay, dailyBasis, interestRule, repaymentMethod, prepayments, rateAdjustments])

	const baseRun = useMemo(() => {
		return calculateMortgage(Number(loanAmount) || 0, Number(annualRate) || 0, loanYears, startDate, Number(paymentDay) || 0, dailyBasis, interestRule, repaymentMethod, [], rateAdjustments)
	}, [loanAmount, annualRate, loanYears, startDate, paymentDay, dailyBasis, interestRule, repaymentMethod, rateAdjustments])

	const summary = useMemo(() => {
		if (!actualRun) return null
		const schedule = actualRun.schedule
		const currentMonthsPaid = Math.min(Number(monthsPaid) || 0, schedule.length)

		let paidPrincipal = 0
		let paidInterest = 0
		let remainingPrincipal = (Number(loanAmount) || 0) * 10000

		schedule.forEach((row, idx) => {
			if (idx < currentMonthsPaid) {
				paidPrincipal += row.principal + row.prepaymentAmount
				paidInterest += row.interest
			}
			if (idx === currentMonthsPaid - 1) {
				remainingPrincipal = row.remainingPrincipal
			}
		})

		if (currentMonthsPaid === 0) {
			remainingPrincipal = (Number(loanAmount) || 0) * 10000
		}

		const savedInterest = Math.max(0, baseRun.totalInterest - actualRun.totalInterest)
		const originalMonths = loanYears * 12
		const actualMonths = schedule.length
		const monthsSaved = originalMonths - actualMonths

		return {
			paidPrincipal,
			paidInterest,
			remainingPrincipal,
			savedInterest,
			actualMonths,
			originalMonths,
			monthsSaved
		}
	}, [actualRun, baseRun, monthsPaid, loanAmount, loanYears])

	const chartData = useMemo(() => {
		if (!actualRun) return null
		const yData: Record<string, { p: number; i: number }> = {}
		actualRun.schedule.forEach(r => {
			const y = r.date.split('-')[0]
			if (!yData[y]) yData[y] = { p: 0, i: 0 }
			yData[y].p += r.principal + r.prepaymentAmount
			yData[y].i += r.interest
		})

		const labels = Object.keys(yData).map(y => y + '年')
		return {
			labels,
			datasets: [
				{
					label: '偿还本金 (含提前)',
					data: Object.values(yData).map(d => d.p),
					backgroundColor: '#38bdf8',
					stack: 'stack0'
				},
				{
					label: '支付利息',
					data: Object.values(yData).map(d => d.i),
					backgroundColor: '#fb923c',
					stack: 'stack0'
				}
			]
		}
	}, [actualRun])

	const getCurrentYearMonth = () => {
		const d = new Date()
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
	}

	// --- Handlers ---
	const handleAddLPR = () => {
		if (newLprDate && newLprRate !== '' && !isNaN(Number(newLprRate))) {
			if (editingLprId !== null) {
				setRateAdjustments(rateAdjustments.map(r => r.id === editingLprId ? { ...r, date: newLprDate, newRate: Number(newLprRate) } : r))
			} else {
				setRateAdjustments([...rateAdjustments, { id: Date.now(), date: newLprDate, newRate: Number(newLprRate) }])
			}
			setIsLprModalOpen(false)
		}
	}

	const handleDeleteLPR = (id: string | number) => {
		setRateAdjustments(rateAdjustments.filter(r => r.id !== id))
	}

	const handleEditLPR = (r: LPRAdjustment) => {
		setEditingLprId(r.id)
		setNewLprDate(r.date)
		setNewLprRate(r.newRate)
		setIsLprModalOpen(true)
	}

	const handleClearAllLPR = () => {
		if (confirm('确定要清空所有 LPR 重定价记录吗？')) {
			setRateAdjustments([])
		}
	}

	const handleAddPrepay = () => {
		const amountNum = Number(newPrepayAmount)
		if (newPrepayDate && !isNaN(amountNum) && amountNum > 0) {
			if (editingPrepayId !== null) {
				setPrepayments(prepayments.map(p => p.id === editingPrepayId ? { ...p, date: newPrepayDate, amount: amountNum * 10000, strategy: newPrepayStrategy } : p))
			} else {
				setPrepayments([...prepayments, { id: Date.now(), date: newPrepayDate, amount: amountNum * 10000, strategy: newPrepayStrategy }])
			}
			setIsPrepayModalOpen(false)
		}
	}

	const handleDeletePrepay = (id: string | number) => {
		setPrepayments(prepayments.filter(p => p.id !== id))
	}

	const handleEditPrepay = (p: Prepayment) => {
		setEditingPrepayId(p.id)
		setNewPrepayDate(p.date)
		setNewPrepayAmount(p.amount / 10000)
		setNewPrepayStrategy(p.strategy)
		setIsPrepayModalOpen(true)
	}

	const handleClearAllPrepay = () => {
		if (confirm('确定要清空所有提前还款记录吗？')) {
			setPrepayments([])
		}
	}

	return (
		<div className='min-h-screen py-6 px-4 sm:px-6 lg:px-8'>
			{/* Header Container */}
			<header className='max-w-[1400px] mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6'>
				<div className='flex items-center gap-4'>
					<div className='p-3 bg-sky-600 rounded-2xl shadow-lg shadow-sky-200'>
						<Calculator className='w-8 h-8 text-white' />
					</div>
					<div>
						<h1 className='text-3xl font-extrabold text-slate-900 tracking-tight'>
							房贷核心级测算系统 <span className='text-sky-600'></span>
						</h1>
						<p className='text-slate-500 font-medium mt-1'>解构银行底层算法：补偿平滑、LPR 分段、本金曲线。集成 ✨ AI 智能顾问。</p>
					</div>
				</div>
			</header>

			{/* Main Grid Layout */}
			<main className='max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start'>
				{/* Left Sidebar: Controls */}
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
											<option key={y} value={y}>
												{y} 年
											</option>
										))}
									</select>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-4'>
								<MonthPicker label='首期年月' value={startDate as string} onChange={setStartDate} />
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
								</div>
								
								<div className='flex items-center gap-2 mb-4'>
									<div className='flex-1'>
										<MonthPicker 
											value={addMonths(startDate as string, Number(monthsPaid) || 0)} 
											onChange={newDate => {
												const [sy, sm] = (startDate as string).split('-').map(Number)
												const [ny, nm] = newDate.split('-').map(Number)
												const diff = Math.max(0, (ny - sy) * 12 + (nm - sm))
												setMonthsPaid(diff)
											}} 
											className='!p-2.5 min-h-[44px]'
										/>
									</div>
									<div className='w-24 relative shrink-0'>
										<input 
											type='number' 
											min='0'
											value={monthsPaid} 
											onChange={e => setMonthsPaid(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))} 
											className='w-full p-2.5 pr-6 glass-card rounded-xl bg-white/50 font-bold text-center text-slate-800 input-focus no-spin' 
										/>
										<span className='absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold'>期</span>
									</div>
								</div>

								<input type='range' min='0' max={actualRun?.schedule.length || 360} value={Number(monthsPaid) || 0} onChange={e => setMonthsPaid(Number(e.target.value))} className='w-full accent-sky-600' />
							</div>
						</div>
					</div>

					<div className='glass-card rounded-3xl p-6'>
						<div className='flex items-center justify-between mb-5'>
							<h2 className='text-base font-bold flex items-center gap-2 text-slate-800'>
								<TrendingDown className='w-5 h-5 text-indigo-500' />
								LPR 记录
							</h2>
							<div className='flex items-center gap-2'>
								{rateAdjustments.length > 0 && (
									<button onClick={handleClearAllLPR} className='px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors'>
										清空
									</button>
								)}
								<button
									onClick={() => {
										setIsLprModalOpen(true)
										setEditingLprId(null)
										setNewLprDate(getCurrentYearMonth())
										setNewLprRate('')
									}}
									className='p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 hover:scale-105 transition-all'
								>
									<Plus className='w-4 h-4' />
								</button>
							</div>
						</div>
						<div className='space-y-2'>
							{rateAdjustments.length > 0 ? (
								rateAdjustments
									.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
									.map(r => (
										<div key={r.id} className='flex items-center justify-between p-3.5 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 group'>
											<div>
												<div className='font-bold text-indigo-900 text-sm'>{r.date}</div>
												<div className='text-indigo-600/80 text-xs font-medium'>重定价: {r.newRate}%</div>
											</div>
											<div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
												<button onClick={() => handleEditLPR(r)} className='text-indigo-400 hover:text-indigo-600 p-2 transition-colors'>
													<Edit2 className='w-4 h-4' />
												</button>
												<button onClick={() => handleDeleteLPR(r.id)} className='text-red-400 hover:text-red-600 p-2 transition-colors'>
													<Trash2 className='w-4 h-4' />
												</button>
											</div>
										</div>
									))
							) : (
								<div className='text-center py-6 text-xs text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl'>无记录</div>
							)}
						</div>
					</div>

					<div className='glass-card rounded-3xl p-6'>
						<div className='flex items-center justify-between mb-5'>
							<h2 className='text-base font-bold flex items-center gap-2 text-slate-800'>
								<Clock className='w-5 h-5 text-emerald-500' />
								提前还款记录
							</h2>
							<div className='flex items-center gap-2'>
								{prepayments.length > 0 && (
									<button onClick={handleClearAllPrepay} className='px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors'>
										清空
									</button>
								)}
								<button
									onClick={() => {
										setIsPrepayModalOpen(true)
										setEditingPrepayId(null)
										setNewPrepayDate(getCurrentYearMonth())
										setNewPrepayAmount(1)
										setNewPrepayStrategy('reduce_payment')
									}}
									className='p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 hover:scale-105 transition-all'
								>
									<Plus className='w-4 h-4' />
								</button>
							</div>
						</div>
						<div className='space-y-2'>
							{prepayments.length > 0 ? (
								prepayments
									.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
									.map(p => (
										<div key={p.id} className='flex items-center justify-between p-3.5 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 group'>
											<div>
												<div className='font-bold text-emerald-800 text-sm'>
													{p.date} 还{p.amount / 10000}万
												</div>
												<div className='text-emerald-600/70 text-[10px] font-bold uppercase tracking-tight'>
													{p.strategy === 'reduce_payment' ? '供减,期不变' : '供不变,期短'}
												</div>
											</div>
											<div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
												<button onClick={() => handleEditPrepay(p)} className='text-emerald-500 hover:text-emerald-700 p-2 transition-colors'>
													<Edit2 className='w-4 h-4' />
												</button>
												<button onClick={() => handleDeletePrepay(p.id)} className='text-red-400 hover:text-red-600 p-2 transition-colors'>
													<Trash2 className='w-4 h-4' />
												</button>
											</div>
										</div>
									))
							) : (
								<div className='text-center py-6 text-xs text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl'>无记录</div>
							)}
						</div>
					</div>
				</aside>

				{/* Right Content: Stats & Details */}
				<div className='space-y-8'>
					{/* Key Indicators Grid */}
					<div className='grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
						<div className='glass-card rounded-[28px] p-5 sm:p-6 transition-transform hover:scale-[1.02] overflow-hidden'>
							<div className='text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 truncate'>当前剩余本金</div>
							<div className='text-lg sm:text-xl xl:text-2xl font-black text-slate-800 break-all leading-tight'>{formatMoney(summary?.remainingPrincipal || 0).replace('¥', '')}</div>
							<div className='mt-3 inline-flex items-center text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase tracking-tighter'>Live Data</div>
						</div>
						<div className='glass-card rounded-[28px] p-5 sm:p-6 transition-transform hover:scale-[1.02] overflow-hidden'>
							<div className='text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 text-orange-400 truncate'>累计已还利息</div>
							<div className='text-lg sm:text-xl xl:text-2xl font-black text-orange-500 break-all leading-tight'>{formatMoney(summary?.paidInterest || 0).replace('¥', '')}</div>
							<div className='mt-3 inline-flex items-center text-[9px] font-bold px-2 py-0.5 bg-orange-50 text-orange-400 rounded-full uppercase tracking-tighter'>Accrued Interest</div>
						</div>
						<div className='glass-card rounded-[28px] p-5 sm:p-6 transition-transform hover:scale-[1.02] overflow-hidden'>
							<div className='text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 text-sky-400 truncate'>累计已还本金</div>
							<div className='text-lg sm:text-xl xl:text-2xl font-black text-sky-600 break-all leading-tight'>{formatMoney(summary?.paidPrincipal || 0).replace('¥', '')}</div>
							<div className='mt-3 inline-flex items-center text-[9px] font-bold px-2 py-0.5 bg-sky-50 text-sky-500 rounded-full uppercase tracking-tighter'>Principal Paid</div>
						</div>
						<div className='bg-emerald-600 rounded-[28px] p-5 sm:p-6 shadow-xl shadow-emerald-200/50 transition-transform hover:scale-[1.02] relative overflow-hidden group'>
							<div className='relative z-10 text-[10px] sm:text-xs font-bold text-emerald-100 uppercase tracking-widest mb-2 sm:mb-3 truncate'>预计总省利息</div>
							<div className='relative z-10 text-lg sm:text-xl xl:text-2xl font-black text-white break-all leading-tight'>{formatMoney(summary?.savedInterest || 0).replace('¥', '')}</div>
							<div className='relative z-10 mt-3 inline-flex items-center text-[9px] font-bold px-2 py-0.5 bg-emerald-500 text-white rounded-full uppercase tracking-tighter'>Savings Score</div>
							<TrendingDown className='absolute right-[-15px] bottom-[-15px] w-24 h-24 text-white opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500' />
						</div>
					</div>

					<div className='glass-card rounded-[32px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8'>
						<div className='flex items-center gap-4 sm:gap-6 w-full md:w-auto'>
							<div className='w-12 h-12 sm:w-16 sm:h-16 bg-sky-50 rounded-2xl flex items-center justify-center shrink-0'>
								<Clock className='w-6 h-6 sm:w-8 sm:h-8 text-sky-600' />
							</div>
							<div className='min-w-0'>
								<div className='text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest truncate'>实际结清周期</div>
								<div className='text-2xl sm:text-3xl xl:text-4xl font-black text-slate-800 mt-1 truncate'>
									{summary?.actualMonths} <span className='text-lg sm:text-xl font-bold text-slate-300'>Months</span>
								</div>
							</div>
						</div>
						<div className='flex items-center gap-6 sm:gap-8 md:text-right w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100'>
							<div className='min-w-0'>
								<div className='text-xs sm:text-sm font-bold text-slate-400 mb-1'>原计划周期</div>
								<div className='text-lg sm:text-xl font-bold text-slate-700 truncate'>{summary?.originalMonths} 期</div>
							</div>
							{summary && summary.monthsSaved > 0 && (
								<div className='bg-emerald-50 text-emerald-700 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-emerald-100 shrink-0'>
									<div className='text-[9px] font-black uppercase tracking-widest mb-0.5'>Time Saved</div>
									<div className='text-sm sm:text-base font-black leading-none'>提前 {summary.monthsSaved} 个月</div>
								</div>
							)}
						</div>
					</div>

					{actualRun && summary && (
						<AIAdvisor
							data={{
								loanAmount: Number(loanAmount) || 0,
								annualRate: Number(annualRate) || 0,
								method: repaymentMethod,
								monthsPaid: Number(monthsPaid) || 0,
								totalMonths: summary.actualMonths,
								remainingPrincipal: summary.remainingPrincipal,								paidInterest: summary.paidInterest,
								savedInterest: summary.savedInterest,
								prepaymentsCount: prepayments.length,
								rateAdjustmentsCount: rateAdjustments.length
							}}
						/>
					)}

					<div className='glass-card rounded-[40px] p-8'>
						<h3 className='text-xl font-black text-slate-800 mb-8 flex items-center gap-3'>
							<BarChart3 className='w-6 h-6 text-indigo-500' />
							年度还款资产结构
						</h3>
						<div className='h-[400px]'>
							{chartData && (
								<Bar
									data={chartData}
									options={{
										responsive: true,
										maintainAspectRatio: false,
										plugins: {
											legend: { position: 'bottom' as const, labels: { usePointStyle: true, boxWidth: 8, font: { weight: 'bold' } } },
											tooltip: {
												backgroundColor: '#fff',
												titleColor: '#1e293b',
												bodyColor: '#475569',
												borderColor: '#e2e8f0',
												borderWidth: 1,
												padding: 12,
												cornerRadius: 12,
												callbacks: { label: c => `${c.dataset.label}: ${formatMoney(c.parsed.y || 0)}` }
											}
											},
											scales: {
											x: { stacked: true, grid: { display: false }, ticks: { font: { weight: 'bold' } } },
											y: { stacked: true, border: { display: false }, ticks: { font: { weight: 500 }, callback: v => (Number(v) / 10000).toFixed(0) + '万' } }
											}									}}
								/>
							)}
						</div>
					</div>

					<div className='glass-card rounded-[40px] overflow-hidden flex flex-col h-[700px]'>
						<div className='p-8 border-b border-slate-100 bg-white/40 flex justify-between items-center'>
							<div>
								<h3 className='text-xl font-black text-slate-800 flex items-center gap-3'>
									<Calendar className='w-6 h-6 text-slate-400' />
									逐月还款流水明细
								</h3>
							</div>
							<div className='bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest border border-sky-100 uppercase'>{actualRun?.schedule.length} Periods Total</div>
						</div>
						<div className='overflow-x-auto overflow-y-auto flex-1 no-scrollbar'>
							<table className='w-full text-sm text-left whitespace-nowrap'>
								<thead className='text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 sticky top-0 z-20 backdrop-blur-md'>
									<tr>
										<th className='px-6 py-5'>期数</th>
										<th className='px-6 py-5'>账单日期</th>
										<th className='px-6 py-5 text-center'>执行利率</th>
										<th className='px-6 py-5 text-center'>计息天数</th>
										<th className='px-6 py-5 text-right'>当月总支出</th>
										<th className='px-6 py-5 text-right text-sky-600'>还本金</th>
										<th className='px-6 py-5 text-right text-orange-500'>还利息</th>
										<th className='px-6 py-5 text-right'>剩余本金</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-slate-50'>
									{actualRun?.schedule.map((row, idx) => {
										const currentMonthsPaidNum = Number(monthsPaid) || 0
										const isHistory = idx < currentMonthsPaidNum
										const isNow = idx === currentMonthsPaidNum

										return (
											<React.Fragment key={idx}>
												{isNow && (
													<tr className='sticky top-[58px] z-10'>
														<td colSpan={8} className='px-6 py-4 bg-sky-600 text-center text-xs text-white font-black tracking-[0.2em] shadow-lg uppercase'>
															上方为历史数据 | 下方为未来预测数据
														</td>
													</tr>
												)}
												<tr className={cn('hover:bg-sky-50/50 transition-all duration-150 group', isHistory && 'opacity-40 grayscale-[0.2]', row.isSpecial && 'bg-indigo-50/10')}>
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
													<td className='px-6 py-5 text-right font-black text-slate-800 text-base'>{formatMoney(row.payment).replace('¥', '')}</td>
													<td className='px-6 py-5 text-right font-bold text-sky-600/80'>{formatMoney(row.principal).replace('¥', '')}</td>
													<td className='px-6 py-5 text-right font-bold text-orange-500/80'>{formatMoney(row.interest).replace('¥', '')}</td>
													<td className='px-6 py-5 text-right font-bold text-slate-500'>{formatMoney(row.remainingPrincipal).replace('¥', '')}</td>
												</tr>
												{row.note && (
													<tr className='bg-indigo-50/20'>
														<td colSpan={8} className='px-6 py-3 text-right text-indigo-600 text-[10px] font-black uppercase tracking-widest'>
															<span className='mr-2 inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse' />
															{row.note}
														</td>
													</tr>
												)}
											</React.Fragment>
										)
									})}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</main>

			{/* LPR Modal */}
			{isLprModalOpen && (
				<div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4'>
					<div className='glass-card bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 transform animate-in fade-in zoom-in duration-200'>
						<h3 className='text-xl font-black text-slate-800 mb-6 flex items-center gap-2'>
							<TrendingDown className='w-6 h-6 text-indigo-500' />
							LPR 重定价
						</h3>
						<div className='space-y-5'>
							<MonthPicker label='生效年月' value={newLprDate} onChange={setNewLprDate} className='bg-slate-50' />
							<div>
								<label className='block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2'>新利率 (%)</label>
								<input
									type='number'
									step='0.01'
									value={newLprRate}
									onChange={e => setNewLprRate(Number(e.target.value))}
									className='w-full p-3.5 glass-card rounded-xl bg-slate-50 font-bold input-focus no-spin'
								/>
							</div>
						</div>
						<div className='flex gap-4 mt-8'>
							<button onClick={() => setIsLprModalOpen(false)} className='flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-all'>
								取消
							</button>
							<button onClick={handleAddLPR} className='flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all'>
								确认
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Prepay Modal */}
			{isPrepayModalOpen && (
				<div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4'>
					<div className='glass-card bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 transform animate-in fade-in zoom-in duration-200'>
						<h3 className='text-xl font-black text-slate-800 mb-6 flex items-center gap-2'>
							<Clock className='w-6 h-6 text-emerald-500' />
							添加提前还款
						</h3>
						<div className='space-y-5'>
							<MonthPicker label='还款年月' value={newPrepayDate} onChange={setNewPrepayDate} className='bg-slate-50' />
							<div>
								<label className='block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2'>还本金额 (万元)</label>
								<input
									type='number'
									step='1'
									placeholder='0'
									value={newPrepayAmount}
									onChange={e => setNewPrepayAmount(e.target.value)}
									className='w-full p-3.5 glass-card rounded-xl bg-slate-50 font-bold input-focus no-spin'
								/>
							</div>
							<div>
								<label className='block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2'>还款策略</label>
								<div className='space-y-3'>
									<label
										className={cn(
											'flex items-center p-4 border rounded-2xl cursor-pointer transition-all',
											newPrepayStrategy === 'reduce_payment' ? 'bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-50' : 'bg-white border-slate-100'
										)}
									>
										<input type='radio' name='prepayStrategy' checked={newPrepayStrategy === 'reduce_payment'} onChange={() => setNewPrepayStrategy('reduce_payment')} className='hidden' />
										<div className={cn('w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center', newPrepayStrategy === 'reduce_payment' ? 'border-emerald-600' : 'border-slate-300')}>
											{newPrepayStrategy === 'reduce_payment' && <div className='w-2 h-2 rounded-full bg-emerald-600' />}
										</div>
										<span className={cn('text-sm font-bold', newPrepayStrategy === 'reduce_payment' ? 'text-emerald-700' : 'text-slate-500')}>月供减少，期限不变 (缓解压力)</span>
									</label>
									<label
										className={cn(
											'flex items-center p-4 border rounded-2xl cursor-pointer transition-all',
											newPrepayStrategy === 'shorten_term' ? 'bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-50' : 'bg-white border-slate-100'
										)}
									>
										<input type='radio' name='prepayStrategy' checked={newPrepayStrategy === 'shorten_term'} onChange={() => setNewPrepayStrategy('shorten_term')} className='hidden' />
										<div className={cn('w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center', newPrepayStrategy === 'shorten_term' ? 'border-emerald-600' : 'border-slate-300')}>
											{newPrepayStrategy === 'shorten_term' && <div className='w-2 h-2 rounded-full bg-emerald-600' />}
										</div>
										<span className={cn('text-sm font-bold', newPrepayStrategy === 'shorten_term' ? 'text-emerald-700' : 'text-slate-500')}>月供不变，缩短期限 (最省利息)</span>
									</label>
								</div>
							</div>
						</div>
						<div className='flex gap-4 mt-8'>
							<button onClick={() => setIsPrepayModalOpen(false)} className='flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-all'>
								取消
							</button>
							<button onClick={handleAddPrepay} className='flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all'>
								确认
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default App
