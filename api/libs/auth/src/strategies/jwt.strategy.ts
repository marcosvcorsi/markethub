import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const keycloakUrl =
      process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const realm = process.env.KEYCLOAK_REALM || 'markethub';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: process.env.KEYCLOAK_CLIENT_ID || 'markethub-api',
      issuer: `${keycloakUrl}/realms/${realm}`,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`,
      }),
    });
  }

  validate(payload: JwtPayload) {
    return {
      sub: payload.sub,
      email: payload.email,
      preferred_username: payload.preferred_username,
      realm_access: payload.realm_access,
    };
  }
}
