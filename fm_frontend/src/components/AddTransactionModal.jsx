import CreateCategory from "./CreateCategory";
import { localDate } from "../utils/localDate";
import { useState, useEffect } from "react";
import { useTheme } from "../context/useTheme";
import { addExpense, addIncome, getCategories, getExpenseOverview } from "../services/api";
import Calculator from "./common/Calculator";

function AddTransactionModal({ show, onClose, onSuccess }) {
  const { theme } = useTheme();
  const [type, setType] = useState("expense"); // "expense" or "income"
  
  const [expense, setExpense] = useState({
    amount: "",
    category_id: "",
    description: "",
    date: localDate(),
  });

  const [income, setIncome] = useState({
    amount: "",
    source: "",
    date: localDate(),
    is_recurring: false,
  });

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState("");
  const [showCalculator, setShowCalculator] = useState(false);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setType("expense");
    setExpense({ amount: "", category_id: "", description: "", date: localDate() });
    setIncome({ amount: "", source: "", date: localDate(), is_recurring: false });
    setCategories([]);
    setError("");
    setShowCalculator(false);
  };

  const closeModal = () => {
    if (saving) return;
    resetForm();
    onClose();
  };

  // 📡 Fetch categories on mount
  useEffect(() => {
    if (!show) {
      resetForm();
      return;
    }
    if (show) {
      setError(""); 
      setShowCalculator(false);
      if (type === "expense") {
        const fetchCategories = async () => {
          setLoadingCategories(true);
          try {
            const data = await getCategories();
            if (data.status === "success") {
              setCategories(data.categories);
            }
          } catch (err) {
            console.error("Failed to fetch categories:", err);
          } finally {
            setLoadingCategories(false);
          }
        };
        fetchCategories();
      }
    }
  }, [show, type]);

  const handleChange = (e) => {
    setError("");
    const { name, value, type: inputType, checked } = e.target;
    const val = inputType === "checkbox" ? checked : value;
    
    if (type === "expense") {
      setExpense({ ...expense, [name]: val });
    } else {
      setIncome({ ...income, [name]: val });
    }
  };

  const handleCalculatorApply = (value) => {
    if (type === "expense") {
      setExpense({ ...expense, amount: value });
    } else {
      setIncome({ ...income, amount: value });
    }
    setShowCalculator(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError("");

    try {
      if (type === "expense") {
        if (!expense.category_id) {
          setError("Please select a category");
          return;
        }
        
        const expenseData = {
          amount: expense.amount,
          category_id: parseInt(expense.category_id),
          description: expense.description,
          date: expense.date
        };

        const amount = Number(expenseData.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          setError("Please enter a valid amount");
          return;
        }
        expenseData.amount = amount;

        setSaving(true);
        const overview = await getExpenseOverview();
        const availableBalance = Number(overview.balance);
        if (Number.isFinite(availableBalance) && amount > availableBalance) {
          const confirmed = window.confirm(
            `This expense is greater than your available balance of Rs. ${availableBalance.toFixed(2)}. Do you still want to add it?`
          );
          if (!confirmed) return;
        }

        await addExpense(expenseData);
        setExpense({
          amount: "",
          category_id: "",
          description: "",
          date: localDate(),
        });
      } else {
        // Construct clean payload for income based on user example
        const incomeData = {
          amount: income.amount,
          source: income.source,
          date: income.date,
          frequency: income.is_recurring ? "monthly" : null,
          is_recurring: !!income.is_recurring // Ensure boolean
        };



        const amount = Number(incomeData.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          setError("Please enter a valid amount");
          return;
        }
        incomeData.amount = amount;

        if (!incomeData.source) {
          setError("Please enter a source");
          return;
        }

        setSaving(true);
        await addIncome(incomeData);
        setIncome({
          amount: "",
          source: "",
          date: localDate(),
          is_recurring: false,
        });
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Transaction Error:", err);
      // Show detailed error from backend if available
      const fieldErrors = err?.response?.data?.errors;
      const details = fieldErrors ? Object.entries(fieldErrors).map(([field, messages]) => `${field}: ${[].concat(messages).join(" ")}`).join(" ") : null;
      const backendError = details || err?.response?.data?.error || err?.response?.data?.message || err?.response?.data?.detail;
      setError(backendError || `Failed to add ${type}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={closeModal} style={{ padding: "20px" }}>
      <div 
        className="glass-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: "450px", 
          padding: "32px",
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          boxShadow: theme === "dark" ? "0 24px 64px -12px rgba(0, 0, 0, 0.8)" : "var(--shadow)",
          animation: "slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          position: "relative"
        }}
      >
        {/* 🧮 Calculator Overlay */}
        {showCalculator && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            width: "90%",
            display: "flex",
            justifyContent: "center"
          }}>
            <Calculator 
              initialValue={type === "expense" ? expense.amount : income.amount} 
              onApply={handleCalculatorApply} 
              onClose={() => setShowCalculator(false)} 
            />
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ 
            fontSize: "24px", 
            fontWeight: "700", 
            marginBottom: "16px", 
            color: "var(--text-main)",
            textAlign: "center"
          }}>
            New Transaction
          </h2>
          
          {/* 🔘 Type Selector Tabs */}
          <div style={{ 
            display: "flex", 
            background: "rgba(0,0,0,0.2)", 
            borderRadius: "12px", 
            padding: "4px",
            marginBottom: "8px"
          }}>
            <button
              type="button"
              disabled={saving}
              onClick={() => setType("expense")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.3s ease",
                background: type === "expense" ? "var(--primary)" : "transparent",
                color: type === "expense" ? "white" : "var(--text-muted)"
              }}
            >
              Expense
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => setType("income")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.3s ease",
                background: type === "income" ? "var(--secondary)" : "transparent",
                color: type === "income" ? "white" : "var(--text-muted)"
              }}
            >
              Income
            </button>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">⚠️ {error}</div>}

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label className="form-label" style={{ margin: 0 }}>Amount</label>
              <button 
                type="button"
                onClick={() => setShowCalculator(true)}
                style={{ 
                  background: "transparent", 
                  border: "none", 
                  color: "var(--primary)", 
                  fontSize: "12px", 
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><line x1="16" y1="10" x2="16" y2="10"></line><line x1="12" y1="10" x2="12" y2="10"></line><line x1="8" y1="10" x2="8" y2="10"></line><line x1="12" y1="14" x2="12" y2="14"></line><line x1="8" y1="14" x2="8" y2="14"></line><line x1="12" y1="18" x2="12" y2="18"></line><line x1="8" y1="18" x2="8" y2="18"></line></svg>
                Calc
              </button>
            </div>
            <input
              className="form-input"
              name="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={type === "expense" ? expense.amount : income.amount}
              onChange={handleChange}
              required
              style={{ background: "var(--input-bg)", border: "1px solid var(--glass-border)", borderRadius: "12px", color: "var(--text-main)" }}
            />
          </div>

          {type === "expense" ? (
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: "8px" }}>Category</label>
              <div style={{ position: "relative" }}>
                <select
                  className="form-input"
                  name="category_id"
                  value={expense.category_id}
                  onChange={handleChange}
                  required
                  disabled={loadingCategories}
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    background: "var(--input-bg)",
                    color: "var(--text-main)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "12px",
                    width: "100%",
                    paddingRight: "40px"
                  }}
                >
                  <option value="" style={{ background: "var(--bg-dark)" }}>
                    {loadingCategories ? "Loading..." : "Select Category"}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} style={{ background: "var(--bg-dark)" }}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 4.5 6 7.5 9 4.5"></polyline></svg>
                </div>
              </div>
              <CreateCategory onCreated={(category) => {
                setCategories(current => [...current.filter(item => item.id !== category.id), category]);
                setExpense(current => ({ ...current, category_id: String(category.id) }));
                setError("");
              }} />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: "8px" }}>Source</label>
              <input
                className="form-input"
                name="source"
                placeholder="e.g. Salary, Freelance"
                value={income.source}
                onChange={handleChange}
                required
                style={{ background: "var(--input-bg)", border: "1px solid var(--glass-border)", borderRadius: "12px", color: "var(--text-main)" }}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: "8px" }}>
              {type === "expense" ? "Description" : "Notes"}
            </label>
            <input
              className="form-input"
              name={type === "expense" ? "description" : "notes"}
              placeholder={type === "expense" ? "What did you spend on?" : "Optional notes"}
              value={type === "expense" ? expense.description : income.notes || ""}
              onChange={handleChange}
              style={{ background: "var(--input-bg)", border: "1px solid var(--glass-border)", borderRadius: "12px", color: "var(--text-main)" }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: "8px" }}>Date</label>
            <input
              className="form-input"
              name="date"
              type="date"
              value={type === "expense" ? expense.date : income.date}
              onChange={handleChange}
              required
              style={{ 
                background: "var(--input-bg)", 
                border: "1px solid var(--glass-border)", 
                borderRadius: "12px",
                color: "var(--text-main)",
                colorScheme: theme === "dark" ? "dark" : "light"
              }}
            />
          </div>

          {type === "income" && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
              <input
                type="checkbox"
                name="is_recurring"
                id="is_recurring"
                checked={income.is_recurring}
                onChange={handleChange}
                style={{ cursor: "pointer" }}
              />
              <label htmlFor="is_recurring" style={{ fontSize: "14px", color: "var(--text-main)", cursor: "pointer" }}>
                This is a recurring income
              </label>
            </div>
          )}

          <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
            <button 
              type="button" 
              className="social-btn" 
              style={{ flex: 1, padding: "14px", borderRadius: "14px" }} 
              onClick={closeModal}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary-btn" 
              disabled={saving}
              style={{ 
                flex: 2, 
                padding: "14px", 
                borderRadius: "14px",
                margin: 0,
                background: type === "expense" 
                  ? "linear-gradient(135deg, #7c3aed, #06b6d4)" 
                  : "linear-gradient(135deg, #06b6d4, #10b981)",
                fontWeight: "700"
              }}
            >
              {saving ? "Saving..." : `Save ${type === "expense" ? "Expense" : "Income"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTransactionModal;
