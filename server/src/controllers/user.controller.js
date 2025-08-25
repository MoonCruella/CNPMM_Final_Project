import response from '../helpers/response.js';
import userModel from '../models/user.model.js';
export const getUsers = async (req, res, next) => {
	try {
		const users = await userModel.find()
		res.json(users)
	}
	catch (err) {
		next(err)
	}
}
export const getUserByEmail = async(req, res, next) => {
	try {
		const email = req.params.email
		const user = await userModel.findOne({ email }).lean().exec();
		if (!user){
			return response.sendError(res, 'User is not existed', 404)
		}
		
		return response.sendSuccess(res, {
			_id: user._id, 
			email: user.email,
			fullName: user.name,
		})
	}
	catch (err) {
		next(err)
	}
}

// export const updateUser = async (req, res, next) => {
// 	try{
// 		const username = req.userName
// 		const userUpdate = req.body

// 		const userFound = await userModel.findByUsername(username)
// 		if (username !== userFound.userName){
// 			return response.sendError(res, 'Bad request', 401)
// 		}
// 		for (let key in userUpdate){
// 			userFound[key] = userUpdate[key]
// 		}
// 		await userFound.save()
// 		return response.sendSuccess(res, {
// 			_id: userFound._id,
// 			userName: userFound.userName,
// 			fullName: userFound.fullName,
// 			isOwner: req.userName != null && userFound.userName === req.userName,
// 			dob: userFound.dob
// 		})
// 	}
// 	catch (err) {
// 		next(err)
// 	}
// }