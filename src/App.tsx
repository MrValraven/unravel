import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { PageLoading } from "./components/PageLoading";
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

/** New pages start at the top. Search-param changes (the play card position) keep the scroll. */
const useScrollToTopOnNavigate = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
};

function App() {
  useScrollToTopOnNavigate();

  return (
    <div className="app">
      <RouteErrorBoundary>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<IntroPage />} />
            <Route
              path="/reminder"
              element={<Navigate to="/about" replace />}
            />
            <Route path="/decks" element={<DeckPickerPage />} />
            <Route
              path="/questions"
              element={<Navigate to="/decks" replace />}
            />
            <Route path="/decks/:deckId" element={<DeckLandingPage />} />
            <Route path="/finder" element={<DeckFinderPage />} />
            <Route path="/play/:deckId" element={<PlayPage />} />
            <Route path="/play/:deckId/done" element={<DeckEndPage />} />
            <Route path="/custom" element={<CustomDecksPage />} />
            <Route path="/custom/new" element={<CustomDeckEditorPage />} />
            <Route path="/custom/import" element={<CustomDeckImportPage />} />
            <Route
              path="/custom/:customId/edit"
              element={<CustomDeckEditorPage />}
            />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
      <Suspense fallback={null}>
        <WhatsNewGate />
      </Suspense>
      <UpdateBanner />
    </div>
  );
}

export default App;
