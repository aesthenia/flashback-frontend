"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "./auth";

const UploadField = dynamic(() => import("./upload"), {
  ssr: false,
  loading: () => (
    <div className="uploadField">
      <span className="uploadFieldLabel">&nbsp;</span>
      <div className="uploadBox">
        <span className="btn primary" style={{ opacity: 0.6, pointerEvents: "none" }}>Loading…</span>
      </div>
    </div>
  ),
});

export { UploadField };

// ---------------- helpers ----------------

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromDateInput(value) {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
}

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initialOf(name) {
  return (name?.[0] || "?").toUpperCase();
}

function Avatar({ user, size = "small" }) {
  return (
    <span className={`avatar ${size}`}>
      {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initialOf(user?.username)}
    </span>
  );
}

// ---------------- CapsuleCard ----------------

export function CapsuleCard({ capsule }) {
  const id = capsule._id || capsule.id;
  const author = capsule.author?.username || "Unknown";
  const opensAt = capsule.opensAt ? new Date(capsule.opensAt) : null;
  const showImage = capsule.artifactUrl && !capsule.isLocked && capsule.artifactType === "image";

  return (
    <article className="card capsuleCard">
      <Link className="capsuleImageLink" href={`/capsules/${id}`}>
        {showImage ? (
          <img className="capsuleImage" src={capsule.artifactUrl} alt="" />
        ) : (
          <div className="capsuleImage placeholder">
            <span>{capsule.isLocked ? "SEALED" : "OPEN"}</span>
          </div>
        )}
      </Link>
      <div className="capsuleBody">
        <div className="meta">
          <span>{author}</span>
          {capsule.isLocked ? <span className="lockedTag">· locked</span> : null}
        </div>
        <Link className="capsuleTitle" href={`/capsules/${id}`}>
          <h3>{capsule.title}</h3>
        </Link>
        <p>
          {capsule.excerpt ||
            (capsule.isLocked ? "Sealed for now." : (capsule.content || "").slice(0, 120))}
        </p>
        <div className="tagRow">
          {(capsule.tags || []).slice(0, 4).map((tag) => (
            <Link className="tag" key={tag._id || tag.slug} href={`/capsules?tag=${tag.slug}`}>
              #{tag.name}
            </Link>
          ))}
        </div>
        <div className="cardFooter muted">
          <span>{capsule.commentsCount || 0} comments</span>
          <span>{opensAt ? `opens ${opensAt.toLocaleDateString()}` : ""}</span>
        </div>
      </div>
    </article>
  );
}

// ---------------- CapsuleForm ----------------

