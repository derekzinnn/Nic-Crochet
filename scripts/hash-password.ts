/**
 * Generate a bcrypt hash for the admin password.
 * Usage: npm run admin:hash -- "your-password"
 * Paste the output into ADMIN_PASSWORD_HASH in your .env.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run admin:hash -- "your-password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log(hash);
