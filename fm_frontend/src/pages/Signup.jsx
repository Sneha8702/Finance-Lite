import { useState } from "react";
import { signupUser } from "../services/api";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  // ---------------- HANDLE INPUT ----------------
  const handleChange = (e) => {
    setError(""); // Clear error on edit
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ---------------- HANDLE SIGNUP ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (form.password !== form.password2) {
      setError("Passwords do not match");
      return;
    }

    setError("");

    setSaving(true);
    try {
      await signupUser(form); // ✅ get response
      navigate("/verify-email", { state: { email: form.email, registered: true } });
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Signup failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <div className="brand-section">
          <span className="brand-logo">FM</span>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join us to start managing your flow</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">⚠️ {error}</div>}
          
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              name="username"
              placeholder="Pick a unique username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email</label>
            <input id="signup-email" className="form-input" name="email" type="email" autoComplete="email"
              value={form.email} onChange={handleChange} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              className="form-input"
              name="password2"
              type="password"
              placeholder="••••••••"
              value={form.password2}
              onChange={handleChange}
              required
            />
          </div>

          <button className="primary-btn" type="submit" disabled={saving}>
            {saving ? "Sending verification?" : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link className="auth-link" to="/">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;