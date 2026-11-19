import { createHashRouter, Navigate } from "react-router";
import { Root } from "./Root";
import { DashboardPage } from "./pages/DashboardPage";
import { SchedulePage } from "./pages/SchedulePage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { ClassesPage } from "./pages/ClassesPage";
import { MembersPage } from "./pages/MembersPage";
import { InstructorsPage } from "./pages/InstructorsPage";
import { InstructorDetailPage } from "./pages/InstructorDetailPage";
import { PackagesPage } from "./pages/PackagesPage";
import { PackageCreatePage, PackageEditPage, PackageViewPage } from "./pages/PackageEditorPage";
import { OrdersPage }         from "./pages/OrdersPage";
import { NotificationsPage }  from "./pages/NotificationsPage";
import { AuditLogPage }       from "./pages/AuditLogPage";
import { ReportsPage }          from "./pages/ReportsPage";
import { ReconciliationPage }   from "./pages/ReconciliationPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { LoginPage } from "./pages/LoginPage";
import { LogoutPage } from "./pages/LogoutPage";

export const router = createHashRouter([
  { path: "/login",  Component: LoginPage },
  { path: "/logout", Component: LogoutPage },
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard",    Component: DashboardPage },
      { path: "schedule",     Component: SchedulePage },
      { path: "reservations", Component: ReservationsPage },
      { path: "classes",      Component: ClassesPage },
      { path: "members",      Component: MembersPage },
      { path: "instructors",  Component: InstructorsPage },
      { path: "instructors/:id", Component: InstructorDetailPage },
      { path: "packages",     Component: PackagesPage },
      { path: "packages/new", Component: PackageCreatePage },
      { path: "packages/:id", Component: PackageViewPage },
      { path: "packages/:id/edit", Component: PackageEditPage },
      { path: "orders",         Component: OrdersPage },
      { path: "notifications",  Component: NotificationsPage },
      { path: "audit-log",      Component: AuditLogPage },
      { path: "reports",          Component: ReportsPage },
      { path: "reconciliation",   Component: ReconciliationPage },
      { path: "analytics",        element: <Navigate to="/reports" replace /> },
      { path: "settings",     Component: SettingsPage },
      { path: "profile",      Component: ProfilePage },
      { path: "*",            Component: NotFoundPage },
    ],
  },
]);
