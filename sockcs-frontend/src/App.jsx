// src/App.jsx
import Header from "./components/Header";
import TopBar from "./components/TopBar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ThankYou from "./pages/ThankYou";
import OrderDetail from "./pages/OrderDetail";
import OrdersHub from "./pages/OrdersHub";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Account from "./pages/Account.jsx";

import { Routes, Route, Navigate } from "react-router-dom";
import { useCart } from "./contexts/CartContext";

import ProtectedRoute from "./routes/ProtectedRoute";
import StaffLayout from "./staff/StaffLayout";
import AdminDashboard from "./staff/pages/AdminDashboard.jsx";
import AdminEnquiries from "./staff/pages/AdminEnquiries.jsx";
import AdminOrders from "./staff/pages/AdminOrders.jsx";
import AdminOrderDetail from "./staff/pages/AdminOrderDetail.jsx";
import StaffInventory from "./staff/pages/StaffInventory";
import StaffProducts from "./staff/pages/StaffProducts.jsx";
import StaffCustomers from "./staff/pages/StaffCustomers.jsx";



function Layout() {
  const { count } = useCart();

  return (
    <>
      <TopBar />
      <Header />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Products />} />
        <Route path="/products/:id/:slug?" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order/:id/thank-you" element={<ThankYou />} />
        <Route path="/order/thank-you" element={<ThankYou />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Auth required */}
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersHub /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

        {/* Staff console NOTE: /* here so children match */}
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute requireStaff>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="enquiries" element={<AdminEnquiries />} />
                  {/* You can add more: orders, products, customers, etc. */}
                    {/* NEW: Orders list + detail */}
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="products" element={<StaffProducts />} />
          <Route path="inventory" element={<StaffInventory />} />
          <Route path="customers" element={<StaffCustomers />} />
         
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer cartCount={count} />
    </>
  );
}

export default function App() {
  // Providers already applied in src/main.jsx — keep App lean.
  return <Layout />;
}
