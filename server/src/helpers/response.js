import {ApiSuccessResponse, ApiErrorResponse} from '../utils/apiResponse.js';
function sendSuccess(res, data, message = 'Success', status = 200) {
    const response = new ApiSuccessResponse(data, message, status);
    return res.status(status).json(response);
}

function sendError(res, message = 'Error', status = 500, error = null) {
    const response = new ApiErrorResponse(message, status, error);
    return res.status(status).json(response);
}

export default {
    sendSuccess,
    sendError,
}