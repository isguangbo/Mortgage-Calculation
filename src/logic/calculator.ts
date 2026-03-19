export interface LPRAdjustment {
  id: string | number;
  date: string; // YYYY-MM
  newRate: number;
}

export interface Prepayment {
  id: string | number;
  date: string; // YYYY-MM
  amount: number;
  strategy: 'reduce_payment' | 'shorten_term';
}

export interface RepaymentRow {
  period: number;
  date: string;
  periodStr: string;
  rate: number;
  days: number;
  payment: number;
  principal: number;
  interest: number;
  remainingPrincipal: number;
  isSpecial: boolean;
  prepaymentAmount: number;
  note: string;
  impactValue?: number; // 节省的未来利息总额
  eventId?: string; // 用于 UI 锚定定位
}

export type InterestRule = 'bank_standard' | 'monthly' | 'daily';
export type RepaymentMethod = '等额本息' | '等额本金';

export const addMonths = (dateStr: string, months: number): string => {
  const [y, m] = dateStr.split('-').map(Number);
  const d = new Date(y, m - 1 + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const formatMMDD = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 辅助计算：在特定状态下，剩余期数的总利息（影子计算）
function calculateRemainingInterest(p: number, r: number, n: number, method: RepaymentMethod): number {
  if (p <= 0 || n <= 0 || r < 0) return 0;
  const mr = r / 100 / 12;
  if (method === '等额本息') {
    if (mr === 0) return 0;
    const payment = (p * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
    return payment * n - p;
  } else {
    // 等额本金总利息 = (n + 1) * p * mr / 2
    return (n + 1) * p * mr / 2;
  }
}

export function calculateMortgage(
  loanAmountWan: number,
  initRate: number,
  years: number,
  startDateStr: string,
  payDay: number,
  dailyBasis: 360 | 365,
  rule: InterestRule,
  method: RepaymentMethod,
  activePrepayments: Prepayment[],
  activeRates: LPRAdjustment[]
) {
  const amount = loanAmountWan * 10000;
  let months = years * 12;
  let currentPrincipal = amount;
  let currentMonthsRemaining = months;
  let currentRate = initRate;
  let oldRate = currentRate;
  let currentMonthlyRate = currentRate / 100 / 12;

  let currentMonthlyPrincipal_EP = currentPrincipal / currentMonthsRemaining;
  let currentPayment_EPI = (currentPrincipal * currentMonthlyRate * Math.pow(1 + currentMonthlyRate, currentMonthsRemaining)) / 
                           (Math.pow(1 + currentMonthlyRate, currentMonthsRemaining) - 1);

  let schedule: RepaymentRow[] = [];
  let totalInterest = 0;
  
  const prepayMap: Record<string, Prepayment[]> = {};
  activePrepayments.forEach(p => { (prepayMap[p.date] = prepayMap[p.date] || []).push(p); });
  
  const rateMap: Record<string, LPRAdjustment[]> = {};
  activeRates.forEach(r => { (rateMap[r.date] = rateMap[r.date] || []).push(r); });

  let [sY, sM] = startDateStr.split('-').map(Number);
  let prevActualDay = Math.min(payDay, new Date(sY, sM - 1, 0).getDate());

  let i = 1;
  while (currentPrincipal > 0.01 && i <= months * 3 && currentMonthsRemaining > 0) {
    let currentDateStr = addMonths(startDateStr, i - 1);
    let [cY, cM] = currentDateStr.split('-').map(Number);
    
    let lastDayOfMonth = new Date(cY, cM, 0).getDate();
    let currActualDay = Math.min(payDay, lastDayOfMonth);
    
    let prevDObj = new Date(cY, cM - 2, prevActualDay);
    let currDObj = new Date(cY, cM - 1, currActualDay);
    let physicalDays = Math.round((currDObj.getTime() - prevDObj.getTime()) / 86400000);
    
    let noteArr: string[] = [];
    let isAnomalyMonth = false;
    let impactValue = 0;
    let eventId = '';

    // 1. LPR Check
    if (rateMap[currentDateStr]) {
      const adjustment = rateMap[currentDateStr][rateMap[currentDateStr].length - 1];
      const newRate = adjustment.newRate;
      if (currentRate !== newRate) {
        // 影子计算：如果不调利率，剩余利息是多少？
        const interestOld = calculateRemainingInterest(currentPrincipal, currentRate, currentMonthsRemaining, method);
        const interestNew = calculateRemainingInterest(currentPrincipal, newRate, currentMonthsRemaining, method);
        impactValue += (interestOld - interestNew);
        eventId = `lpr-${adjustment.id}`;

        oldRate = currentRate; currentRate = newRate;
        currentMonthlyRate = currentRate / 100 / 12;
        isAnomalyMonth = true;
        noteArr.push(`📉重定价${currentRate}%`);
      }
    }

    // 2. Interest Calculation
    let interest = 0;
    let calcDays = 30;

    if (isAnomalyMonth && payDay > 1) {
      const changeD = new Date(cY, cM - 1, 1);
      if (changeD > prevDObj && changeD <= currDObj) {
        let oldD = Math.max(0, Math.round((changeD.getTime() - prevDObj.getTime()) / 86400000));
        let newD = Math.max(0, Math.round((currDObj.getTime() - changeD.getTime()) / 86400000));
        calcDays = oldD + newD;
        interest = currentPrincipal * ((oldRate / 100 / dailyBasis) * oldD + (currentRate / 100 / dailyBasis) * newD);
        noteArr.push(`分段(${oldD}天老+${newD}天新)`);
      } else {
        if (rule === 'bank_standard') calcDays = 30 + currActualDay - prevActualDay;
        else if (rule === 'daily') calcDays = physicalDays;
        interest = currentPrincipal * (currentRate / 100 / dailyBasis) * calcDays;
      }
    } else {
      if (rule === 'bank_standard') {
        calcDays = 30 + currActualDay - prevActualDay;
        interest = currentPrincipal * (currentRate / 100 / 360) * calcDays; 
      } else if (rule === 'daily') {
        calcDays = physicalDays;
        interest = currentPrincipal * (currentRate / 100 / dailyBasis) * calcDays;
      } else {
        calcDays = 30;
        interest = currentPrincipal * currentMonthlyRate;
      }
    }

    // 3. Principal Calculation
    let theoreticalInterest = currentPrincipal * currentMonthlyRate;
    let theoreticalPrincipal = 0;
    
    if (method === '等额本息') {
      if (isAnomalyMonth) {
        const p = currentPrincipal;
        const r = currentMonthlyRate;
        const n = currentMonthsRemaining;
        if (r > 0) currentPayment_EPI = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        else currentPayment_EPI = p / n;
        theoreticalPrincipal = currentPayment_EPI - (currentPrincipal * currentMonthlyRate);
      } else {
        theoreticalPrincipal = currentPayment_EPI - theoreticalInterest;
      }
    } else {
      if (isAnomalyMonth) currentMonthlyPrincipal_EP = currentPrincipal / currentMonthsRemaining;
      theoreticalPrincipal = currentMonthlyPrincipal_EP;
    }

    let principal = theoreticalPrincipal;
    if (principal > currentPrincipal || currentMonthsRemaining === 1) principal = currentPrincipal; 
    
    let payment = principal + interest;
    currentPrincipal -= principal; 
    totalInterest += interest; 

    // 4. Prepayment Handling
    let totalP = 0;
    if (prepayMap[currentDateStr]) {
      let strategy: Prepayment['strategy'] = 'reduce_payment';
      // 影子计算：如果不提前还款，剩余利息是多少？
      const interestBefore = calculateRemainingInterest(currentPrincipal + principal, currentRate, currentMonthsRemaining, method);
      
      prepayMap[currentDateStr].forEach(p => {
        let pAmt = Math.min(p.amount, currentPrincipal);
        totalP += pAmt; currentPrincipal -= pAmt; strategy = p.strategy;
        eventId = `prepay-${p.id}`;
      });

      if (totalP > 0) {
        isAnomalyMonth = true; 
        if (currentPrincipal > 0.01) {
          let newRemainingMonths = currentMonthsRemaining - 1;
          if (strategy === 'reduce_payment') {
            if (method === '等额本金') currentMonthlyPrincipal_EP = currentPrincipal / (currentMonthsRemaining - 1);
            else currentPayment_EPI = (currentPrincipal * currentMonthlyRate * Math.pow(1 + currentMonthlyRate, currentMonthsRemaining - 1)) / (Math.pow(1 + currentMonthlyRate, currentMonthsRemaining - 1) - 1);
          } else {
            if (method === '等额本息') newRemainingMonths = Math.ceil(-Math.log(1 - (currentPrincipal * currentMonthlyRate) / currentPayment_EPI) / Math.log(1 + currentMonthlyRate));
            else newRemainingMonths = Math.ceil(currentPrincipal / currentMonthlyPrincipal_EP);
            currentMonthsRemaining = newRemainingMonths + 1; // 补偿下一轮的 --
          }
          const interestAfter = calculateRemainingInterest(currentPrincipal, currentRate, newRemainingMonths, method);
          impactValue += (interestBefore - (interestAfter + interest)); // 近似节省利息
        } else {
          impactValue += (interestBefore - interest);
        }
        noteArr.push(`💰提前还本:${totalP/10000}万`);
      }
    }

    schedule.push({
      period: i, date: currentDateStr, periodStr: `${formatMMDD(prevDObj)}至${formatMMDD(currDObj)}`,
      rate: currentRate, days: calcDays, payment, principal, interest,
      remainingPrincipal: Math.max(0, currentPrincipal), isSpecial: isAnomalyMonth,
      prepaymentAmount: totalP, note: noteArr.join(' | '),
      impactValue: impactValue !== 0 ? impactValue : undefined,
      eventId: eventId || undefined
    });

    prevActualDay = currActualDay; 
    currentMonthsRemaining--; 
    i++;
  }
  return { schedule, totalInterest };
}
