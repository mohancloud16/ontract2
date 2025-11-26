// Detect if the build is production or development
const isProduction = import.meta.env.MODE === "production";

/**
 * MAIN BACKEND URLS
 * - One for regular module (provider/contractor)
 * - One for admin module
 */
export const BASE_URLS = {
  user: import.meta.env.VITE_USER_API,
  admin: import.meta.env.VITE_ADMIN_API
};

