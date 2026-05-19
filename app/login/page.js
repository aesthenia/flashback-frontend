"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../components/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      router.push("/capsules");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="authPage">
      <form className="authCard" onSubmit={handleSubmit}>
        <h1>Login</h1>
        {error ? <p className="error">{error}</p> : null}
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </label>
        <button className="btn primary">Login</button>
        <p className="muted small">
          New here? <Link href="/register">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
