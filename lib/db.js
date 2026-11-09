import mysql from "mysql2/promise";

// Koneksi pool MySQL dengan dukungan SSL Aiven.
// DB_CA_CERT berisi isi ca.pem yang di-encode base64 (satu baris).
const globalForDb = globalThis;

function createPool() {
  const ca = process.env.DB_CA_CERT
    ? Buffer.from(process.env.DB_CA_CERT, "base64").toString("utf-8")
    : undefined;

  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: ca ? { ca, rejectUnauthorized: true } : undefined,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  });
}

// Simpan di globalThis agar tidak membuat pool baru saat hot reload (dev).
export const pool = globalForDb._mysqlPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb._mysqlPool = pool;
