"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Protected } from "../../../components/auth";
import { CapsuleForm } from "../../../components/capsules";
import { apiFetch } from "../../../lib/api";

export default function NewCapsulePage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function createCapsule(payload) {
    setError("");
    try {
      await apiFetch("/capsules", { method: "POST", body: payload });
      router.push("/capsules");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Protected>
      <main className="page narrow">
        <div className="pageHead">
          <h1>New capsule</h1>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <CapsuleForm onSubmit={createCapsule} submitLabel="Seal capsule" />
      </main>
    </Protected>
  );
}
