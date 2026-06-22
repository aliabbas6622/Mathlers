import { Router, type IRouter } from "express";
import healthRouter       from "./health";
import recordCardsRouter  from "./recordCards";
import templatesRouter    from "./templates";
import questionsRouter    from "./questions";
import studentsRouter     from "./students";
import matchesRouter      from "./matches";
import leaderboardsRouter from "./leaderboards";
import analyticsRouter    from "./analytics";
import competitionsRouter from "./competitions";
import adminRouter        from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(recordCardsRouter);
router.use(templatesRouter);
router.use(questionsRouter);
router.use(studentsRouter);
router.use(matchesRouter);
router.use(leaderboardsRouter);
router.use(analyticsRouter);
router.use(competitionsRouter);
router.use(adminRouter);

export default router;
