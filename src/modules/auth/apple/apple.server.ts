import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key?.getPublicKey();
    callback(err, signingKey);
  });
}

export async function verifyAppleIdToken(idToken: string): Promise<{
  sub: string;
  email: string;
}> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
      },
      (err, decoded: any) => {
        if (err) return reject(err);
        if (!decoded?.email) return reject('No email in Apple token');

        resolve({
          sub: decoded.sub,
          email: decoded.email,
        });
      }
    );
  });
}
