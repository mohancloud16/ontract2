// App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import "./App.css";

/* Common / Individual */
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import OTPVerification from "./components/OTPVerification";
import ActivateAccount from "./components/ActivateAccount";
import ProviderProfile from "./components/ProviderProfile";
import ProviderServices from "./components/ProviderServices";
import ProviderHome from "./components/ProviderHome";
import ForgotPassword from "./components/ForgotPassword";

/* Admin */
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

/* Contractor (company) components - merged into main app */
import CompanyLogin from "./components/company/CompanyLogin";
import CompanySignup from "./components/company/CompanySignup";
import CompanyActivateAccount from "./components/company/CompanyActivateAccount";
import CompanyOTPVerification from "./components/company/CompanyOTPVerification";
import CompanyDashboardHome from "./components/company/CompanyDashboardHome";
import CompanyProfile from "./components/company/CompanyProfile";
import CompanyServices from "./components/company/CompanyServices";
import AdminApp from "./components/AdminApp";
import Notifications from "./components/Notifications";
import CompanyApp from "./components/company/CompanyApp";
import CompanyNotifications from "./components/company/CompanyNotifications";



function Layout({ user, setUser, admin, setAdmin, contractor, setContractor }) {
  const location = useLocation();

  // Hide header & footer for provider pages, contractor dashboard and admin pages
  const hideLayout =
    location.pathname.startsWith("/provider") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/contractor/dashboard");

  // Collapse bootstrap navbar on nav link click (mobile)
useEffect(() => {
  const navLinks = document.querySelectorAll(".navbar-collapse .nav-link");
  const navbarCollapse = document.querySelector(".navbar-collapse");

  if (!navbarCollapse) return;

  // Collapse the navbar when a normal nav link is clicked (not a dropdown)
  const handleLinkClick = (e) => {
    const isDropdown = e.target.classList.contains("dropdown-toggle") || e.target.closest(".dropdown-menu");
    if (isDropdown) return; // don’t close when dropdowns are clicked

    if (navbarCollapse.classList.contains("show")) {
      const bsCollapse = new window.bootstrap.Collapse(navbarCollapse, { toggle: false });
      bsCollapse.hide();
    }
  };

  // Stop dropdown clicks from closing navbar
  const dropdownMenus = document.querySelectorAll(".dropdown-menu");
  dropdownMenus.forEach((menu) => {
    menu.addEventListener("click", (e) => e.stopPropagation());
  });

  // Toggle dropdown manually on mobile
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", function (e) {
      // Prevent immediate collapse
      e.preventDefault();
      e.stopPropagation();

      // Close other open dropdowns
      dropdownToggles.forEach((other) => {
        if (other !== this) {
          const openMenu = other.nextElementSibling;
          if (openMenu && openMenu.classList.contains("show")) {
            openMenu.classList.remove("show");
          }
        }
      });

      // Toggle current dropdown menu
      const dropdownMenu = this.nextElementSibling;
      dropdownMenu.classList.toggle("show");
    });
  });

  navLinks.forEach((link) => link.addEventListener("click", handleLinkClick));

  // Cleanup
  return () => {
    navLinks.forEach((link) => link.removeEventListener("click", handleLinkClick));
    dropdownMenus.forEach((menu) => menu.removeEventListener("click", (e) => e.stopPropagation()));
    dropdownToggles.forEach((toggle) => toggle.removeEventListener("click", () => {}));
  };
}, []);


  return (
    <div className="min-h-screen d-flex flex-column" style={{ minHeight: "100vh" }}>
      {/* NAV */}
      {!hideLayout && (
        <nav className="navbar navbar-expand-lg  sticky-top">
          <div className="container">
            <Link className="navbar-brand fw-bold" to="/">
              Ontract Services
            </Link>

            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto align-items-center">
                <li className="nav-item">
                  <Link className="nav-link" to="/">Home</Link>
                </li>

                {/* Login Dropdown */}
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle" href="#" id="loginDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Login
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="loginDropdown">
                    <li><Link className="dropdown-item" to="/login">Individual</Link></li>
                    <li><Link className="dropdown-item" to="/contractor/login">Contractor</Link></li>
                  </ul>
                </li>

                {/* Signup Dropdown */}
                <li className="nav-item dropdown ms-2">
                  <a className="nav-link dropdown-toggle" href="#" id="signupDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Sign Up
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="signupDropdown">
                    <li><Link className="dropdown-item" to="/signup">Individual</Link></li>
                    <li><Link className="dropdown-item" to="/contractor/signup">Contractor</Link></li>
                  </ul>
                </li>

                {/* Optional quick links for logged-in contractor/user/admin
                {user && (
                  <li className="nav-item ms-3">
                    <button className="btn btn-outline-light btn-sm" onClick={() => { localStorage.removeItem("user"); setUser(null); window.location.href = "/"; }}>
                      Logout ({user.email || user.full_name || 'User'})
                    </button>
                  </li>
                )}
                {contractor && (
                  <li className="nav-item ms-3">
                    <button className="btn btn-outline-light btn-sm" onClick={() => { localStorage.removeItem("contractor"); setContractor(null); window.location.href = "/"; }}>
                      Logout ({contractor.head_email || contractor.company_name || 'Company'})
                    </button>
                  </li>
                )}
                {admin && (
                  <li className="nav-item ms-3">
                    <button className="btn btn-outline-light btn-sm" onClick={() => { localStorage.removeItem("admin"); setAdmin(null); window.location.href = "/admin/login"; }}>
                      Admin Logout
                    </button>
                  </li>
                )} */}
              </ul>
            </div>
          </div>
        </nav>
      )}

      {/* ROUTES */}
      <main className="flex-fill">
        <Routes>
          {/* Common / Individuals */}
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<OTPVerification setUser={setUser} />} />
          <Route path="/activate" element={<ActivateAccount setUser={setUser} />} />
          <Route path="/forgot_password" element={<ForgotPassword setUser={setUser} />} />

          {/* Provider nested */}
          <Route path="/provider_home" element={<ProviderHome user={user} />}>
            <Route path="profile" element={<ProviderProfile user={user} />} />
            <Route path="services" element={<ProviderServices user={user} />} />
            <Route path="notifications" element={<Notifications user={user} />} /> {/* Added route */}
          </Route>

          {/* Contractor routes (now inside main app) */}
          {/* <Route path="/contractor" element={<CompanyHome contractor={contractor} />} /> */}
          <Route path="/contractor/login" element={<CompanyLogin setContractor={setContractor} />} />
          <Route path="/contractor/signup" element={<CompanySignup />} />
          <Route path="/contractor/activate" element={<CompanyActivateAccount setContractor={setContractor} />} />
          <Route path="/contractor/verify_otp" element={<CompanyOTPVerification setContractor={setContractor} />} />
          <Route path="/contractor/dashboard" element={<CompanyApp contractor={contractor} setContractor={setContractor} />}>
            <Route path="home" element={<CompanyDashboardHome contractor={contractor} setContractor={setContractor} />} />
            <Route path="profile" element={<CompanyProfile contractor={contractor} setContractor={setContractor} />} />
            <Route path="services" element={<CompanyServices contractor={contractor} setContractor={setContractor} />} />
            <Route path="notifications" element={<CompanyNotifications contractor={contractor} setContractor={setContractor} />} />
          </Route>

          {/* Admin */}
          {/* <Route path="/admin/login" element={<AdminLogin setAdmin={setAdmin} />} />
          <Route path="/admin/dashboard" element={<AdminDashboard admin={admin} setAdmin={setAdmin} />} /> */}
          <Route path="/admin/*" element={<AdminApp admin={admin} setAdmin={setAdmin} />} />
          <Route path="/admin/login" element={<AdminLogin setAdmin={setAdmin} />} />

          {/* Fallback */}
          <Route path="*" element={<Home user={user} />} />
        </Routes>
      </main>

      {/* PROFESSIONAL FOOTER */}
      {!hideLayout && (
        <footer className="bg-dark text-light pt-5 mt-auto">
          <div className="container">
            <div className="row">
              <div className="col-md-3 mb-4">
                <h5 className="text-white">Ontract</h5>
                <p className="small text-muted">Connecting verified contractors and customers. Trusted, secure and easy to use.</p>
                <p className="small mt-2">© 2025 Ontract Services</p>
              </div>

              <div className="col-md-2 mb-4">
                <h6 className="text-white">Products</h6>
                <ul className="list-unstyled small">
                  <li><a className="text-light text-decoration-none" href="#">Contractor Portal</a></li>
                  <li><a className="text-light text-decoration-none" href="#">Customer App</a></li>
                  <li><a className="text-light text-decoration-none" href="#">API</a></li>
                </ul>
              </div>

              <div className="col-md-2 mb-4">
                <h6 className="text-white">Company</h6>
                <ul className="list-unstyled small">
                  <li><a className="text-light text-decoration-none" href="#">About</a></li>
                  <li><a className="text-light text-decoration-none" href="#">Careers</a></li>
                  <li><a className="text-light text-decoration-none" href="#">Blog</a></li>
                </ul>
              </div>

              <div className="col-md-3 mb-4">
                <h6 className="text-white">Resources</h6>
                <ul className="list-unstyled small">
                  <li><a className="text-light text-decoration-none" href="#">Help Center</a></li>
                  <li><a className="text-light text-decoration-none" href="#">Support</a></li>
                  <li><a className="text-light text-decoration-none" href="#">Developers</a></li>
                </ul>
              </div>

              <div className="col-md-2 mb-4">
                <h6 className="text-white">Stay Updated</h6>
                <form className="d-flex" onSubmit={(e) => e.preventDefault()}>
                  <input type="email" className="form-control form-control-sm me-2" placeholder="Your email" />
                  <button className="btn btn-sm btn-primary">Subscribe</button>
                </form>

                <div className="mt-3">
                  <a className="btn btn-sm btn-outline-light me-1" href="#" aria-label="twitter">T</a>
                  <a className="btn btn-sm btn-outline-light me-1" href="#" aria-label="linkedin">in</a>
                  <a className="btn btn-sm btn-outline-light" href="#" aria-label="facebook">f</a>
                </div>
              </div>
            </div>

            <hr className="border-secondary" />
            <div className="d-flex justify-content-between small text-muted py-2">
              <div>Terms • Privacy • Cookies</div>
              <div>Made with ❤ · Version 1.0</div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = React.useState(null);
  const [admin, setAdmin] = React.useState(null);
  const [contractor, setContractor] = React.useState(null);

  // On app load, restore user/admin/contractor from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser && storedUser !== "undefined") setUser(JSON.parse(storedUser));

      const storedAdmin = localStorage.getItem("admin");
      if (storedAdmin && storedAdmin !== "undefined") setAdmin(JSON.parse(storedAdmin));

      const storedContractor = localStorage.getItem("contractor");
      if (storedContractor && storedContractor !== "undefined") setContractor(JSON.parse(storedContractor));
    } catch (err) {
      console.error("Failed to parse localStorage user/admin/contractor:", err);
      // if parse fails, clear invalid entries
      localStorage.removeItem("user");
      localStorage.removeItem("admin");
      localStorage.removeItem("contractor");
    }
  }, []);

  return (
    <Layout
      user={user}
      setUser={setUser}
      admin={admin}
      setAdmin={setAdmin}
      contractor={contractor}
      setContractor={setContractor}
    />
  );
}
