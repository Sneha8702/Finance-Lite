import { useState } from "react";
import { loginUser } from "../services/api"; // ✅ use API service
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ---------------- HANDLE INPUT ----------------
  const handleChange = (e) => {
    setError(""); // Clear error on edit
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ---------------- HANDLE LOGIN ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await loginUser(form); // ✅ use service

      // ✅ Navigate after login
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Check your username/password and verify your email if you just signed up.");
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <div className="brand-section">
          <span className="brand-logo">FL</span>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Please enter your details to sign in</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">⚠️ {error}</div>}
          
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              name="username"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
              required
            />
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

          <button className="primary-btn" type="submit">
            Login
          </button>
        </form>

        <p><Link className="auth-link" to="/forgot-password">Forgot password?</Link></p>
        <p><Link className="auth-link" to="/verify-email">Resend verification email</Link></p>
        <div className="social-login">
          <button className="social-btn">G</button>
          <button className="social-btn">f</button>
        </div>

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link className="auth-link" to="/signup">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;