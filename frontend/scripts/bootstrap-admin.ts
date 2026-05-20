/**
 * Bootstrap the first administrator (defaults: admin@flowforge.com / admin123 for local dev).
 *
 * Usage:
 *   pnpm db:seed
 *
 * Override defaults:
 *   ADMIN_EMAIL=ops@company.com ADMIN_PASSWORD='...' ADMIN_NAME='Ops Lead' pnpm db:seed
 */
import "../prisma/seed";
