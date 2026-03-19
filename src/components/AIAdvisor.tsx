import React, { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

interface AIAdvisorProps {
	data: {
		loanAmount: number
		annualRate: number
		method: string
		monthsPaid: number
		totalMonths: number
		remainingPrincipal: number
		remainingInterest: number
		paidInterest: number
		savedInterest: number
		prepaymentsCount: number
		rateAdjustmentsCount: number
	}
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ data }) => {
	const [loading, setLoading] = useState(false)
	const [analysis, setAnalysis] = useState<string | null>(null)

	const formatMoney = (amount: number) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount)

	const handleAnalyze = async () => {
		setLoading(true)
		setAnalysis(null)

		// 优先从环境变量获取，如果在本地未配置环境变量，则回退到这里的硬编码（请勿将真实 Key 提交到代码库）
		const apiKey: string = import.meta.env.VITE_DASHSCOPE_API_KEY || ''

		const prepayText = data.prepaymentsCount > 0 ? `配置了 ${data.prepaymentsCount} 笔提前还款操作` : '当前暂无配置提前还款'
		const lprText = data.rateAdjustmentsCount > 0 ? `经历了 ${data.rateAdjustmentsCount} 次LPR下调或重定价` : '暂无LPR调整记录'

		const promptText = `作为一个资深的中国房贷理财顾问，请分析以下用户的房贷数据并给出专业建议：
      - 贷款总额: ${data.loanAmount} 万元
      - 初始年利率: ${data.annualRate}%
      - 还款方式: ${data.method}
      - 当前进度: 第 ${data.monthsPaid} 个月 / 实际需要共 ${data.totalMonths} 个月结清
      - 当前剩余未还本金: ${formatMoney(data.remainingPrincipal)}
      - 未来仍需支付的利息: ${formatMoney(data.remainingInterest)}
      - 已经支付给银行的利息: ${formatMoney(data.paidInterest)}
      - 历史操作记录: ${prepayText}，${lprText}
      - 因提前还款或LPR降息总共节省的未来利息: ${formatMoney(data.savedInterest)}

      请用简明扼要、专业且令人安心的语气（约150-250字），为用户总结当前的还款健康度，并给出未来是否建议继续攒钱提前还款的建议（考虑目前市场理财收益率普遍在 2.5%-3.5% 之间）。直接输出正文段落，不要输出大标题，可以适度使用emoji（如📊💡🛡️等）来提升阅读体验。`

		try {
			// 使用 Vite 代理路径
			const url = '/api/dashscope'
			const payload = {
				model: 'qwen-max', // 可选: qwen-max, qwen-plus, qwen-turbo
				input: {
					messages: [
						{ role: 'system', content: '你是资深中国房贷与理财分析师，擅长结合当前金融环境给出高情商、专业的财务建议。' },
						{ role: 'user', content: promptText }
					]
				},
				parameters: {
					result_format: 'message'
				}
			}

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify(payload)
			})

			if (!response.ok) {
				const errData = await response.json()
				throw new Error(errData.message || 'API Request Failed')
			}

			const result = await response.json()
			const text = result.output?.choices?.[0]?.message?.content || '抱歉，生成分析报告时出现错误。'
			setAnalysis(text)
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error)
			if (!apiKey || apiKey.trim() === '') {
				setAnalysis('⚠️ 未检测到 API Key。请在 src/components/AIAdvisor.tsx 中填入您的阿里云通义千问 API Key。')
			} else {
				setAnalysis(`⚠️ API 请求失败: ${message || '请检查网络连接或 API Key 是否有效'}`)
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='bg-gradient-to-r from-indigo-50 to-sky-50 p-6 rounded-2xl shadow-sm border border-indigo-100 flex flex-col relative overflow-hidden'>
			<div className='flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4'>
				<h3 className='text-base font-bold text-indigo-800 flex items-center gap-2'>
					<Sparkles className='w-5 h-5 text-indigo-500' />✨ AI 智能房贷顾问分析
				</h3>
				<button
					onClick={handleAnalyze}
					disabled={loading}
					className='bg-indigo-600 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-indigo-700 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50'
				>
					{!loading && <Sparkles className='w-4 h-4' />}
					{loading && <Loader2 className='w-4 h-4 animate-spin' />}
					基于当前数据生成分析报告
				</button>
			</div>

			{analysis && (
				<div className='text-sm text-slate-700 leading-relaxed mt-4 bg-white/60 p-4 rounded-xl border border-indigo-50 backdrop-blur-sm shadow-inner'>
					{analysis
						.split('\n')
						.filter(p => p.trim() !== '')
						.map((p, i) => (
							<p key={i} className='mb-2'>
								{p}
							</p>
						))}
				</div>
			)}

			{loading && (
				<div className='text-sm text-indigo-500 font-medium mt-4 flex items-center justify-center gap-2 py-4'>
					<Loader2 className='animate-spin h-5 w-5 text-indigo-600' />
					AI 顾问正在深度测算并撰写建议...
				</div>
			)}
		</div>
	)
}

export default AIAdvisor
