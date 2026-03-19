export const exportToCSV = (data: any[], fileName: string) => {
  if (!data || data.length === 0) return;

  const headers = ['期数', '账单日期', '执行利率(%)', '计息天数', '当月总支出(元)', '还本金(元)', '还利息(元)', '剩余本金(元)', '备注'];
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => {
      // 将 YYYY-MM 转换为 YYYY年MM月
      const dateParts = row.date.split('-');
      const chineseDate = dateParts.length === 2 ? `${dateParts[0]}年${dateParts[1]}月` : row.date;
      
      return [
        row.period,
        chineseDate,
        row.rate,
        row.days,
        row.payment.toFixed(2),
        (row.principal + (row.prepaymentAmount || 0)).toFixed(2),
        row.interest.toFixed(2),
        row.remainingPrincipal.toFixed(2),
        `"${row.note || ''}${row.impactValue ? ` (利息节省: ¥${row.impactValue.toFixed(2)})` : ''}"`
      ].join(',');
    })
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const d = new Date();
  const dateStr = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
