import multer from "multer";
import { AppError } from "../utils/errors.js";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, "Please upload a JPG, PNG, GIF, or WebP image."));
      return;
    }

    callback(null, true);
  },
});

export const uploadAvatar = upload.single("avatar");
export const uploadPostImage = upload.single("image");
