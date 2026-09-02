import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userClass, setUserClass] = useState(10);
  const [error, setError] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await register({ name, email, password, class: userClass });
      } else {
        await login(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "system-ui" }}>
      <h1 style={{ color: "#58CC02" }}>MemoryMesh</h1>
      <h2>{isRegister ? "Create account" : "Log in"}</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {isRegister && (
          <>
            <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="number" placeholder="Class (5-12)" value={userClass} onChange={(e) => setUserClass(Number(e.target.value))} min={5} max={12} required />
          </>
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p style={{ color: "#FF4B4B" }}>{error}</p>}
        <button type="submit" style={{ background: "#58CC02", color: "#fff", padding: 10, borderRadius: 8, border: "none" }}>
          {isRegister ? "Register" : "Log in"}
        </button>
      </form>
      <p style={{ marginTop: 16, cursor: "pointer", color: "#1CB0F6" }} onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Already have an account? Log in" : "New here? Create an account"}
      </p>
    </div>
  );
}


