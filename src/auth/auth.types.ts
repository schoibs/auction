import { PublicUser } from '../users/user.types';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

export interface CurrentUserPayload {
  id: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}
