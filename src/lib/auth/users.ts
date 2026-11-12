/**
 * Accounts. Passwords are NOT stored: each record holds a random salt and a verifier
 * (SHA-256 of the PBKDF2-SHA256 key derived from the password, 600k iterations).
 * Add a user with:  node scripts/add-user.mjs <username>
 */
export interface UserRecord {
  username: string;
  salt: string; // hex
  iterations: number;
  verifier: string; // hex
}

export const USERS: UserRecord[] = [
  { username: "cat", salt: "fc63b8adb093d163bc7e55a11003f75c", iterations: 600000, verifier: "1096f87f9449f1a5f7454ca796b212fc87ae37a787435ba2c00a848c6cc6b67d" },
  { username: "bruno", salt: "6f34a3504b3786b083e8fbe0b2fdf901", iterations: 600000, verifier: "123aa81f554a13a476aef4ff3cb97f1212a6544420c4894ff9071915b7625385" },
];
