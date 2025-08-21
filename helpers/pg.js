const {Pool}=require('pg')

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'robotyazdb',
  user: process.env.PG_USER,
  password:process.env.PG_PASSW,
  max: 12,
  idleTimeoutMillis: 30000,    // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

module.exports=pool