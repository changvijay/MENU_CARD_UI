import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AdminProvider } from './context/AdminContext'
import { CartProvider } from './context/CartContext'
import { OrderNotificationProvider } from './context/OrderNotificationContext'
import { AdminGuard } from './components/admin/AdminGuard'
import AdminLayout from './components/admin/AdminLayout'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import AuthCallback from './pages/AuthCallback'
import Checkout from './pages/Checkout'
import ViewOrders from './pages/ViewOrders'
import IngredientsPage from './pages/admin/IngredientsPage'
import AllergensPage from './pages/admin/AllergensPage'
import CategoriesPage from './pages/admin/CategoriesPage'
import FoodItemsPage from './pages/admin/FoodItemsPage'
// Operations pages
import CashFlowPage from './pages/admin/CashFlowPage'
import CafeTablesPage from './pages/admin/CafeTablesPage'
import InventoryPage from './pages/admin/InventoryPage'
import UsersPage from './pages/admin/UsersPage'
import BusinessDashboardPage from './pages/admin/BusinessDashboardPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <CartProvider>
          <OrderNotificationProvider>
            <Router>
              <div className="min-h-screen">
                <Routes>
                  {/* Public routes with navbar */}
                  <Route
                    path="*"
                    element={
                      <>
                        <Navbar />
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/orders" element={<ViewOrders />} />
                          <Route path="/auth/callback" element={<AuthCallback />} />
                          <Route path="/:tableNumber" element={<Home />} />
                        </Routes>
                      </>
                    }
                  />

                  {/* Admin routes - protected with AdminGuard and custom layout */}
                  <Route
                    path="/admin/*"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <Routes>
                            <Route path="ingredients" element={<IngredientsPage />} />
                            <Route path="allergens" element={<AllergensPage />} />
                            <Route path="categories" element={<CategoriesPage />} />
                            <Route path="food-items" element={<FoodItemsPage />} />
                            {/* Operations routes */}
                            <Route path="cash-flow" element={<CashFlowPage />} />
                            <Route path="cafe-tables" element={<CafeTablesPage />} />
                            <Route path="inventory" element={<InventoryPage />} />
                            {/* User management routes */}
                            <Route path="users" element={<UsersPage />} />
                            <Route path="dashboard" element={<BusinessDashboardPage />} />
                            <Route path="" element={<IngredientsPage />} />
                          </Routes>
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                </Routes>
              </div>
            </Router>
          </OrderNotificationProvider>
        </CartProvider>
      </AdminProvider>
    </AuthProvider>
  )
}

export default App
