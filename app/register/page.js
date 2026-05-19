"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../components/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await register(form);
      router.push("/capsules");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="authPage">
      <form className="authCard" onSubmit={handleSubmit}>
        <h1>Create account</h1>
        {error ? <p className="error">{error}</p> : null}
        <label>
          Username
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </label>
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
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </label>
        <button className="btn primary">Register</button>
        <p className="muted small">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
