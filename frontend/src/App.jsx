// App.jsx
import React, { useEffect, useRef, useState } from "react";
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

/* Contractor (company) */
import CompanyLogin from "./components/company/CompanyLogin";
import CompanySignup from "./components/company/CompanySignup";
import CompanyActivateAccount from "./components/company/CompanyActivateAccount";
import CompanyOTPVerification from "./components/company/CompanyOTPVerification";
import CompanyDashboardHome from "./components/company/CompanyDashboardHome";
import CompanyProfile from "./components/company/CompanyProfile";
import CompanyServices from "./components/company/CompanyServices";
import CompanyNotifications from "./components/company/CompanyNotifications";

import Notifications from "./components/Notifications";
import AdminApp from "./components/AdminApp";
import CompanyApp from "./components/company/CompanyApp";

function Layout({ user, setUser, admin, setAdmin, contractor, setContractor }) {
  const location = useLocation();

  // Hide layout on dashboard paths
  const hideLayout =
    location.pathname.startsWith("/provider") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/contractor/dashboard");

  // Navbar + dropdown state
  const [navOpen, setNavOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  const loginRef = useRef(null);
  const signupRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (
        loginRef.current &&
        !loginRef.current.contains(e.target) &&
        signupRef.current &&
        !signupRef.current.contains(e.target)
      ) {
        setLoginOpen(false);
        setSignupOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Helper to close everything (used when clicking nav links)
  const closeAllMenus = () => {
    setNavOpen(false);
    setLoginOpen(false);
    setSignupOpen(false);
  };

  return (
    <div className="min-h-screen d-flex flex-column">
      {/* NAVBAR */}
      {!hideLayout && (
        <nav className="navbar navbar-expand-lg sticky-top bg-light shadow-sm">
          <div className="container">
            <Link
              className="navbar-brand fw-bold"
              to="/"
              onClick={closeAllMenus}
            >
              Ontract Services
            </Link>

            {/* Mobile hamburger toggle */}
            <button
              className="navbar-toggler"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={navOpen ? "true" : "false"}
              onClick={() => {
                setNavOpen((prev) => !prev);
                // When opening/closing main nav, collapse dropdowns
                setLoginOpen(false);
                setSignupOpen(false);
              }}
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            {/* Collapsible nav content */}
            <div
              className={`collapse navbar-collapse ${
                navOpen ? "show" : ""
              }`}
              id="navbarNav"
            >
              <ul className="navbar-nav ms-auto align-items-center">
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/"
                    onClick={closeAllMenus}
                  >
                    Home
                  </Link>
                </li>

                {/* LOGIN DROPDOWN */}
                <li className="nav-item dropdown" ref={loginRef}>
                  <button
                    className="nav-link btn dropdown-toggle"
                    type="button"
                    onClick={() => {
                      setSignupOpen(false);
                      setLoginOpen((prev) => !prev);
                    }}
                  >
                    Login
                  </button>

                  {loginOpen && (
                    <ul className="dropdown-menu show dropdown-menu-end mt-2">
                      <li>
                        <Link
                          className="dropdown-item"
                          to="/login"
                          onClick={closeAllMenus}
                        >
                          Individual
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="/contractor/login"
                          onClick={closeAllMenus}
                        >
                          Contractor
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                {/* SIGNUP DROPDOWN */}
                <li className="nav-item dropdown ms-2" ref={signupRef}>
                  <button
                    className="nav-link btn dropdown-toggle"
                    type="button"
                    onClick={() => {
                      setLoginOpen(false);
                      setSignupOpen((prev) => !prev);
                    }}
                  >
                    Sign Up
                  </button>

                  {signupOpen && (
                    <ul className="dropdown-menu show dropdown-menu-end mt-2">
                      <li>
                        <Link
                          className="dropdown-item"
                          to="/signup"
                          onClick={closeAllMenus}
                        >
                          Individual
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="/contractor/signup"
                          onClick={closeAllMenus}
                        >
                          Contractor
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </nav>
      )}

      {/* ROUTES */}
      <main className="flex-fill">
        <Routes>
          {/* User */}
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/verify-otp"
            element={<OTPVerification setUser={setUser} />}
          />
          <Route
            path="/activate"
            element={<ActivateAccount setUser={setUser} />}
          />
          <Route path="/forgot_password" element={<ForgotPassword />} />

          {/* Provider */}
          <Route path="/provider_home" element={<ProviderHome user={user} />}>
            <Route path="profile" element={<ProviderProfile user={user} />} />
            <Route path="services" element={<ProviderServices user={user} />} />
            <Route
              path="notifications"
              element={<Notifications user={user} />}
            />
          </Route>

          {/* Contractor auth */}
          <Route
            path="/contractor/login"
            element={<CompanyLogin setContractor={setContractor} />}
          />
          <Route path="/contractor/signup" element={<CompanySignup />} />
          <Route
            path="/contractor/activate"
            element={<CompanyActivateAccount setContractor={setContractor} />}
          />
          <Route
            path="/contractor/verify_otp"
            element={<CompanyOTPVerification setContractor={setContractor} />}
          />

          {/* Contractor dashboard – pass contractor to children */}
          <Route
            path="/contractor/dashboard"
            element={
              <CompanyApp
                contractor={contractor}
                setContractor={setContractor}
              />
            }
          >
            <Route
              path="home"
              element={
                <CompanyDashboardHome
                  contractor={contractor}
                  setContractor={setContractor}
                />
              }
            />
            <Route
              path="profile"
              element={<CompanyProfile contractor={contractor} />}
            />
            <Route
              path="services"
              element={<CompanyServices contractor={contractor} />}
            />
            <Route
              path="notifications"
              element={
                <CompanyNotifications contractor={contractor} />
              }
            />
          </Route>

          {/* Admin */}
          <Route
            path="/admin/*"
            element={<AdminApp admin={admin} setAdmin={setAdmin} />}
          />
          <Route
            path="/admin/login"
            element={<AdminLogin setAdmin={setAdmin} />}
          />

          {/* Optional: 404 fallback */}
          {/* <Route path="*" element={<Home user={user} />} /> */}
        </Routes>
      </main>
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
      if (storedUser && storedUser !== "undefined") {
        setUser(JSON.parse(storedUser));
      }

      const storedAdmin = localStorage.getItem("admin");
      if (storedAdmin && storedAdmin !== "undefined") {
        setAdmin(JSON.parse(storedAdmin));
      }

      const storedContractor = localStorage.getItem("contractor");
      if (storedContractor && storedContractor !== "undefined") {
        setContractor(JSON.parse(storedContractor));
      }
    } catch (err) {
      console.error(
        "Failed to parse localStorage user/admin/contractor:",
        err
      );
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

