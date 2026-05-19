"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Protected } from "../../../../components/auth";
import { CapsuleForm } from "../../../../components/capsules";
import { apiFetch } from "../../../../lib/api";

export default function EditCapsulePage() {
  const { id } = useParams();
  const router = useRouter();
  const [capsule, setCapsule] = useState(null);
  const [error, setError] = useState("");
  const isOpened = capsule?.opensAt ? new Date(capsule.opensAt).getTime() <= Date.now() : false;

  useEffect(() => {
    apiFetch(`/capsules/${id}`)
      .then((data) => setCapsule(data.capsule))
      .catch((err) => setError(err.message));
  }, [id]);

  async function updateCapsule(payload) {
    setError("");
    try {
      const data = await apiFetch(`/capsules/${id}`, { method: "PUT", body: payload });
      router.push(`/capsules/${data.capsule._id || data.capsule.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Protected>
      <main className="page narrow">
        <div className="pageHead">
          <h1>Edit capsule</h1>
        </div>
        {error ? <p className="error">{error}</p> : null}
        {capsule && isOpened ? <p className="error">Cannot edit an opened capsule.</p> : null}
        {capsule && !isOpened ? (
          <CapsuleForm
            initialCapsule={capsule}
            onSubmit={updateCapsule}
            submitLabel="Save changes"
            editMode
          />
        ) : null}
        {!capsule && !error ? <p className="muted">Loading…</p> : null}
      </main>
    </Protected>
  );
}
