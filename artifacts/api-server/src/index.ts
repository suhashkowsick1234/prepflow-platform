import { Router, type IRouter } from "express";
import healthRouter from "./health";
import overviewRouter from "./overview";
import flashcardsRouter from "./flashcards";
import quizRouter from "./quiz";
import interviewRouter from "./interview";
import cheatsheetRouter from "./cheatsheet";
import codeRouter from "./code";
import relatedRouter from "./related";

const router: IRouter = Router();

router.use(healthRouter);
router.use(overviewRouter);
router.use(flashcardsRouter);
router.use(quizRouter);
router.use(interviewRouter);
router.use(cheatsheetRouter);
router.use(codeRouter);
router.use(relatedRouter);

export default router;