import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  CORS_ORIGIN: Joi.string().required(),
  AUCTION_MIN_DURATION_SECONDS: Joi.number().required(),
  AUCTION_MAX_DURATION_SECONDS: Joi.number().required(),
  AUCTION_SCANNER_INTERVAL_SECONDS: Joi.number().required(),
});
