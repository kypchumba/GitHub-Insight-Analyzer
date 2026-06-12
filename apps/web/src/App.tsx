import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Skeleton } from "./components/ui/skeleton";

const HomePage = lazy(() => import("./pages/HomePage"));
const UserPage = lazy(() => import("./pages/UserPage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));

function LoadingScreen() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-48 md:col-span-1" />
        <Skeleton className="h-48 md:col-span-2" />
        <Skeleton className="h-72 md:col-span-3" />
      </div>
    </main>
  );
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("gia-theme");
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("gia-theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen">
      <Header theme={theme} onThemeChange={setTheme} />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/u/:username" element={<UserPage />} />
          <Route path="/compare/:left/:right" element={<ComparePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

