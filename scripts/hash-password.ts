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

// Next.js's env loader expands `$`, which corrupts bcrypt hashes. Escape each
// `$` with a backslash and paste the ESCAPED line into .env.
const escaped = hash.replace(/\$/g, "\\$");

console.log("\nRaw hash:\n" + hash);
console.log("\nPaste this line into .env (── $ escaped for Next.js ──):");
console.log(`ADMIN_PASSWORD_HASH="${escaped}"\n`);
