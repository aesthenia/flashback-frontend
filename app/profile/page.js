"use client";

import { useEffect, useState } from "react";
import { Protected, useAuth } from "../../components/auth";
import { UploadField } from "../../components/capsules";

export default function ProfilePage() {
  const { user, updateMe } = useAuth();
  const [form, setForm] = useState({ username: "", bio: "", avatarUrl: "", avatarFileKey: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    setForm({
      username: user.username || "",
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || "",
      avatarFileKey: user.avatarFileKey || "",
    });
  }, [user]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  async function saveProfile(event) {
    event.preventDefault();
    const saved = await updateMe(form);
    setForm({
      username: saved.username,
      bio: saved.bio || "",
      avatarUrl: saved.avatarUrl || "",
      avatarFileKey: saved.avatarFileKey || "",
    });
    setMessage("Profile saved.");
  }

  return (
    <Protected>
      <main className="page narrow">
        <div className="pageHead"><h1>Profile</h1></div>
        <form className="form" onSubmit={saveProfile}>
          <div className="profilePreview">
            <span className="avatar large">
              {form.avatarUrl ? <img src={form.avatarUrl} alt="" /> : (form.username?.[0] || "?").toUpperCase()}
            </span>
            <div>
              <strong>{form.username}</strong>
              <p className="muted small">
                {user?.totalCapsules || 0} capsules · {user?.totalComments || 0} comments
              </p>
            </div>
          </div>
          <label>
            Username
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </label>
          <div className="formSideBySide">
            <label>
              Bio
              <textarea
                rows={6}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </label>
            <UploadField
              endpoint="avatarUploader"
              label="Avatar"
              value={form.avatarUrl}
              showPreview={false}
              hint="PNG, JPG or GIF — up to 2MB"
              onChange={(avatarUrl) => setForm((current) => ({ ...current, avatarUrl }))}
              onMetaChange={(meta) =>
                setForm((current) => ({ ...current, avatarUrl: meta.artifactUrl, avatarFileKey: meta.artifactFileKey }))
              }
            />
          </div>
          <div className="formSubmit">
            <button className="btn primary">Save</button>
            {message ? <span className="formSubmitNote">{message}</span> : null}
          </div>
        </form>
      </main>
    </Protected>
  );
}
