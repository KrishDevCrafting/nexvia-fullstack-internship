import express from "express";
import {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/documentController.js";

const router = express.Router();

router.route("/").get(getAllDocuments).post(createDocument);
router.route("/:id").get(getDocumentById).put(updateDocument).delete(deleteDocument);

export default router;
