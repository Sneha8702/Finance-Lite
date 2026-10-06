import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({ className = "form-input", ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input {...props} className={className} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="password-visibility-btn"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible(current => !current)}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
