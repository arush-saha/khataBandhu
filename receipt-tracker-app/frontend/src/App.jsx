import React, { useState } from 'react';
import ReceiptScanner from './components/ReceiptScanner';

function App() {
  const [expenses, setExpenses] = useState([]);

  // Runs automatically when the backend returns data
  const handleNewExpense = (scannedData) => {
    // scannedData = { merchant: "Walmart", total: 22.50, date: "2026-06-13", category: "Shopping" }
    setExpenses((prev) => [scannedData, ...prev]);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <header style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h1>💰 Expense Dashboard</h1>
      </header>

      {/* Render Camera Scanner Component */}
      <ReceiptScanner onScanSuccess={handleNewExpense} />

      {/* Expense Entries Table */}
      <h2>Recent Transactions</h2>
      {expenses.length === 0 ? (
        <p style={{ color: '#666' }}>No entries found. Scan a receipt to get started!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
          <thead>
            <tr style={{ background: '#f4f4f4', textAlign: 'left' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Merchant</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Category</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Date</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.merchant}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}><span style={{ background: '#e0f0ff', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>{item.category}</span></td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.date}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>${Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;