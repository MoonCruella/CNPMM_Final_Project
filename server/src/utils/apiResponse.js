export class ApiSuccessResponse {
constructor(data = null, message = 'Success', status = 200) {
        this.status = status;
        this.success = true;
        this.data = data;
        this.message = message;
    }
}

export class ApiErrorResponse {
constructor(message = 'Error', status = 500, error = null) {
        this.status = status;
        this.success = false;
        this.message = message;
        this.error = error;
    }
}

