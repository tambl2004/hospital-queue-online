// backend/config/database.js
const mysql = require('mysql2/promise');

let pool = null;

const connectDB = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'benhvien',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log(`MySQL Connected: ${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'benhvien'}`);
    connection.release();
  } catch (error) {
    console.error('Error connecting to MySQL:', error.message);
    process.exit(1);
  }
};

// Auto connect when this file is required
connectDB();

// Export pool for use in other files
const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDB() first.');
  }
  return pool;
};

module.exports = { connectDB, getPool };
