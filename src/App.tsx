import { Navigate, Route, Routes } from "react-router-dom"

import { GuestRoute, ProtectedRoute } from "@/components/protected-route"
import { RootLayout } from "@/layouts/root-layout"
import { DashboardLayout } from "@/layouts/dashboard-layout"
import { CategoriesPage } from "@/pages/categories-page"
import { DashboardPage } from "@/pages/dashboard-page"
import { DirectoriesPage } from "@/pages/directories-page"
import { LibraryPage } from "@/pages/library-page"
import { LocationsPage } from "@/pages/locations-page"
import { LoginPage } from "@/pages/login-page"
import { ProvidersPage } from "@/pages/providers-page"
import { ResourcesPage } from "@/pages/resources-page"
import { SettingsPage } from "@/pages/settings-page"
import { UploadPage } from "@/pages/upload-page"

export function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<Navigate to="/login" replace />} />

        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="providers" element={<ProvidersPage />} />
            <Route path="directories" element={<DirectoriesPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  )
}
