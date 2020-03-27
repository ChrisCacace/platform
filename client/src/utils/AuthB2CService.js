import * as Msal from 'msal';

const config = {
    auth: {
        clientId: "ab8f5eb8-b0d5-4202-95a8-595231fc9345",
        authority: "https://cloutcompute.b2clogin.com/cloutcompute.onmicrosoft.com/B2C_1_realFlow",
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
    scopes: ["https://cloutcompute.onmicrosoft.com/api/user_impersonation"],
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
