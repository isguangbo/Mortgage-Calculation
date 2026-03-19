import React, { useState, useMemo } from 'react'
import { Calculator } from 'lucide-react'

// Core Logic
import { calculateMortgage, Prepayment, LPRAdjustment, RepaymentMethod, InterestRule, addMonths } from './logic/calculator'

// Components
import AIAdvisor from './components/AIAdvisor'
import DeepInsights from './components/DeepInsights'
import FreedomCountdown from './components/FreedomCountdown'
import SummaryGrid from './components/SummaryGrid'
import RepaymentTimeline from './components/RepaymentTimeline'
import AnnualRepaymentChart from './components/AnnualRepaymentChart'
import RepaymentDetailsTable from './components/RepaymentDetailsTable'
import LoanConfigSidebar from './components/LoanConfigSidebar'

// Modals
import LPRModal from './components/modals/LPRModal'
import PrepaymentModal from './components/modals/PrepaymentModal'

// Utils
import { getCurrentYearMonth } from './utils/date'
import { formatMoney } from './utils/format'

const App: React.FC = () => {
	// --- Core States ---
	const [loanAmount, setLoanAmount] = useState<number | string>(133)
	const [annualRate, setAnnualRate] = useState<number | string>(4.1)
	const [loanYears, setLoanYears] = useState<number>(30)
	const [startDate, setStartDate] = useState<string>('2023-01')
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
	const [scrollToEventId, setScrollToEventId] = useState<string | undefined>(undefined)

	// --- Modal States ---
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
		schedule.forEach((row, idx) => {
			if (idx < currentMonthsPaid) {
				paidPrincipal += row.principal + row.prepaymentAmount
				paidInterest += row.interest
			}
		})

		const remainingPrincipal = currentMonthsPaid === 0 ? (Number(loanAmount) || 0) * 10000 : (schedule[currentMonthsPaid - 1]?.remainingPrincipal || 0)
		const savedInterest = Math.max(0, baseRun.totalInterest - actualRun.totalInterest)
		const remainingInterest = Math.max(0, actualRun.totalInterest - paidInterest)
		
		const lastRow = schedule[schedule.length - 1]
		const finalDate = lastRow ? lastRow.date : ''
		
		const currentDateStr = addMonths(startDate, currentMonthsPaid)
		const [cY, cM] = currentDateStr.split('-').map(Number)
		const [fY, fM] = finalDate.split('-').map(Number)
		
		const simulatedNow = new Date(cY, cM - 1, Number(paymentDay) || 1)
		const targetDate = new Date(fY, fM - 1, Number(paymentDay) || 1)
		const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - simulatedNow.getTime()) / (1000 * 60 * 60 * 24)))
		const totalPrincipal = (Number(loanAmount) || 0) * 10000

		return {
			paidPrincipal, paidInterest, remainingPrincipal, remainingInterest, savedInterest,
			totalActualMonths: schedule.length,
			remainingMonths: Math.max(0, schedule.length - currentMonthsPaid),
			originalMonths: loanYears * 12, 
			monthsSaved: (loanYears * 12) - schedule.length,
			daysRemaining, 
			debtPaidPercent: totalPrincipal > 0 ? (paidPrincipal / totalPrincipal) * 100 : 0, 
			finalDate
		}
	}, [actualRun, baseRun, monthsPaid, loanAmount, loanYears, paymentDay, startDate])

	// --- Handlers ---
	const handleLPRConfirm = () => {
		if (newLprDate && newLprRate !== '' && !isNaN(Number(newLprRate))) {
			if (editingLprId !== null) {
				setRateAdjustments(rateAdjustments.map(r => r.id === editingLprId ? { ...r, date: newLprDate, newRate: Number(newLprRate) } : r))
			} else {
				setRateAdjustments([...rateAdjustments, { id: Date.now(), date: newLprDate, newRate: Number(newLprRate) }])
			}
			setIsLprModalOpen(false)
		}
	}

	const handlePrepayConfirm = () => {
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

	return (
		<div className='min-h-screen py-6 px-4 sm:px-6 lg:px-8'>
			<header className='max-w-[1400px] mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6'>
				<div className='flex items-center gap-4'>
					<div className='p-3 bg-sky-600 rounded-2xl shadow-lg shadow-sky-200'><Calculator className='w-8 h-8 text-white' /></div>
					<div>
						<h1 className='text-3xl font-extrabold text-slate-900 tracking-tight'>房贷还款测算系统</h1>
						<p className='text-slate-500 font-medium mt-1'>解构银行底层算法：补偿平滑、LPR 分段、本金曲线。集成 ✨ AI 智能顾问。</p>
					</div>
				</div>
			</header>

			<main className='max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start'>
				<LoanConfigSidebar 
					loanAmount={loanAmount} setLoanAmount={setLoanAmount}
					annualRate={annualRate} setAnnualRate={setAnnualRate}
					loanYears={loanYears} setLoanYears={setLoanYears}
					startDate={startDate} setStartDate={setStartDate}
					paymentDay={paymentDay} setPaymentDay={setPaymentDay}
					repaymentMethod={repaymentMethod} setRepaymentMethod={setRepaymentMethod}
					interestRule={interestRule} setInterestRule={setInterestRule}
					dailyBasis={dailyBasis} setDailyBasis={setDailyBasis}
					monthsPaid={monthsPaid} setMonthsPaid={setMonthsPaid}
					maxMonths={actualRun?.schedule.length || 360}
					rateAdjustments={rateAdjustments} prepayments={prepayments}
					onAddLPR={() => { setIsLprModalOpen(true); setEditingLprId(null); setNewLprDate(getCurrentYearMonth()); setNewLprRate(''); }}
					onEditLPR={(r) => { setEditingLprId(r.id); setNewLprDate(r.date); setNewLprRate(r.newRate); setIsLprModalOpen(true); }}
					onDeleteLPR={(id) => setRateAdjustments(rateAdjustments.filter(r => r.id !== id))}
					onClearLPR={() => confirm('确定清空 LPR？') && setRateAdjustments([])}
					onAddPrepay={() => { setIsPrepayModalOpen(true); setEditingPrepayId(null); setNewPrepayDate(getCurrentYearMonth()); setNewPrepayAmount(1); setNewPrepayStrategy('reduce_payment'); }}
					onEditPrepay={(p) => { setEditingPrepayId(p.id); setNewPrepayDate(p.date); setNewPrepayAmount(p.amount/10000); setNewPrepayStrategy(p.strategy); setIsPrepayModalOpen(true); }}
					onDeletePrepay={(id) => setPrepayments(prepayments.filter(p => p.id !== id))}
					onClearPrepay={() => confirm('确定清空提前还款？') && setPrepayments([])}
					onJumpToEvent={(id) => {
						if (id === 'current') {
							setScrollToEventId(`period-${(Number(monthsPaid) || 0) + 1}`);
						} else {
							setScrollToEventId(id);
						}
						setTimeout(() => setScrollToEventId(undefined), 500);
					}}
				/>

				<div className='space-y-8'>
					{summary && (
						<FreedomCountdown 
							daysRemaining={summary.daysRemaining} debtPaidPercent={summary.debtPaidPercent}
							finalDate={summary.finalDate} actualMonths={summary.remainingMonths} monthsSaved={summary.monthsSaved}
						/>
					)}

					{summary && (
						<SummaryGrid 
							remainingPrincipal={summary.remainingPrincipal} remainingInterest={summary.remainingInterest}
							paidPrincipal={summary.paidPrincipal} paidInterest={summary.paidInterest} savedInterest={summary.savedInterest}
						/>
					)}

					{summary && (
						<RepaymentTimeline actualMonths={summary.totalActualMonths} originalMonths={summary.originalMonths} monthsSaved={summary.monthsSaved} />
					)}

					{actualRun && summary && (
						<AIAdvisor data={{
							loanAmount: Number(loanAmount) || 0, annualRate: Number(annualRate) || 0, method: repaymentMethod,
							monthsPaid: Number(monthsPaid) || 0, totalMonths: summary.totalActualMonths,
							remainingPrincipal: summary.remainingPrincipal, remainingInterest: summary.remainingInterest,
							paidInterest: summary.paidInterest, savedInterest: summary.savedInterest,
							prepaymentsCount: prepayments.length, rateAdjustmentsCount: rateAdjustments.length
						}} />
					)}

					{actualRun && summary && (
						<DeepInsights data={{
							loanAmount: Number(loanAmount) || 0, totalInterestBase: baseRun.totalInterest, totalInterestActual: actualRun.totalInterest,
							paidPrincipal: summary.paidPrincipal, paidInterest: summary.paidInterest,
							remainingPrincipal: summary.remainingPrincipal, remainingInterest: summary.remainingInterest,
							savedInterest: summary.savedInterest, schedule: actualRun.schedule, annualRate: Number(annualRate) || 0
						}} />
					)}

					{actualRun && <AnnualRepaymentChart schedule={actualRun.schedule} />}
					
					{actualRun && <RepaymentDetailsTable schedule={actualRun.schedule} monthsPaid={Number(monthsPaid) || 0} scrollToEventId={scrollToEventId} />}
				</div>
			</main>

			<LPRModal 
				isOpen={isLprModalOpen} onClose={() => setIsLprModalOpen(false)} 
				date={newLprDate} setDate={setNewLprDate} rate={newLprRate} setRate={setNewLprRate}
				onConfirm={handleLPRConfirm} isEditing={editingLprId !== null}
			/>

			<PrepaymentModal 
				isOpen={isPrepayModalOpen} onClose={() => setIsPrepayModalOpen(false)}
				date={newPrepayDate} setDate={setNewPrepayDate} amount={newPrepayAmount} setAmount={setNewPrepayAmount}
				strategy={newPrepayStrategy} setStrategy={setNewPrepayStrategy}
				onConfirm={handlePrepayConfirm} isEditing={editingPrepayId !== null}
			/>
		</div>
	)
}

export default App
