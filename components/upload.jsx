"use client";

import { useEffect, useRef, useState } from "react";
import { generateReactHelpers } from "@uploadthing/react";
import { getStoredToken } from "../lib/api";

const { useUploadThing } = generateReactHelpers({ url: "/api/uploadthing" });

const ACCEPT_BY_ENDPOINT = {
  avatarUploader: "image/*",
  artifactUploader: "image/*,audio/*,application/pdf,text/plain",
};

function inferArtifactType(file) {
  const type = file?.type || file?.serverData?.type || "";
  const name = file?.name || "";
  if (type.startsWith("image")) return "image";
  if (type.startsWith("audio")) return "audio";
  if (type.includes("pdf") || type.includes("text")) return "document";
  if (/\.(png|jpe?g|gif|webp)$/i.test(name)) return "image";
  if (/\.(mp3|wav|ogg|m4a)$/i.test(name)) return "audio";
  if (/\.(pdf|txt|md|docx?)$/i.test(name)) return "document";
  return "other";
}

export default function UploadField({
  endpoint,
  label,
  value,
  previewKind,
  hint,
  showPreview = true,
  onChange,
  onMetaChange,
}) {
  const inputRef = useRef(null);
  const [justUploaded, setJustUploaded] = useState(false);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    headers: () => ({ Authorization: `Bearer ${getStoredToken()}` }),
    onClientUploadComplete: (files) => {
      const file = files?.[0];
      if (!file) return;
      const url = file.ufsUrl ?? file.url;
      onChange(url);
      onMetaChange?.({
        artifactUrl: url,
        artifactFileKey: file.key,
        artifactType: inferArtifactType(file),
      });
      setJustUploaded(true);
    },
    onUploadError: (error) => alert(error.message),
  });

  useEffect(() => {
    if (!justUploaded) return undefined;
    const timer = setTimeout(() => setJustUploaded(false), 3000);
    return () => clearTimeout(timer);
  }, [justUploaded]);

  function handleFileChange(event) {
    const files = Array.from(event.target.files || []);
    if (files.length) startUpload(files);
    event.target.value = "";
  }

  const kind = previewKind || (endpoint === "avatarUploader" ? "image" : "none");
  const isImage = value && kind === "image";
  const isAvatar = endpoint === "avatarUploader";

  return (
    <div className="uploadField">
      <span className="uploadFieldLabel">{label}</span>
      <div className="uploadBox">
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={ACCEPT_BY_ENDPOINT[endpoint] || "*/*"}
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="btn primary uploadBtn"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? "Uploading…" : value ? "Replace file" : "Choose file"}
        </button>

        {justUploaded ? <span className="uploadStatus">✓ Attached</span> : null}

        <div className="uploadPreview">
          {showPreview && value ? (
            isImage ? (
              <img
                src={value}
                alt=""
                className={isAvatar ? "uploadAvatarThumb" : "uploadImageThumb"}
              />
            ) : kind === "audio" ? (
              <audio controls src={value} className="uploadAudio" />
            ) : (
              <div className="uploadFileChip">
                <span className="fileIcon">📎</span>
                <span>File attached</span>
              </div>
            )
          ) : (
            <span className="uploadHint">{hint}</span>
          )}
        </div>
      </div>
    </div>
  );
}
