import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/api/scan-id(.*)",
  "/api/__clerk(.*)",
]);

const satelliteOptions =
  process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === "true"
    ? {
        domain: process.env.NEXT_PUBLIC_CLERK_DOMAIN,
        isSatellite: true as const,
      }
    : {};

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  },
  satelliteOptions
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
