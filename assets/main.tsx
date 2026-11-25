import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/components/AuthProvider";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import "./app.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<Layout />}>
                        <Route index element={<HomePage />} />
                        <Route path="login" element={<LoginPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    </StrictMode>,
);
