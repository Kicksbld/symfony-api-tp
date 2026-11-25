import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { MoviePage } from "@/pages/MoviePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { DiaryTab, ProfilePage, WatchedTab, WatchlistTab } from "@/pages/ProfilePage";
import { RegisterPage } from "@/pages/RegisterPage";
import { queryClient } from "@/lib/query-client";
import "./app.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route element={<Layout />}>
                            <Route index element={<HomePage />} />
                            <Route path="movies/:id" element={<MoviePage />} />
                            <Route path="users/:username" element={<ProfilePage />}>
                                <Route index element={<Navigate to="diary" replace />} />
                                <Route path="diary" element={<DiaryTab />} />
                                <Route path="watched" element={<WatchedTab />} />
                                <Route path="watchlist" element={<WatchlistTab />} />
                            </Route>
                            <Route path="login" element={<LoginPage />} />
                            <Route path="register" element={<RegisterPage />} />
                            <Route path="*" element={<NotFoundPage />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>,
);