export function CapsuleForm({ initialCapsule, onSubmit, submitLabel = "Save capsule", editMode = false }) {
  const initialTags = useMemo(
    () => (initialCapsule?.tags || []).map((tag) => tag.name || tag),
    [initialCapsule]
  );

  const defaultOpensAt = useMemo(() => {
    if (initialCapsule?.opensAt) return toDateInput(initialCapsule.opensAt);
    return toDateInput(new Date());
  }, [initialCapsule]);

  const [form, setForm] = useState({
    title: initialCapsule?.title || "",
    excerpt: initialCapsule?.excerpt || "",
    content: initialCapsule?.content || "",
    opensAt: defaultOpensAt,
    visibility: initialCapsule?.visibility || "public",
    artifactUrl: initialCapsule?.artifactUrl || "",
    artifactFileKey: initialCapsule?.artifactFileKey || "",
    artifactType: initialCapsule?.artifactType || "none",
  });
  const [selectedTags, setSelectedTags] = useState(initialTags);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/tags")
      .then((data) => setAvailableTags(data.tags || []))
      .catch(() => setAvailableTags([]));
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addTag(nameRaw) {
    const next = (nameRaw ?? tagInput).trim().replace(/^#/, "");
    if (!next) return;
    setSelectedTags((current) => (current.includes(next) ? current : [...current, next].slice(0, 8)));
    setTagInput("");
  }

  function removeTag(tagName) {
    setSelectedTags((current) => current.filter((tag) => tag !== tagName));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = editMode
        ? {
            title: form.title,
            opensAt: fromDateInput(form.opensAt),
            tags: selectedTags,
          }
        : {
            ...form,
            opensAt: fromDateInput(form.opensAt),
            artifactType: form.artifactUrl ? form.artifactType || "other" : "none",
            tags: selectedTags,
          };
      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Title
        <input value={form.title} onChange={(e) => update("title", e.target.value)} required />
      </label>

      {!editMode ? (
        <label>
          Short line (optional)
          <input value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} />
        </label>
      ) : null}

      <div className={editMode ? "" : "row"}>
        <label>
          Opens at
          <input
            type="datetime-local"
            value={form.opensAt}
            onChange={(e) => update("opensAt", e.target.value)}
          />
        </label>
        {!editMode ? (
          <label>
            Visibility
            <select value={form.visibility} onChange={(e) => update("visibility", e.target.value)}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
        ) : null}
      </div>

      <label>
        Tags
        <div className="row tagInputRow">
          <input
            list="memory-tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Type tag and press Enter"
          />
          <button className="btn ghost" type="button" onClick={() => addTag()}>Add</button>
        </div>
      </label>
      <datalist id="memory-tags">
        {availableTags.map((tag) => (
          <option key={tag._id || tag.slug} value={tag.name} />
        ))}
      </datalist>
      <div className="tagRow">
        {selectedTags.map((tag) => (
          <button className="tag removable" key={tag} type="button" onClick={() => removeTag(tag)}>
            #{tag} ×
          </button>
        ))}
      </div>

      {!editMode ? (
        <div className="formSideBySide">
          <label>
            Capsule text
            <textarea
              rows={6}
              value={form.content}
              onChange={(e) => update("content", e.target.value)}
              required
            />
          </label>
          <UploadField
            endpoint="artifactUploader"
            label="Artifact (optional)"
            value={form.artifactUrl}
            previewKind={form.artifactType}
            hint="Image, audio, PDF or text — up to 16MB"
            onChange={(url) => update("artifactUrl", url)}
            onMetaChange={(meta) => setForm((current) => ({ ...current, ...meta }))}
          />
        </div>
      ) : null}

      <div className="formSubmit">
        <button className="btn primary" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ---------------- CommentsPanel ----------------

export function CommentsPanel({ capsuleId }) {
  const { user, capsuleViewers, lastWsMessage, sendWs } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingText, setEditingText] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (!capsuleId) return;
    apiFetch(`/capsules/${capsuleId}/comments`)
      .then((data) => setComments(data.comments || []))
      .catch((err) => setError(err.message));
  }, [capsuleId]);

  useEffect(() => {
    if (!capsuleId) return undefined;
    sendWs("VIEW_CAPSULE", { capsuleId });
    return () => sendWs("LEAVE_CAPSULE", { capsuleId });
  }, [capsuleId]);

  useEffect(() => {
    if (!lastWsMessage) return;
    if (lastWsMessage.event === "COMMENT_CREATED") {
      setComments((current) => {
        const id = lastWsMessage.payload.comment._id;
        if (current.some((c) => c._id === id)) return current;
        return [...current, lastWsMessage.payload.comment];
      });
    }
    if (lastWsMessage.event === "COMMENT_UPDATED") {
      setComments((current) =>
        current.map((c) => (c._id === lastWsMessage.payload.comment._id ? lastWsMessage.payload.comment : c))
      );
    }
    if (lastWsMessage.event === "COMMENT_DELETED") {
      setComments((current) => current.filter((c) => c._id !== lastWsMessage.payload.id));
    }
  }, [lastWsMessage]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [comments.length]);

  async function submitComment(event) {
    event.preventDefault();
    if (!text.trim()) return;
    const draft = text;
    setText("");
    setError("");
    try {
      const data = await apiFetch(`/capsules/${capsuleId}/comments`, {
        method: "POST",
        body: { text: draft },
      });
      setComments((current) => {
        if (current.some((c) => c._id === data.comment._id)) return current;
        return [...current, data.comment];
      });
    } catch (err) {
      setText(draft);
      setError(err.message);
    }
  }

  async function saveEdit(commentId) {
    if (!editingText.trim()) return;
    const data = await apiFetch(`/comments/${commentId}`, {
      method: "PUT",
      body: { text: editingText },
    });
    setComments((current) => current.map((c) => (c._id === commentId ? data.comment : c)));
    setEditingId("");
    setEditingText("");
  }

  async function deleteComment(commentId) {
    if (!confirm("Delete this comment?")) return;
    await apiFetch(`/comments/${commentId}`, { method: "DELETE" });
    setComments((current) => current.filter((c) => c._id !== commentId));
  }

  return (
    <section className="card commentsCard">
      <div className="cardHeader">
        <h3>Live room</h3>
        <span className="muted small">
          {capsuleViewers.length ? `${capsuleViewers.length} viewing` : "you're first"}
        </span>
      </div>
      <div className="commentList" ref={listRef}>
        {comments.map((comment) => {
          const canModify = user?.id === comment.author?._id;
          const isEditing = editingId === comment._id;
          return (
            <article className="comment" key={comment._id}>
              <Avatar user={comment.author} size="small" />
              <div className="commentBody">
                <header>
                  <strong>{comment.author?.username || "Unknown"}</strong>
                  {comment.commentedBeforeOpen ? <span className="badge">before opening</span> : null}
                  {comment.isEdited ? <span className="muted small">· edited</span> : null}
                </header>
                {isEditing ? (
                  <div className="commentEdit">
                    <textarea
                      rows={2}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                    />
                    <div className="commentActions">
                      <button className="btn primary small" type="button" onClick={() => saveEdit(comment._id)}>Save</button>
                      <button className="btn ghost small" type="button" onClick={() => setEditingId("")}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p>{comment.text}</p>
                )}
              </div>
              {canModify && !isEditing ? (
                <div className="commentSideActions">
                  <button
                    className="iconBtn"
                    type="button"
                    title="Edit"
                    aria-label="Edit comment"
                    onClick={() => {
                      setEditingId(comment._id);
                      setEditingText(comment.text);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    className="iconBtn danger"
                    type="button"
                    title="Delete"
                    aria-label="Delete comment"
                    onClick={() => deleteComment(comment._id)}
                  >
                    ✕
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
        {!comments.length && <p className="muted">No comments yet.</p>}
      </div>
      {error ? <p className="error">{error}</p> : null}
      <form className="commentForm" onSubmit={submitComment}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Leave a note…" />
        <button className="btn primary small" type="submit">Send</button>
      </form>
    </section>
  );
}

// ---------------- OnlinePanel ----------------

export function OnlinePanel() {
  const { user, onlineUserIds } = useAuth();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch("/users")
      .then((data) => setUsers(data.users || []))
      .catch(() => setUsers([]));
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOpen(window.matchMedia("(min-width: 901px)").matches);
  }, []);

  const sortedUsers = useMemo(() => {
    const onlineSet = new Set(onlineUserIds);
    return [...users].sort((a, b) => {
      const aOnline = onlineSet.has(String(a.id || a._id));
      const bOnline = onlineSet.has(String(b.id || b._id));
      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      return (a.username || "").localeCompare(b.username || "");
    });
  }, [users, onlineUserIds]);

  if (!user) return null;

  return (
    <aside className="card sidePanel">
      <button type="button" className="cardHeader collapsibleHeader" onClick={() => setOpen((v) => !v)}>
        <h3>Members</h3>
        <span className="muted small">{onlineUserIds.length} online {open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="onlineList">
          {sortedUsers.length ? (
            sortedUsers.map((u) => {
              const isOnline = onlineUserIds.includes(String(u.id || u._id));
              return (
                <div className="onlineUser" key={u.id || u._id}>
                  <Avatar user={u} size="small" />
                  <span className="onlineName">{u.username}</span>
                  <span className={isOnline ? "dot online" : "dot"} title={isOnline ? "online" : "offline"} />
                </div>
              );
            })
          ) : (
            <p className="muted">No members yet.</p>
          )}
        </div>
      ) : null}
    </aside>
  );
}

export { formatDateTime, Avatar };
