// React Imports
import { Suspense } from 'react'

// Router Imports
import { Navigate, Route, Routes } from 'react-router-dom'

// Component Imports
import Providers from '@/components/Providers'
import { TooltipProvider } from '@/components/ui/tooltip'
import PagesLayout from '@/components/layout/PagesLayout'
import BlankLayout from '@/components/layout/BlankLayout'
import ScrollToTop from '@/components/layout/ScrollToTop'

// Page Imports
import NotFound from '@/pages/not-found'
import OrdersDashboard from '@/pages/dashboard/orders'
import MailPage from '@/pages/apps/mail'
import CalendarApp from '@/pages/apps/calendar'
import UsersListPage from '@/pages/apps/users/list'
import UserViewPage from '@/pages/apps/users/view'
import DataTablePage from '@/pages/datatable'
import HorizontalFormPage from '@/pages/forms/form-layouts/horizontal'
import VerticalFormPage from '@/pages/forms/form-layouts/vertical'
import FormValidationPage from '@/pages/forms/form-validation'
import UserProfilePage from '@/pages/user-profile'
import UserSettingsPage from '@/pages/user-settings'
import LoginPage from '@/pages/auth/login'
import RegisterPage from '@/pages/auth/register'
import ForgotPasswordPage from '@/pages/auth/forgot-password'
import ResetPasswordPage from '@/pages/auth/reset-password'
import TwoStepsPage from '@/pages/auth/two-steps'
import VerifyEmailPage from '@/pages/auth/verify-email'
import ErrorPage from '@/pages/misc/error-page'

const App = () => {
  return (
    <>
      <Providers sidebarDefaultOpen={true}>
        <TooltipProvider>
          <Suspense fallback={null}>
            <Routes>
              {/* Redirects (previously handled by next.config redirects) */}
              <Route element={<PagesLayout />}>
                <Route path='/' element={<Navigate to='/dashboard/orders' replace />} />
                <Route path='/apps/users' element={<Navigate to='/apps/users/list' replace />} />

                {/* Pages */}
                <Route path='/dashboard/orders' element={<OrdersDashboard />} />
                <Route path='/apps/mail' element={<MailPage />} />
                <Route path='/apps/calendar' element={<CalendarApp />} />
                <Route path='/apps/users/list' element={<UsersListPage />} />
                <Route path='/apps/users/view' element={<UserViewPage />} />
                <Route path='/datatable' element={<DataTablePage />} />
                <Route path='/forms/form-layouts/horizontal' element={<HorizontalFormPage />} />
                <Route path='/forms/form-layouts/vertical' element={<VerticalFormPage />} />
                <Route path='/forms/form-validation' element={<FormValidationPage />} />
                <Route path='/pages/user-profile' element={<UserProfilePage />} />
                <Route path='/pages/user-settings' element={<UserSettingsPage />} />
              </Route>

              {/* Blank (auth & misc) pages */}
              <Route element={<BlankLayout />}>
                <Route path='/pages/auth/login' element={<LoginPage />} />
                <Route path='/pages/auth/register' element={<RegisterPage />} />
                <Route path='/pages/auth/forgot-password' element={<ForgotPasswordPage />} />
                <Route path='/pages/auth/reset-password' element={<ResetPasswordPage />} />
                <Route path='/pages/auth/two-steps' element={<TwoStepsPage />} />
                <Route path='/pages/auth/verify-email' element={<VerifyEmailPage />} />
                <Route path='/pages/misc/error-page' element={<ErrorPage />} />
              </Route>

              {/* 404 */}
              <Route path='*' element={<NotFound />} />
            </Routes>
          </Suspense>
        </TooltipProvider>
      </Providers>

      <ScrollToTop />
    </>
  )
}

export default App