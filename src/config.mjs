import dotenv from 'dotenv';
dotenv.config();

export const db = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
}

if (!db.host) {
    throw new Error('DB_HOST must be defined.');
}
if (!db.user) {
    throw new Error('DB_USER must be defined.');
}
if (!db.password) {
    throw new Error('DB_PASSWORD must be defined.');
}
if (!db.database) {
    throw new Error('DB_DATABASE must be defined.');
}
