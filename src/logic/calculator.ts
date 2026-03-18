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
}

export type InterestRule = 'bank_standard' | 'monthly' | 'daily';
export type RepaymentMethod = '等额本息' | '等额本金';

export const addMonths = (dateStr: string, months: number): string => {
  const [y, m] = dateStr.split('-').map(Number);
  const d = new Date(y, m - 1 + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const formatMMDD = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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

    // 1. LPR Check
    if (rateMap[currentDateStr]) {
      const newRate = rateMap[currentDateStr][rateMap[currentDateStr].length - 1].newRate;
      if (currentRate !== newRate) {
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
        // 重算月供时，currentMonthsRemaining 代表的是本期（包含中）及其之后的总期数
        const p = currentPrincipal;
        const r = currentMonthlyRate;
        const n = currentMonthsRemaining;
        
        if (r > 0) {
          currentPayment_EPI = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        } else {
          currentPayment_EPI = p / n;
        }
        
        // 变动月的理论本金 = 本月重算的理论月供 - 全月新利息 (为了曲线平滑)
        theoreticalPrincipal = currentPayment_EPI - (currentPrincipal * currentMonthlyRate);
      } else {
        theoreticalPrincipal = currentPayment_EPI - theoreticalInterest;
      }
    } else {
      if (isAnomalyMonth) {
        currentMonthlyPrincipal_EP = currentPrincipal / currentMonthsRemaining;
      }
      theoreticalPrincipal = currentMonthlyPrincipal_EP;
    }

    let principal = theoreticalPrincipal;
    if (principal > currentPrincipal || currentMonthsRemaining === 1) {
      principal = currentPrincipal; 
    }
    
    let payment = principal + interest;

    currentPrincipal -= principal; 
    totalInterest += interest; 

    let rowData: RepaymentRow = {
      period: i, date: currentDateStr, periodStr: `${formatMMDD(prevDObj)}至${formatMMDD(currDObj)}`,
      rate: currentRate, days: calcDays, payment, principal, interest,
      remainingPrincipal: Math.max(0, currentPrincipal), isSpecial: isAnomalyMonth,
      prepaymentAmount: 0, note: noteArr.join(' | ')
    };

    // 4. Prepayment Handling
    if (prepayMap[currentDateStr]) {
      let totalP = 0, strategy: Prepayment['strategy'] = 'reduce_payment';
      prepayMap[currentDateStr].forEach(p => {
        let pAmt = Math.min(p.amount, currentPrincipal);
        totalP += pAmt; currentPrincipal -= pAmt; strategy = p.strategy;
      });
      if (totalP > 0) {
        rowData.isSpecial = true; 
        rowData.prepaymentAmount = totalP; 
        rowData.remainingPrincipal = Math.max(0, currentPrincipal);
        rowData.note = (rowData.note ? rowData.note + ' | ' : '') + `💰提前还本:${totalP/10000}万`;
        if (currentPrincipal > 0.01) {
          if (strategy === 'reduce_payment') {
            if (method === '等额本金') currentMonthlyPrincipal_EP = currentPrincipal / (currentMonthsRemaining - 1);
            else currentPayment_EPI = (currentPrincipal * currentMonthlyRate * Math.pow(1 + currentMonthlyRate, currentMonthsRemaining - 1)) / (Math.pow(1 + currentMonthlyRate, currentMonthsRemaining - 1) - 1);
          } else {
            if (method === '等额本息') currentMonthsRemaining = Math.ceil(-Math.log(1 - (currentPrincipal * currentMonthlyRate) / currentPayment_EPI) / Math.log(1 + currentMonthlyRate)) + 1;
            else currentMonthsRemaining = Math.ceil(currentPrincipal / currentMonthlyPrincipal_EP) + 1;
          }
        }
      }
    }

    schedule.push(rowData);
    prevActualDay = currActualDay; 
    currentMonthsRemaining--; 
    i++;
  }
  return { schedule, totalInterest };
}
