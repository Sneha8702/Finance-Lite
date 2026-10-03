import { useId, useRef, useState } from "react";
import { createCategory } from "../services/api";

export default function CreateCategory({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const inputId = useId();

  const save = async () => {
    if (busy.current) return;
    if (!name.trim()) { setError("Enter a category name"); return; }
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const category = await createCategory(name.trim());
      onCreated(category);
      setName("");
      setOpen(false);
    } catch (error) {
      setError(error.response?.data?.error || "Could not create category. Try again.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: "10px" }}>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} style={{ background: "transparent", border: 0, color: "var(--primary)", cursor: "pointer" }}>
          + Add your own category
        </button>
      ) : (
        <div>
          <label className="form-label" htmlFor={inputId}>New category name</label>
          <input id={inputId} className="form-input" placeholder="e.g. Pets or Travel" value={name} maxLength={100}
            disabled={saving} onChange={event => { setName(event.target.value); setError(""); }}
            onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); save(); } }} />
          {error && <p role="alert" className="error-message">{error}</p>}
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button type="button" className="primary-btn" disabled={saving} onClick={save} style={{ margin: 0, padding: "8px 12px" }}>
              {saving ? "Creating?" : "Create category"}
            </button>
            <button type="button" className="social-btn" disabled={saving} onClick={() => { setOpen(false); setError(""); }} style={{ margin: 0, padding: "8px 12px" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
