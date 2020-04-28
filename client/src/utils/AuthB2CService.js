import * as Msal from 'msal';

const config = {
    auth: {
        clientId: "0b814c5c-8524-466c-bd3a-5f1b4714494c",
        authority: "https://hedons.b2clogin.com/hedons.onmicrosoft.com/B2C_1_flow",
        redirectUri: 'http://localhost:3000',
        validateAuthority: false,
        navigateToLoginRequestUrl: false
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: true
    }
};

const loginRequest = {
    scopes: ["https://hedons.onmicrosoft.com/api/user_impersonation"],
    loginHint: null
};


const requiresInteraction = errorMessage => {
    if (!errorMessage || !errorMessage.length) {
        return false;
    }

    return (
        errorMessage.indexOf("consent_required") > -1 ||
        errorMessage.indexOf("interaction_required") > -1 ||
        errorMessage.indexOf("login_required") > -1
    );
};

let context = new Msal.UserAgentApplication(config);
context.handleRedirectCallback((error) => {
    if (error) {
        const errorMessage = error.errorMessage ? error.errorMessage : "Unable to acquire access token.";
        console.error(errorMessage);
    }
});

export const b2cSignOut = () => {
    context.logout();
}

export const acquireToken = () => {
    return context.acquireTokenSilent(loginRequest)
        .catch(error => {
            if (requiresInteraction(error.errorCode)) {
                return context.acquireTokenRedirect(loginRequest);
            } else {
                return null;
            }
        });
}

export const b2cSignIn = () => {
    context.loginRedirect(loginRequest);

}
