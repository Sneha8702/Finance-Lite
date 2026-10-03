import { useState, useEffect, useCallback } from "react";
import { getExpenses, getCategories } from "../../services/api";

function ExpensesTab() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category_id: "",
    start_date: "",
    end_date: "",
  });

  // 📄 Pagination State
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    count: 0,
    total_pages: 1,
    page_size: 10
  });

  // 📡 Fetch categories for filter dropdown
  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      if (data.status === "success") {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  // 📡 Fetch expenses with filters and pagination
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page }; // Include page parameter
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const data = await getExpenses(params);

      // Update data handling for paginated response structure
      setExpenses(data.results || []);
      setPagination({
        count: data.count || 0,
        total_pages: data.total_pages || 1,
        page_size: data.page_size || 10
      });
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Fetch expenses when page or filters change
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({ category_id: "", start_date: "", end_date: "" });
  };

  return (
    <>
      {/* 📊 Filters Section */}
      <div
        className="glass-card"
        style={{
          padding: "16px",
          marginBottom: "16px",
          background: "var(--glass-bg)",
          boxShadow: "var(--shadow)"
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", alignItems: "flex-end" }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Category</label>
            <select
              className="form-input"
              name="category_id"
              value={filters.category_id}
              onChange={handleFilterChange}
              style={{ appearance: "none", cursor: "pointer", background: "var(--input-bg)", color: "var(--text-main)" }}
            >
              <option value="" style={{ background: "var(--bg-dark)" }}>All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} style={{ background: "var(--bg-dark)" }}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Start Date</label>
            <input
              className="form-input"
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">End Date</label>
            <input
              className="form-input"
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
            />
          </div>

          <div style={{ display: "flex" }}>
            <button
              className="social-btn"
              style={{ margin: 0, padding: "12px", width: "100%", height: "46px" }}
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* 📊 Transactions Section */}
      <div className="dashboard-grid" style={{ display: "grid", gap: "20px" }}>
        <div className="history-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "var(--text-main)",
              }}
            >
              Recent Transactions
            </h3>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p className="auth-subtitle">Loading transactions...</p>
            </div>
          ) : expenses.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="glass-card"
                  style={{
                    padding: "20px",
                    background: "var(--glass-bg)",
                    margin: 0,
                    width: "100%",
                    boxShadow: "var(--shadow)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          marginBottom: "4px",
                          color: "var(--text-main)",
                        }}
                      >
                        {exp.description}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            padding: "2px 8px",
                            background:
                              "rgba(139, 92, 246, 0.1)",
                            borderRadius: "10px",
                            color: "var(--secondary)",
                          }}
                        >
                          {exp.category || "General"}
                        </span>

                        <span>•</span>
                        <span>{exp.date}</span>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "var(--primary)",
                      }}
                    >
                      Rs.{exp.amount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="glass-card"
              style={{
                textAlign: "center",
                padding: "60px 0",
                background: "var(--glass-bg)",
                borderStyle: "dashed",
                boxShadow: "var(--shadow)"
              }}
            >
              <p className="auth-subtitle">
                No transactions found.
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginTop: "8px",
                }}
              >
                Add your first expense using the + button below.
              </p>
            </div>
          )}
        </div>

        {/* 📄 Pagination UI */}
        {!loading && pagination.total_pages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "20px",
              padding: "0 4px"
            }}
          >
            <button
              className="social-btn"
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              style={{
                margin: 0,
                padding: "8px 16px",
                opacity: page === 1 ? 0.5 : 1,
                cursor: page === 1 ? "not-allowed" : "pointer",
                minWidth: "100px",
                height: "40px"
              }}
            >
              Previous
            </button>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <span style={{ color: "var(--text-main)", fontSize: "14px", fontWeight: "600" }}>
                Page {page} of {pagination.total_pages}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                Total {pagination.count} records
              </span>
            </div>

            <button
              className="social-btn"
              onClick={() => setPage(prev => Math.min(prev + 1, pagination.total_pages))}
              disabled={page === pagination.total_pages}
              style={{
                margin: 0,
                padding: "8px 16px",
                opacity: page === pagination.total_pages ? 0.5 : 1,
                cursor: page === pagination.total_pages ? "not-allowed" : "pointer",
                minWidth: "100px",
                height: "40px"
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default ExpensesTab;
