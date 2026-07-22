import { type RouteConfig, index, route } from "@react-router/dev/routes"

const dashboardChildRoutes: RouteConfig = [
  index("routes/dashboard._index.tsx"),
  route("analytics", "routes/dashboard.analytics.tsx"),
  route("resources", "routes/dashboard.resources.tsx"),
  route("providers", "routes/dashboard.providers.tsx"),
  route("directories", "routes/dashboard.directories.tsx"),
  route("categories", "routes/dashboard.categories.tsx"),
  route("locations", "routes/dashboard.locations.tsx"),
  route("library", "routes/dashboard.library.tsx"),
  route("upload", "routes/dashboard.upload.tsx"),
  route("settings", "routes/dashboard.settings.tsx"),
]

export default [
  index("routes/_index.tsx"),
  route("login", "routes/login.tsx"),
  route("dashboard", "routes/dashboard.tsx", dashboardChildRoutes),
] satisfies RouteConfig
