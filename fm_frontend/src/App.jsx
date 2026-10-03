import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EmailAuth from "./pages/EmailAuth";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<EmailAuth key="verify" mode="verify" />} />
        <Route path="/forgot-password" element={<EmailAuth key="forgot" mode="forgot" />} />
        <Route path="/reset-password" element={<EmailAuth key="reset" mode="reset" />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;