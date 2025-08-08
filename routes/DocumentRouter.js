import multer from "multer";
import express from "express";
const DocumentRouter = express.Router();
const prisma = new PrismaClient();

import { parseAndStoreDocument } from "../services/documentService.js";