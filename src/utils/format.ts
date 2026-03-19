export const formatMoney = (amount: number) => 
  new Intl.NumberFormat('zh-CN', { 
    style: 'currency', 
    currency: 'CNY', 
    minimumFractionDigits: 2 
  }).format(amount);

export const formatMoneySimple = (amount: number) => 
  formatMoney(amount).replace('¥', '');

export const formatWan = (amount: number) => 
  (amount / 10000).toFixed(0) + '万';
