import { lazy, Suspense, useEffect } from "react";
import { Navigate, Outlet, useLocation, type RouteObject } from "react-router";
import { ConnectionPill } from "./components/ConnectionPill";
import { PageLoading } from "./components/PageLoading";
import { RootRouteError } from "./components/RootRouteError";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { UpdateBanner } from "./components/UpdateBanner";
import "./App.scss";

const HomePage = lazy(() => import("./features/home/HomePage"));
const IntroPage = lazy(() => import("./features/intro/IntroPage"));
const DeckPickerPage = lazy(() => import("./features/decks/DeckPickerPage"));
const DeckLandingPage = lazy(() => import("./features/decks/DeckLandingPage"));
const DeckFinderPage = lazy(() => import("./features/finder/DeckFinderPage"));
const PlayPage = lazy(() => import("./features/play/PlayPage"));
const DeckEndPage = lazy(() => import("./features/play/DeckEndPage"));
const CustomDecksPage = lazy(() => import("./features/custom/CustomDecksPage"));
const CustomDeckEditorPage = lazy(
  () => import("./features/custom/CustomDeckEditorPage")
);
const CustomDeckImportPage = lazy(
  () => import("./features/custom/CustomDeckImportPage")
);
const SettingsPage = lazy(() => import("./features/settings/SettingsPage"));
const WhatsNewGate = lazy(() => import("./features/settings/WhatsNewGate"));
const NotFoundPage = lazy(() => import("./components/NotFoundPage"));
const ContinueRedirect = lazy(() => import("./components/ContinueRedirect"));

/** New pages start at the top. Search-param changes (the play card position) keep the scroll. */
const useScrollToTopOnNavigate = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
};

/** The app shell: the current page plus the banners that float over every page. */
function App() {
  useScrollToTopOnNavigate();

  return (
    <div className="app">
      <RouteErrorBoundary>
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </RouteErrorBoundary>
      <Suspense fallback={null}>
        <WhatsNewGate />
      </Suspense>
      <ConnectionPill />
      <UpdateBanner />
    </div>
  );
}

/**
 * Every page is a data route under the shell, so links and navigate() calls
 * with `viewTransition` animate. React Router drops that option for links
 * inside descendant <Routes>, which is why the pages are not matched in App.
 */
// eslint-disable-next-line react-refresh/only-export-components -- the route table belongs with the pages it lazy-loads
export const appRoutes: RouteObject[] = [
  {
    element: <App />,
    // Page errors land in App's RouteErrorBoundary first; this covers the shell itself.
    errorElement: <RootRouteError />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/about", element: <IntroPage /> },
      { path: "/reminder", element: <Navigate to="/about" replace /> },
      { path: "/decks", element: <DeckPickerPage /> },
      { path: "/questions", element: <Navigate to="/decks" replace /> },
      { path: "/decks/:deckId", element: <DeckLandingPage /> },
      { path: "/finder", element: <DeckFinderPage /> },
      { path: "/continue", element: <ContinueRedirect /> },
      { path: "/play/:deckId", element: <PlayPage /> },
      { path: "/play/:deckId/done", element: <DeckEndPage /> },
      { path: "/custom", element: <CustomDecksPage /> },
      { path: "/custom/new", element: <CustomDeckEditorPage /> },
      { path: "/custom/import", element: <CustomDeckImportPage /> },
      { path: "/custom/:customId/edit", element: <CustomDeckEditorPage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

export default App;
