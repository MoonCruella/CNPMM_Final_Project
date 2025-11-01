import {google} from 'googleapis'
import { config } from "../config/env.js";
export default class AuthGoogleController {
    #oauthClient;
    // generate a url that asks permissions for Blogger and Google Calendar scopes
    #scopes = [
        'email',
        'profile'
    ];
    constructor() {
        this.#oauthClient = new google.auth.OAuth2(
            config.client_id,
            config.client_secret_id,
            'http://localhost:3000/api/auth/google/callback'
        )
    }

    generateUrl(){
        return this.#oauthClient.generateAuthUrl({
            access_type: 'offline',
            scope: this.#scopes
        });
    }

    async callBack(code){
        const {tokens} = await this.#oauthClient.getToken(code);
        const idToken = tokens.id_token;
        const data = await this.#oauthClient.verifyIdToken({idToken: idToken});
        return data.payload;
    }
}