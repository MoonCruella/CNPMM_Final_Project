import dotenv from 'dotenv'
dotenv.config()
export const config = {
    mongodbUri: process.env.MONGODB_CONN,
    port: process.env.PORT,
    accessTokenKey: process.env.ACCESS_TOKEN_KEY,
    accessTokenLife: process.env.ACCESS_TOKEN_LIFE,
    email: process.env.EMAIL_USER,
    passEmail: process.env.EMAIL_PASS
}
