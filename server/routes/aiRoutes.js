import express from "express";
import multer from "multer";
import {
    generateArticle,
    generateImage,
    removeImageObject,
    removeImageBackground,
    resumeReview
} from "../controllers/aiController.js";

const upload = multer({ storage: multer.diskStorage({}) });

// Resume upload: 5MB limit, PDF/DOCX only, clean JSON errors
const resumeUpload = multer({
  storage: multer.diskStorage({}),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(pdf|docx)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only PDF or DOCX files are allowed'), ok);
  },
});

const handleResumeUpload = (req, res, next) =>
  resumeUpload.single('resume')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds 5MB limit' : err.message });
    next();
  });

const aiRouter = express.Router();
aiRouter.post("/generate-article", generateArticle);
aiRouter.post("/generate-image", generateImage);
aiRouter.post("/remove-image-object", upload.single("image"), removeImageObject);
aiRouter.post("/remove-image-background", upload.single("image"), removeImageBackground);
aiRouter.post("/resume-review", handleResumeUpload, resumeReview);

export default aiRouter;