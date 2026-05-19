"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Protected, useAuth } from "../../../components/auth";
import { CommentsPanel, formatDateTime } from "../../../components/capsules";
import { apiFetch } from "../../../lib/api";

export default function CapsuleDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, lastWsMessage } = useAuth();
  const [capsule, setCapsule] = useState(null);
  const [error, setError] = useState("");

  const fetchCapsule = useCallback(() => {
    apiFetch(`/capsules/${id}`)
      .then((data) => setCapsule(data.capsule))
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    fetchCapsule();
  }, [fetchCapsule]);

  const isOwner = user && capsule?.author?._id === user.id;

  useEffect(() => {
    if (!lastWsMessage) return;
    const { event, payload } = lastWsMessage;
    if (event === "CAPSULE_OPENED" && String(payload.capsuleId) === String(id)) fetchCapsule();
    if (event === "CAPSULE_UPDATED" && String(payload?.capsule?._id) === String(id)) fetchCapsule();
    if (event === "CAPSULE_DELETED" && String(payload.capsuleId) === String(id) && !isOwner) {
      router.replace("/capsules");
    }
  }, [lastWsMessage, id, fetchCapsule, router, isOwner]);

  // Fallback: if locked and opens within 24h, schedule a local refetch.
  useEffect(() => {
    if (!capsule?.isLocked) return undefined;
    const opensAt = new Date(capsule.opensAt).getTime();
    const delay = opensAt - Date.now();
    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return undefined;
    const timer = setTimeout(fetchCapsule, delay + 200);
    return () => clearTimeout(timer);
  }, [capsule, fetchCapsule]);

  async function deleteCapsule() {
    if (!confirm("Delete this capsule?")) return;
    await apiFetch(`/capsules/${id}`, { method: "DELETE" });
    router.push("/my-capsules");
  }

  const isOpened = capsule?.opensAt ? new Date(capsule.opensAt).getTime() <= Date.now() : true;

  return (
    <Protected>
      <main className="page">
        {error ? <p className="error">{error}</p> : null}
        {!capsule && !error ? <p className="muted">Loading…</p> : null}
        {capsule ? (
          <div className="split">
            <article className="card">
              <div className="detail">
                <h1>{capsule.title}</h1>
                <div className="detailMeta">
                  <span>{capsule.author?.username}</span>
                  <span>created {formatDateTime(capsule.createdAt)}</span>
                  <span>opens {formatDateTime(capsule.opensAt)}</span>
                </div>
                {isOwner ? (
                  <div className="detailActions">
                    {!isOpened ? (
                      <Link className="btn ghost small" href={`/capsules/${id}/edit`}>Edit</Link>
                    ) : null}
                    <button className="btn danger small" onClick={deleteCapsule}>Delete</button>
                  </div>
                ) : null}
              </div>

              {capsule.tags?.length ? (
                <div className="tagRow">
                  {capsule.tags.map((tag) => (
                    <Link className="tag" key={tag._id || tag.slug} href={`/capsules?tag=${tag.slug}`}>
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              ) : null}

              {capsule.isLocked ? (
                <div className="sealed">
                  <h2>Sealed</h2>
                  <p>This memory opens on {formatDateTime(capsule.opensAt)}.</p>
                  <p className="muted small">The page will update automatically when it's time.</p>
                </div>
              ) : (
                <>
                  {capsule.artifactUrl ? (
                    capsule.artifactType === "audio" ? (
                      <audio controls src={capsule.artifactUrl} className="artifactPlayer" />
                    ) : capsule.artifactType === "image" ? (
                      <img className="detailArtifact" src={capsule.artifactUrl} alt="" />
                    ) : (
                      <a className="artifactLink" href={capsule.artifactUrl} target="_blank" rel="noreferrer">
                        Open attached file
                      </a>
                    )
                  ) : null}
                  <p className="detailBody">{capsule.content}</p>
                </>
              )}
            </article>
            <CommentsPanel capsuleId={id} />
          </div>
        ) : null}
      </main>
    </Protected>
  );
}
