import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { AuthLayout } from "@/components/AuthLayout";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { CompanyPage } from "@/pages/CompanyPage";
import { EditProfilePage } from "@/pages/EditProfilePage";
import { FeedPage } from "@/pages/FeedPage";
import { CatalogPage } from "@/pages/CatalogPage";
import { HomePage } from "@/pages/HomePage";
import { ListPage } from "@/pages/ListPage";
import { ListsPage } from "@/pages/ListsPage";
import { LogEntryPage } from "@/pages/LogEntryPage";
import { LoginPage } from "@/pages/LoginPage";
import { MembersPage } from "@/pages/MembersPage";
import { MoviePage } from "@/pages/MoviePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PeoplePage } from "@/pages/PeoplePage";
import { PersonPage } from "@/pages/PersonPage";
import { DiaryTab, MovieRelationshipsTab, ProfileIndex, ProfileListsTab, ProfilePage } from "@/pages/ProfilePage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ReviewsPage } from "@/pages/ReviewsPage";
import { queryClient } from "@/lib/query-client";
import "./app.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {/* Les animations de motion suivent le réglage « réduire les animations » du système. */}
                <MotionConfig reducedMotion="user">
                    <BrowserRouter>
                        <Routes>
                            <Route element={<Layout immersive />}>
                                <Route index element={<HomePage />} />
                                <Route path="movies/:id" element={<MoviePage />} />
                            </Route>
                            <Route element={<Layout />}>
                                <Route path="films" element={<CatalogPage />} />
                                <Route path="people" element={<PeoplePage />} />
                                <Route path="people/:id" element={<PersonPage />} />
                                <Route path="companies/:id" element={<CompanyPage />} />
                                <Route path="lists" element={<ListsPage />} />
                                <Route path="lists/:id" element={<ListPage />} />
                                <Route path="settings/profile" element={<EditProfilePage />} />
                                <Route path="users" element={<MembersPage />} />
                                <Route path="users/:username" element={<ProfilePage />}>
                                    <Route index element={<ProfileIndex />} />
                                    <Route path="diary" element={<DiaryTab />} />
                                    <Route path="watched" element={<MovieRelationshipsTab list="watched" />} />
                                    <Route path="likes" element={<MovieRelationshipsTab list="likes" />} />
                                    <Route path="watchlist" element={<MovieRelationshipsTab list="watchlist" />} />
                                    <Route path="lists" element={<ProfileListsTab />} />
                                </Route>
                                <Route path="reviews" element={<ReviewsPage />} />
                                <Route path="feed" element={<FeedPage />} />
                                <Route path="log-entries/:id" element={<LogEntryPage />} />
                                <Route path="*" element={<NotFoundPage />} />
                            </Route>
                            <Route element={<AuthLayout />}>
                                <Route path="login" element={<LoginPage />} />
                                <Route path="register" element={<RegisterPage />} />
                            </Route>
                        </Routes>
                    </BrowserRouter>
                </MotionConfig>
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>,
);
