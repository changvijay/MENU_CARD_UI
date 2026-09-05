import * as XLSX from 'xlsx';

/**
 * Utility to export business analytics and reports data to Excel (.xlsx) and CSV
 */

export const exportReportToExcel = (data, rangeInfo) => {
  if (!data) return;

  const workbook = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summaryData = [
    ['Metric', 'Value'],
    ['Report Date Range', rangeInfo || 'N/A'],
    ['Total Revenue', data.summary?.total_revenue ?? 0],
    ['Total Orders', data.summary?.total_orders ?? 0],
    ['Average Order Value (AOV)', data.summary?.avg_order_value ?? 0],
    ['Completed Orders', data.summary?.completed_orders ?? 0],
    ['Cancelled Orders', data.summary?.cancelled_orders ?? 0],
    ['Cancellation Rate (%)', data.summary?.cancellation_rate_pct ? `${data.summary.cancellation_rate_pct.toFixed(2)}%` : '0%'],
    ['Total Taxes', data.summary?.total_taxes ?? 0],
    ['Total Discounts', data.summary?.total_discounts ?? 0],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

  // 2. Revenue Trend Sheet
  if (data.revenue_trend && data.revenue_trend.length > 0) {
    const trendData = data.revenue_trend.map((row) => ({
      Period: row.period,
      'Revenue ($)': row.revenue,
      'Order Count': row.order_count,
      'Average Order Value ($)': row.aov,
    }));
    const trendSheet = XLSX.utils.json_to_sheet(trendData);
    XLSX.utils.book_append_sheet(workbook, trendSheet, 'Revenue & Orders Trend');
  }

  // 3. Top Selling Items Sheet
  if (data.top_items?.top_selling && data.top_items.top_selling.length > 0) {
    const topItemsData = data.top_items.top_selling.map((item, index) => ({
      Rank: index + 1,
      'Item ID': item.food_item_id,
      'Item Name': item.food_name || `Item #${item.food_item_id}`,
      'Total Quantity Sold': item.total_qty,
      'Total Revenue ($)': item.total_revenue,
      'Revenue Share (%)': item.revenue_share_pct ? `${item.revenue_share_pct.toFixed(2)}%` : '0%',
    }));
    const topItemsSheet = XLSX.utils.json_to_sheet(topItemsData);
    XLSX.utils.book_append_sheet(workbook, topItemsSheet, 'Top Selling Items');
  }

  // 4. Least Selling Items Sheet
  if (data.top_items?.least_selling && data.top_items.least_selling.length > 0) {
    const leastItemsData = data.top_items.least_selling.map((item, index) => ({
      Rank: index + 1,
      'Item ID': item.food_item_id,
      'Item Name': item.food_name || `Item #${item.food_item_id}`,
      'Total Quantity Sold': item.total_qty,
      'Total Revenue ($)': item.total_revenue,
      'Revenue Share (%)': item.revenue_share_pct ? `${item.revenue_share_pct.toFixed(2)}%` : '0%',
    }));
    const leastSheet = XLSX.utils.json_to_sheet(leastItemsData);
    XLSX.utils.book_append_sheet(workbook, leastSheet, 'Least Selling Items');
  }

  // 5. Category Revenue Sheet
  if (data.top_categories && data.top_categories.length > 0) {
    const categoryData = data.top_categories.map((cat) => ({
      'Category Name': cat.category_name,
      'Total Quantity': cat.total_qty,
      'Total Revenue ($)': cat.total_revenue,
    }));
    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Category Revenue');
  }

  // 6. Cash Flow Sheet
  if (data.cash_flow?.summary) {
    const cfRows = [
      ['Cash Flow Category', 'Amount ($)'],
      ['Total Income', data.cash_flow.summary.income ?? 0],
      ['Total Expenses', data.cash_flow.summary.expense ?? 0],
      ['Net Cash Flow', data.cash_flow.summary.net_cash_flow ?? 0],
      ['', ''],
      ['Top Categories', 'Amount ($)'],
    ];
    (data.cash_flow.top_categories || []).forEach((c) => {
      cfRows.push([c.category, c.amount]);
    });
    const cfSheet = XLSX.utils.aoa_to_sheet(cfRows);
    XLSX.utils.book_append_sheet(workbook, cfSheet, 'Cash Flow Summary');
  }

  // 7. Customer Analytics Sheet
  if (data.customer_behavior) {
    const cb = data.customer_behavior;
    const customerData = [
      ['Metric', 'Value'],
      ['Total Customer Orders', cb.customer_orders ?? 0],
      ['Guest Orders', cb.guest_orders ?? 0],
      ['Unique Customers', cb.unique_customers ?? 0],
      ['Repeat Customers', cb.repeat_customers ?? 0],
      ['Repeat Orders', cb.repeat_orders ?? 0],
      ['Average Orders per Customer', cb.avg_orders_per_customer ?? 0],
      ['Repeat Customer Rate (%)', cb.repeat_customer_rate_pct ? `${cb.repeat_customer_rate_pct.toFixed(2)}%` : '0%'],
    ];
    const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
    XLSX.utils.book_append_sheet(workbook, customerSheet, 'Customer Analytics');
  }

  // Generate filename with date
  const filename = `Business_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

export const exportReportToCSV = (data, reportType = 'summary') => {
  if (!data) return;

  let sheetData = [];
  let filename = `Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;

  if (reportType === 'trend' && data.revenue_trend) {
    sheetData = data.revenue_trend.map((row) => ({
      Period: row.period,
      Revenue: row.revenue,
      OrderCount: row.order_count,
      AOV: row.aov,
    }));
  } else if (reportType === 'items' && data.top_items?.top_selling) {
    sheetData = data.top_items.top_selling.map((item, i) => ({
      Rank: i + 1,
      ItemID: item.food_item_id,
      ItemName: item.food_name || `Item #${item.food_item_id}`,
      QuantitySold: item.total_qty,
      Revenue: item.total_revenue,
      RevenueSharePct: item.revenue_share_pct,
    }));
  } else {
    // Default summary
    sheetData = [
      { Metric: 'Total Revenue', Value: data.summary?.total_revenue ?? 0 },
      { Metric: 'Total Orders', Value: data.summary?.total_orders ?? 0 },
      { Metric: 'AOV', Value: data.summary?.avg_order_value ?? 0 },
      { Metric: 'Completed Orders', Value: data.summary?.completed_orders ?? 0 },
      { Metric: 'Cancelled Orders', Value: data.summary?.cancelled_orders ?? 0 },
    ];
  }

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
