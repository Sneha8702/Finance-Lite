import { useState } from "react";

function Calculator({ initialValue, onApply, onClose }) {
  const [display, setDisplay] = useState(initialValue?.toString() || "");
  const [equation, setEquation] = useState("");

  const handleNumber = (num) => {
    setDisplay((prev) => (prev === "0" ? num : prev + num));
  };

  const handleOperator = (op) => {
    setEquation(display + " " + op + " ");
    setDisplay("");
  };

  const handleClear = () => {
    setDisplay("");
    setEquation("");
  };

  const calculate = () => {
    try {
      // Basic math evaluation safely
      const fullEquation = equation + display;
      if (!fullEquation) return;
      
      // Using Function constructor as a safer alternative to eval for simple math
      const result = new Function(`return ${fullEquation}`)();
      setDisplay(Number(result).toFixed(2).replace(/\.00$/, ""));
      setEquation("");
    } catch {
      setDisplay("Error");
    }
  };

  const buttons = [
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["C", "0", ".", "+"],
  ];

  return (
    <div style={{
      background: "var(--bg-dark)",
      borderRadius: "20px",
      padding: "20px",
      width: "100%",
      maxWidth: "300px",
      boxShadow: "var(--shadow)",
      border: "1px solid var(--glass-border)",
    }}>
      <div style={{
        background: "var(--glass-bg)",
        padding: "15px",
        borderRadius: "12px",
        marginBottom: "20px",
        textAlign: "right",
        minHeight: "72px",
        border: "1px solid var(--glass-border)"
      }}>
        <div style={{ color: "var(--text-muted)", fontSize: "12px", height: "18px" }}>{equation}</div>
        <div style={{ color: "var(--text-main)", fontSize: "28px", fontWeight: "700" }}>{display || "0"}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {buttons.flat().map((btn) => (
          <button
            key={btn}
            onClick={() => {
              if (btn === "C") handleClear();
              else if (["+", "-", "*", "/"].includes(btn)) handleOperator(btn);
              else handleNumber(btn);
            }}
            style={{
              padding: "15px",
              borderRadius: "12px",
              background: ["+", "-", "*", "/", "C"].includes(btn) ? "rgba(139, 92, 246, 0.1)" : "var(--glass-bg)",
              color: ["+", "-", "*", "/", "C"].includes(btn) ? "var(--primary)" : "var(--text-main)",
              border: "none",
              fontSize: "18px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--primary)"}
            onMouseLeave={(e) => e.currentTarget.style.background = ["+", "-", "*", "/", "C"].includes(btn) ? "rgba(139, 92, 246, 0.1)" : "var(--glass-bg)"}
          >
            {btn}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <button
          onClick={calculate}
          style={{
            flex: 1,
            padding: "15px",
            borderRadius: "12px",
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            fontSize: "18px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          =
        </button>
        <button
          onClick={() => onApply(display)}
          style={{
            flex: 1,
            padding: "15px",
            borderRadius: "12px",
            background: "var(--secondary)",
            color: "#fff",
            border: "none",
            fontSize: "18px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          Apply
        </button>
      </div>

      <button
        onClick={onClose}
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "10px",
          background: "transparent",
          color: "var(--text-muted)",
          border: "none",
          fontSize: "13px",
          cursor: "pointer"
        }}
      >
        Close
      </button>
    </div>
  );
}

export default Calculator;
