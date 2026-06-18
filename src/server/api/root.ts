import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { profilesRouter } from "~/server/api/routers/profiles";
import { videosRouter } from "~/server/api/routers/videos";
import { categoriesRouter } from "~/server/api/routers/categories";
import { reviewsRouter } from "~/server/api/routers/reviews";
import { watchHistoryRouter } from "~/server/api/routers/watchHistory";
import { recommendationsRouter } from "~/server/api/routers/recommendations";
import { adminRouter } from "~/server/api/routers/admin";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  profiles: profilesRouter,
  videos: videosRouter,
  categories: categoriesRouter,
  reviews: reviewsRouter,
  watchHistory: watchHistoryRouter,
  recommendations: recommendationsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
