import { Outlet, Link, NavLink } from "react-router-dom";

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b">
        <nav className="flex gap-4">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/cart">Cart</NavLink>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet /> {/* child routes render here */}
      </main>

      <footer className="p-4 border-t text-sm text-gray-500">
        © {new Date().getFullYear()} SockCS
      </footer>
    </div>
  );
}
