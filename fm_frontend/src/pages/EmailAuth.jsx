import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import API from "../services/api";

export default function EmailAuth({ mode }) {
  const location = useLocation();
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token") || "");
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState(location.state?.registered ? "Account created. Check your email, including spam, for your verification link." : "");
  const [error, setError] = useState("");
  const verify = mode === "verify";
  const reset = mode === "reset";
  const confirm = Boolean(token) && (verify || reset);
  const title = verify ? "Verify your email" : reset ? "Reset your password" : "Forgot password";

  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    if (reset && password !== password2) { setError("Passwords do not match"); return; }
    setBusy(true);
    setError("");
    try {
      const endpoint = confirm ? (verify ? "/verify-email/" : "/reset-password/") : (verify ? "/resend-verification/" : "/forgot-password/");
      const payload = confirm ? { token, ...(reset ? { password, password2 } : {}) } : { email };
      const response = await API.post(endpoint, payload);
      setMessage(response.data.message);
      if (confirm) {
        setDone(true);
        window.history.replaceState(null, "", window.location.pathname);
      }
    } catch (error) {
      setError(error.response?.data?.error || "Could not complete the request. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page"><div className="glass-card auth-card">
      <h2 className="auth-title">{title}</h2>
      {message && <p role="status" style={{ margin: "16px 0" }}>{message}</p>}
      {error && <p role="alert" className="error-message">{error}</p>}
      {!done && (reset && !token ? <p>Open the reset link from your email, or request a new one below.</p> : (
        <form className="auth-form" onSubmit={submit}>
          {confirm ? (reset ? <>
            <label className="form-label" htmlFor="new-password">New password</label>
            <input id="new-password" className="form-input" type="password" autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} />
            <label className="form-label" htmlFor="confirm-password">Confirm password</label>
            <input id="confirm-password" className="form-input" type="password" autoComplete="new-password" required value={password2} onChange={event => setPassword2(event.target.value)} />
          </> : <p>Confirm your email to activate your account.</p>) : <>
            <label className="form-label" htmlFor="account-email">Email address</label>
            <input id="account-email" className="form-input" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
          </>}
          <button className="primary-btn" disabled={busy} type="submit">{busy ? "Please wait?" : confirm ? (verify ? "Verify email" : "Save new password") : (verify ? "Send verification email" : "Send reset link")}</button>
        </form>
      ))}
      <p><Link className="auth-link" to="/">Back to login</Link></p>
      {reset && <p><Link className="auth-link" to="/forgot-password">Request a new reset link</Link></p>}
      {verify && token && !done && <p><Link className="auth-link" to="/verify-email" onClick={() => { window.location.href = "/verify-email"; }}>Request a new verification link</Link></p>}
    </div></div>
  );
}
