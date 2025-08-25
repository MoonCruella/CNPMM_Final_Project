import express from 'express'
import * as userController from '../controllers/user.controller.js'
import {authenticateToken} from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', authenticateToken, userController.getUsers)
router.get('/profile/:email', authenticateToken ,userController.getUserByEmail)
//router.put('/profile/update', authenticateToken, userController.updateUser)
export default router