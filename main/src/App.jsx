import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import SiteLayout from "./layouts/SiteLayout";
import HomePage from "./pages/HomePage";
import {
  shouldExposeAppConsole,
  shouldOpenAppConsoleAtRoot,
} from "./pwa/appAccessGate";
import PwaOwnerGate from "./pwa/PwaOwnerGate";

// --- Route-level code splitting ---
// HomePage stays eager (landing page, needed immediately).
// All other pages are lazy-loaded to reduce initial bundle size.
const AppConsolePage = lazy(() => import("./pages/AppConsolePage"));
const BiliHubPage = lazy(() => import("./pages/BiliHubPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AiTrafficPage = lazy(() => import("./pages/AiTrafficPage"));
const GalleryAlbumPage = lazy(() => import("./pages/GalleryAlbumPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const MomentsPage = lazy(() => import("./pages/MomentsPage"));
const AboutSitePage = lazy(() => import("./pages/AboutSitePage"));
const AboutProjectPage = lazy(() => import("./pages/AboutProjectPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const BuildPage = lazy(() => import("./pages/BuildPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const PageFallback = () => (
  <div className="flex-center min-h-[60vh] w-full">
    <div className="three-body">
      <div className="three-body__dot"></div>
      <div className="three-body__dot"></div>
      <div className="three-body__dot"></div>
    </div>
  </div>
);

const RootEntry = () => {
  const hostname = typeof window === "undefined" ? "" : window.location.hostname;
  return shouldOpenAppConsoleAtRoot({ hostname, pathname: "/" }) ? (
    <Navigate to="/app" replace />
  ) : (
    <HomePage />
  );
};

const AppConsoleEntry = () => {
  const hostname = typeof window === "undefined" ? "" : window.location.hostname;
  return shouldExposeAppConsole({ hostname }) ? (
    <AppConsolePage />
  ) : (
    <Navigate to="/" replace />
  );
};

function App() {
  return (
    <PwaOwnerGate>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <ErrorBoundary>
          <Routes>
            <Route path="app" element={<AppConsoleEntry />} />
            <Route element={<SiteLayout />}>
              <Route index element={<RootEntry />} />
              <Route path="bili" element={<BiliHubPage />} />
              <Route path="ai-traffic" element={<AiTrafficPage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="gallery/:albumId" element={<GalleryAlbumPage />} />
              <Route path="moments" element={<MomentsPage />} />
              <Route path="about" element={<AboutSitePage />} />
              <Route path="about/projects/:projectId" element={<AboutProjectPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="build" element={<BuildPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          </ErrorBoundary>
        </Suspense>
      </BrowserRouter>
    </PwaOwnerGate>
  );
}

export default App;
