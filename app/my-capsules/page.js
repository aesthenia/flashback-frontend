"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Protected, useAuth } from "../../components/auth";
import { CapsuleCard } from "../../components/capsules";
import { apiFetch } from "../../lib/api";

export default function MyCapsulesPage() {
  const { user, lastWsMessage } = useAuth();
  const [capsules, setCapsules] = useState([]);
  const [error, setError] = useState("");
  const loadingRef = useRef(false);

  function load() {
    if (loadingRef.current) return;
    loadingRef.current = true;
    apiFetch("/capsules?mine=true")
      .then((data) => setCapsules(data.capsules || []))
      .catch((err) => setError(err.message))
      .finally(() => {
        loadingRef.current = false;
      });
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!lastWsMessage) return;
    const { event, payload } = lastWsMessage;
    if (event === "CAPSULE_CREATED" || event === "CAPSULE_UPDATED" || event === "CAPSULE_OPENED") {
      const cap = payload?.capsule;
      const authorId = cap?.author?._id || cap?.author;
      if (!cap || String(authorId) === String(user?.id) || event === "CAPSULE_OPENED") {
        load();
      }
    }
    if (event === "CAPSULE_DELETED") {
      setCapsules((current) =>
        current.filter((c) => String(c._id || c.id) !== String(payload.capsuleId))
      );
    }
    if (event === "COMMENT_COUNT_UPDATED") {
      setCapsules((current) =>
        current.map((c) =>
          String(c._id || c.id) === payload.capsuleId
            ? { ...c, commentsCount: payload.commentsCount }
            : c
        )
      );
    }
  }, [lastWsMessage, user?.id]);

  return (
    <Protected>
      <main className="page">
        <div className="pageHead">
          <h1>My capsules</h1>
          <Link className="btn primary" href="/capsules/new">New capsule</Link>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="grid">
          {capsules.map((capsule) => (
            <CapsuleCard capsule={capsule} key={capsule._id || capsule.id} />
          ))}
        </div>
        {!capsules.length && !error ? <p className="muted">Your archive is empty.</p> : null}
      </main>
    </Protected>
  );
}
