import { useRouteError } from "react-router";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

/** Hands the router's caught error back to React, so RouteErrorBoundary shows its screen. */
const RethrowRouteError = () => {
  throw useRouteError();
};

/**
 * The data router's errorElement. App's own RouteErrorBoundary catches page
 * errors first; this covers the rest of the shell (banners, the What's new gate)
 * with the same friendly screen instead of React Router's developer page.
 */
export const RootRouteError = () => (
  <RouteErrorBoundary>
    <RethrowRouteError />
  </RouteErrorBoundary>
);

export default RootRouteError;
