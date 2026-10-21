import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'singlechat_super_secure_jwt_secret_2026',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
