"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import GradientText from "@/components/reactbits/GradientText/GradientText";
import ShinyText from "@/components/reactbits/ShinyText/ShinyText";

// WebGL background: render only on the client to avoid SSR of the canvas.
const Aurora = dynamic(
  () => import("@/components/reactbits/Aurora/Aurora"),
  { ssr: false }
);

export default function LoginPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha ao entrar.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="aurora-bg">
        <Aurora
          colorStops={["#7c3aed", "#ec4899", "#22d3ee"]}
          amplitude={1.1}
          blend={0.5}
        />
      </div>

      <div className="login-card fade-in-up">
        <GradientText
          className="login-title"
          colors={["#818cf8", "#22d3ee", "#a78bfa", "#818cf8"]}
          animationSpeed={7}
        >
          Meu Sistema
        </GradientText>
        <p className="subtitle">
          <ShinyText text="Consumo global de álcool" speed={4} />
        </p>

        {!showForm ? (
          <button
            className="btn btn-block"
            onClick={() => setShowForm(true)}
            type="button"
          >
            Login
          </button>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p className="error">{error}</p>}
            <div className="field">
              <label htmlFor="email">Usuário</label>
              <input
                id="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              className="btn btn-block"
              type="submit"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
