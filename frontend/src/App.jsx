import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const idempotencyKeyRef = useRef(uuidv4());

  const fetchExpenses = async () => {
    try {
      let url = 'https://expense-tracker-wnfk.onrender.com/expenses?sort=date_desc';
      if (filterCategory) url += `&category=${encodeURIComponent(filterCategory)}`;
      const res = await fetch(url);
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      setError('Failed to fetch expenses');
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filterCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('https://expense-tracker-wnfk.onrender.com/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKeyRef.current
        },
        body: JSON.stringify({ amount, category, description, date })
      });
      if (!response.ok) throw new Error('Failed to create expense');
      idempotencyKeyRef.current = uuidv4();
      setAmount('');
      setCategory('');
      setDescription('');
      setDate('');
      fetchExpenses();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0) / 100;

  return (
    <div className="container">
      <h1>Expense Tracker</h1>
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit} className="form-grid">
        <input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (₹)" required />
        <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Category" required />
        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Expense'}</button>
      </form>

      <div className="filter-section">
        <input type="text" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} placeholder="Filter by category..." />
      </div>

      <h2>Total: ₹{total.toFixed(2)}</h2>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(exp => (
            <tr key={exp.id}>
              <td>{exp.date}</td>
              <td>₹{(exp.amount / 100).toFixed(2)}</td>
              <td>{exp.category}</td>
              <td>{exp.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;