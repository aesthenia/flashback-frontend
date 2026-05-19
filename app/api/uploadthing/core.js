import { createUploadthing } from "uploadthing/next";
import jwt from "jsonwebtoken";

const f = createUploadthing();

function requireUploadUser(req) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    throw new Error("Upload requires authentication");
  }
  return jwt.verify(token, process.env.JWT_SECRET || "test-secret");
}

export const ourFileRouter = {
  avatarUploader: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = requireUploadUser(req);
      return { userId: user.id, purpose: "avatar" };
    })
    .onUploadComplete(async ({ metadata, file }) => ({
      url: file.url,
      key: file.key,
      name: file.name,
      purpose: metadata.purpose,
      userId: metadata.userId,
    })),

  artifactUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
    audio: { maxFileSize: "16MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    text: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = requireUploadUser(req);
      return { userId: user.id, purpose: "capsule-artifact" };
    })
    .onUploadComplete(async ({ metadata, file }) => ({
      url: file.url,
      key: file.key,
      name: file.name,
      purpose: metadata.purpose,
      userId: metadata.userId,
    })),
};
