const auth = {
    token: '',
    srand: ''
};

export function setToken (token) {
    auth.token = token;
}

export function setSrand (srand) {
    auth.srand = srand;
}

export function getHeaders() {
    return {
        'edger-token': auth.token,
        'edger-srand': auth.srand
    };
}