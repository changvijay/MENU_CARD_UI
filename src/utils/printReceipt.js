export const printReceipt = (order, tablesMap = {}) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  
  const formatPrice = (p) => `₹${(Number(p) || 0).toFixed(2)}`;
  
  // Format items
  const itemsHtml = order.items.map(item => `
    <tr class="item-row">
      <td class="item-name">
        ${item.foodItemName || item.name}
        ${item.specialRequest ? `<div class="item-notes">Note: ${item.specialRequest}</div>` : ''}
      </td>
      <td class="item-qty">${item.quantity}</td>
      <td class="item-price">${formatPrice(item.price != null ? item.price : (item.subtotal / Math.max(item.quantity, 1)))}</td>
      <td class="item-subtotal">${formatPrice(item.subtotal)}</td>
    </tr>
  `).join('');

  const tableInfo = order.tableId > 0 
    ? (tablesMap[order.tableId] 
        ? (tablesMap[order.tableId].toString().startsWith('T') ? tablesMap[order.tableId] : `T${tablesMap[order.tableId]}`) 
        : `T${order.tableId}`)
    : '';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - Order #${order.orderNumber}</title>
        <style>
          @page { margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            margin: 0; 
            padding: 10px; 
            width: 80mm; 
            box-sizing: border-box;
            color: #000;
            font-size: 12px;
          }
          .header { text-align: center; margin-bottom: 15px; }
          .header h1 { margin: 0; font-size: 18px; font-weight: bold; }
          .header h2 { margin: 5px 0 0; font-size: 14px; font-weight: normal; }
          .info { margin-bottom: 10px; font-size: 12px; line-height: 1.4; }
          .info-row { display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th { border-bottom: 1px dashed #000; border-top: 1px dashed #000; padding: 4px 0; text-align: right; font-weight: bold; font-size: 11px; }
          th.left { text-align: left; }
          th.center { text-align: center; }
          td { padding: 4px 0; vertical-align: top; text-align: right; font-size: 12px; }
          td.item-name { text-align: left; width: 45%; }
          td.item-qty { text-align: center; width: 15%; }
          td.item-price { width: 20%; }
          td.item-subtotal { width: 20%; }
          .item-notes { font-size: 10px; font-style: italic; margin-top: 2px; }
          .totals { border-top: 1px dashed #000; padding-top: 5px; }
          .totals-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
          .totals-row.grand { font-size: 14px; font-weight: bold; margin-top: 4px; border-top: 1px dashed #000; padding-top: 4px; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; font-style: italic; }
          .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CHAI SUTTA BAR</h1>
          <h2>Tax Invoice</h2>
        </div>
        
        <div class="info">
          <div class="info-row">
            <span>Order No: #${order.orderNumber}</span>
            <span>${(() => {
              const dateVal = order.createdAt || order.created_at || new Date();
              const safeDate = typeof dateVal === 'string' ? new Date(dateVal.replace(' ', 'T')) : new Date(dateVal);
              return isNaN(safeDate.getTime()) 
                ? new Date().toLocaleDateString('en-IN', {day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'})
                : safeDate.toLocaleDateString('en-IN', {day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'});
            })()}</span>
          </div>
          <div class="info-row">
            <span>Type: ${order.deliveryMode || 'Dine In'}</span>
            <span>${tableInfo ? 'Table: ' + tableInfo : ''}</span>
          </div>
          ${order.user?.name ? `<div class="info-row"><span>Customer: ${order.user.name}</span></div>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th class="left">Item</th>
              <th class="center">Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${formatPrice(order.totalAmount)}</span>
          </div>
          ${Number(order.discount) > 0 ? `
          <div class="totals-row">
            <span>Discount</span>
            <span>-${formatPrice(order.discount)}</span>
          </div>` : ''}
          ${Number(order.tax) > 0 ? `
          <div class="totals-row">
            <span>Tax</span>
            <span>${formatPrice(order.tax)}</span>
          </div>` : ''}
          <div class="totals-row grand">
            <span>Grand Total</span>
            <span>${formatPrice(order.finalAmount)}</span>
          </div>
        </div>

        ${order.notes ? `
        <div class="divider"></div>
        <div class="info">
          <strong>Note:</strong> ${order.notes}
        </div>
        ` : ''}

        <div class="footer">
          Thank you for your visit!<br>
          Please come again.
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for images/styles to load then print
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
};
