import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';

import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import StudentListPage from '../pages/students/StudentListPage';
import StudentEnrollmentPage from '../pages/students/StudentEnrollmentPage';
import StudentDetailPage from '../pages/students/StudentDetailPage';
import FeeCollectionTerminalPage from '../pages/fees/FeeCollectionTerminalPage';
import FeeAnalyticsPage from '../pages/fees/FeeAnalyticsPage';
import MonthlyFeeGridPage from '../pages/fees/MonthlyFeeGridPage';
import DuesListPage from '../pages/fees/DuesListPage';
import FeeStructuresPage from '../pages/fees/FeeStructuresPage';
import PaymentsHistoryPage from '../pages/payments/PaymentsHistoryPage';
import FrontDeskAttendancePage from '../pages/attendance/FrontDeskAttendancePage';
import AttendanceReportsPage from '../pages/attendance/AttendanceReportsPage';
import StudentDashboardPage from '../pages/student_portal/StudentDashboardPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import AuditLogsPage from '../pages/admin/AuditLogsPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Staff & Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'LIBRARY_STAFF']} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/attendance/desk" element={<FrontDeskAttendancePage />} />
          <Route path="/fees/collect" element={<FeeCollectionTerminalPage />} />
          <Route path="/fees/dues" element={<DuesListPage />} />
          <Route path="/fees/analytics" element={<FeeAnalyticsPage />} />
          <Route path="/fees/monthly" element={<MonthlyFeeGridPage />} />
          <Route path="/students" element={<StudentListPage />} />
          <Route path="/students/new" element={<StudentEnrollmentPage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />
          <Route path="/fees/structures" element={<FeeStructuresPage />} />
          <Route path="/payments" element={<PaymentsHistoryPage />} />
          <Route path="/attendance/reports" element={<AttendanceReportsPage />} />
        </Route>
      </Route>

      {/* Admin Only Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Route>

      {/* Student Portal Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route element={<AppLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/student/attendance" element={<StudentDashboardPage />} />
          <Route path="/student/fees" element={<StudentDashboardPage />} />
          <Route path="/student/id-card" element={<StudentDashboardPage />} />
        </Route>
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
