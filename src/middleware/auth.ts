import jwt from 'express-jwt';

function getTokenFromHeaders(headers) {
    const header = headers.headers.authorization as string
    if (!header)
        return header
    // console.log(header)
    return header.split(' ')[1]
}

export const auth = {
    required: jwt({
        algorithms: ['HS256'],
        secret: 'secret',
        userProperty: 'payload',
        getToken: getTokenFromHeaders,
    }),
    optional: jwt({
        algorithms: ['HS256'],
        secret: 'secret',
        userProperty: 'payload',
        getToken: getTokenFromHeaders,
        credentialsRequired: false,
    }),
};