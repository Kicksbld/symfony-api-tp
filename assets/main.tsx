import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { CompanyPage } from "@/pages/CompanyPage";
import { EditProfilePage } from "@/pages/EditProfilePage";
import { HomePage } from "@/pages/HomePage";
import { ListPage } from "@/pages/ListPage";
import { ListsPage } from "@/pages/ListsPage";
import { LoginPage } from "@/pages/LoginPage";
import { MoviePage } from "@/pages/MoviePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PeoplePage } from "@/pages/PeoplePage";
import { PersonPage } from "@/pages/PersonPage";
import { DiaryTab, MovieRelationshipsTab, ProfileIndex, ProfileListsTab, ProfilePage } from "@/pages/ProfilePage";
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
                            <Route path="people" element={<PeoplePage />} />
                            <Route path="people/:id" element={<PersonPage />} />
                            <Route path="companies/:id" element={<CompanyPage />} />
                            <Route path="lists" element={<ListsPage />} />
                            <Route path="lists/:id" element={<ListPage />} />
                            <Route path="settings/profile" element={<EditProfilePage />} />
                            <Route path="users/:username" element={<ProfilePage />}>
                                <Route index element={<ProfileIndex />} />
                                <Route path="diary" element={<DiaryTab />} />
                                <Route path="watched" element={<MovieRelationshipsTab list="watched" />} />
                                <Route path="likes" element={<MovieRelationshipsTab list="likes" />} />
                                <Route path="watchlist" element={<MovieRelationshipsTab list="watchlist" />} />
                                <Route path="lists" element={<ProfileListsTab />} />
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
