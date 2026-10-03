import CreateCategory from "./CreateCategory";
import { localDate } from "../utils/localDate";
import { useState, useEffect } from "react";
import { useTheme } from "../context/useTheme";
import { addExpense, getCategories } from "../services/api";
import Calculator from "./common/Calculator";

function AddExpenseModal({ show, onClose, onSuccess }) {
  const { theme } = useTheme();
  const [expense, setExpense] = useState({
    amount: "",
    category_id: "",
    description: "",
    date: localDate(),
  });

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState("");
  const [showCalculator, setShowCalculator] = useState(false);

  // 📡 Fetch categories on mount
  useEffect(() => {
    if (show) {
      setError(""); // Clear error on open
      setShowCalculator(false); // Reset calculator
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
  }, [show]);

  const handleExpenseChange = (e) => {
    setError(""); // Clear error on edit
    setExpense({ ...expense, [e.target.name]: e.target.value });
  };

  const handleCalculatorApply = (value) => {
    setExpense({ ...expense, amount: value });
    setShowCalculator(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expense.category_id) {
      setError("Please select a category");
      return;
    }

    setError("");

    try {
      await addExpense(expense);
      
      // Reset form
      setExpense({
        amount: "",
        category_id: "",
        description: "",
        date: localDate(),
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to add expense. Please try again.");
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: "20px" }}>
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
              initialValue={expense.amount} 
              onApply={handleCalculatorApply} 
              onClose={() => setShowCalculator(false)} 
            />
          </div>
        )}

        <div className="brand-section" style={{ marginBottom: "32px" }}>
          <h2 style={{ 
            fontSize: "28px", 
            fontWeight: "700", 
            marginBottom: "8px", 
            color: "var(--text-main)",
            letterSpacing: "-0.5px"
          }}>
            New Transaction
          </h2>
          <p className="auth-subtitle" style={{ fontSize: "15px" }}>
            Add details of your recent spending
          </p>
        </div>

        <form className="auth-form" onSubmit={handleAddExpense}>
          {error && <div className="error-message">⚠️ {error}</div>}

          <div className="expense-form-grid">
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
                value={expense.amount}
                onChange={handleExpenseChange}
                required
                style={{ background: "var(--input-bg)", border: "1px solid var(--glass-border)", borderRadius: "12px", color: "var(--text-main)" }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ marginBottom: "8px" }}>Category</label>
              <div style={{ position: "relative" }}>
                <select
                  className="form-input"
                  name="category_id"
                  value={expense.category_id}
                  onChange={handleExpenseChange}
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
                    <option
                      key={cat.id}
                      value={cat.id}
                      style={{ background: "var(--bg-dark)" }}
                    >
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div style={{
                  position: "absolute",
                  right: "15px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "var(--text-muted)"
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 4.5 6 7.5 9 4.5"></polyline></svg>
                </div>
              </div>
              <CreateCategory onCreated={(category) => {
                setCategories(current => [...current.filter(item => item.id !== category.id), category]);
                setExpense(current => ({ ...current, category_id: String(category.id) }));
                setError("");
              }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: "8px" }}>Description</label>
            <input
              className="form-input"
              name="description"
              placeholder="What did you spend on?"
              value={expense.description}
              onChange={handleExpenseChange}
              required
              style={{ 
                background: "var(--input-bg)", 
                border: "1px solid var(--glass-border)", 
                borderRadius: "12px",
                padding: "14px 16px",
                color: "var(--text-main)"
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: "8px" }}>Date</label>
            <input
              className="form-input"
              name="date"
              type="date"
              value={expense.date}
              onChange={handleExpenseChange}
              required
              style={{ 
                background: "var(--input-bg)", 
                border: "1px solid var(--glass-border)", 
                borderRadius: "12px",
                padding: "14px 16px",
                color: "var(--text-main)",
                colorScheme: theme === "dark" ? "dark" : "light"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
            <button 
              type="button" 
              className="social-btn" 
              style={{ 
                flex: 1, 
                padding: "14px", 
                borderRadius: "14px", 
                background: "rgba(255,255,255,0.05)",
                fontWeight: "600",
                color: "var(--text-muted)"
              }} 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary-btn" 
              style={{ 
                flex: 2, 
                padding: "14px", 
                borderRadius: "14px",
                margin: 0,
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                boxShadow: "0 8px 16px -4px rgba(6, 182, 212, 0.4)",
                fontWeight: "700"
              }}
            >
              Save Expense
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AddExpenseModal;
