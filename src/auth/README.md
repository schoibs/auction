# Auth Module

This module owns authentication for the auction API.

It answers three questions:

- How does a new user register?
- How does an existing user log in?
- How does a protected route know who the current user is?

The current public routes are:

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

## File Map

```text
src/auth
  auth.module.ts        -> wires auth dependencies together
  auth.controller.ts    -> exposes /auth/register, /auth/login, /auth/me
  auth.service.ts       -> hashes passwords, checks passwords, signs JWTs
  auth.types.ts         -> shared TypeScript auth response/payload types
  jwt.strategy.ts       -> verifies Bearer tokens and builds request.user
  dto
    register.dto.ts     -> validates register request bodies
    login.dto.ts        -> validates login request bodies

src/common
  guards/jwt-auth.guard.ts
    -> route guard that runs the Passport "jwt" strategy

  decorators/current-user.decorator.ts
    -> reads request.user in controllers
```

## Module Wiring

`AuthModule` imports:

```text
UsersModule
  Needed so AuthService and JwtStrategy can find users.

PassportModule
  Needed for Passport guards and strategies.

JwtModule.registerAsync(...)
  Needed so JwtService can sign tokens with JWT_SECRET and JWT_EXPIRES_IN
  from ConfigService.
```

`JwtModule` signs tokens.

`PassportModule` helps authenticate incoming requests using strategies.

They sound similar at first, but they do different jobs:

```text
JwtModule       -> create/sign JWTs
PassportModule  -> run auth strategies on incoming requests
```

## Register Flow

Registration creates a user and immediately returns an access token.

```text
POST /auth/register
  |
  v
AuthController.register(registerDto)
  |
  v
AuthService.register(registerDto)
  |
  v
bcrypt.hash(registerDto.password)
  |
  v
UsersService.create({ email, username, passwordHash })
  |
  v
jwtService.signAsync(payload)
  |
  v
return { accessToken, user }
```

The raw password should only exist briefly during the request. The database stores:

```text
password_hash
```

not:

```text
password
```

The token payload is:

```ts
{
  sub: user.id,
  email: user.email,
  username: user.username,
}
```

`sub` means "subject." In this app, the subject is the user ID.

## Login Flow

Login checks an existing user and returns a fresh access token.

```text
POST /auth/login
  |
  v
AuthController.login(loginDto)
  |
  v
AuthService.login(loginDto)
  |
  v
UsersService.findByEmail(loginDto.email)
  |
  v
bcrypt.compare(loginDto.password, user.passwordHash)
  |
  v
jwtService.signAsync(payload)
  |
  v
return { accessToken, user }
```

Register and login both return the same response shape:

```json
{
  "accessToken": "...",
  "user": {
    "id": "uuid",
    "email": "seller@example.com",
    "username": "seller"
  }
}
```

The response must not include `passwordHash`.

## What Signing a JWT Means

`jwtService.signAsync(payload)` creates a token string with three parts:

```text
header.payload.signature
```

The payload contains identity claims:

```json
{
  "sub": "user-id",
  "email": "seller@example.com",
  "username": "seller"
}
```

The signature is created using `JWT_SECRET`.

That signature proves:

```text
This token came from this server, and the header/payload were not changed.
```

JWT payloads are signed, not encrypted. Anyone holding the token can decode the payload, so never put secrets, raw passwords, or password hashes inside a JWT.

## Protected Route Flow

`GET /auth/me` is protected:

```ts
@UseGuards(JwtAuthGuard)
@Get('me')
me(@CurrentUser() user: CurrentUserPayload) {
  return user;
}
```

When the request includes:

```text
Authorization: Bearer <access-token>
```

the flow is:

```text
JwtAuthGuard
  |
  v
AuthGuard('jwt')
  |
  v
JwtStrategy
  |
  v
verify token signature and expiry
  |
  v
validate(payload)
  |
  v
UsersService.findById(payload.sub)
  |
  v
request.user = { id, email, username }
  |
  v
@CurrentUser() returns request.user
```

The route handler does not parse the token itself. By the time `me(...)` runs, the guard and strategy have already done the auth work.

## DTOs

DTOs validate request bodies before they reach the service.

`RegisterDto` requires:

```text
email     -> valid email
username  -> at least 3 chars, letters/numbers/underscores only
password  -> at least 8 chars
```

`LoginDto` requires:

```text
email     -> valid email
password  -> at least 8 chars
```

These decorators only work because `ValidationPipe` is enabled globally in `main.ts`.


## Manual Smoke Tests

Register:

```bash
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@example.com",
    "username": "seller",
    "password": "password123"
  }'
```

Login:

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@example.com",
    "password": "password123"
  }'
```

Check the current user:

```bash
curl -s http://localhost:3000/auth/me \
  -H "Authorization: Bearer <access-token>"
```

Without a token, `/auth/me` should return `401 Unauthorized`.

With a valid token, it should return:

```json
{
  "id": "uuid",
  "email": "seller@example.com",
  "username": "seller"
}
```
