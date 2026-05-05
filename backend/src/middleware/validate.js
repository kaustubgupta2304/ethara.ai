import { z } from "zod";

export function validateBody(schema) {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (e) {
      next(e);
    }
  };
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    try {
      req.validatedQuery = schema.parse(req.query);
      next();
    } catch (e) {
      next(e);
    }
  };
}

export function validateParams(schema) {
  return (req, _res, next) => {
    try {
      req.validatedParams = schema.parse(req.params);
      next();
    } catch (e) {
      next(e);
    }
  };
}

export const idParamSchema = z.object({ id: z.string().cuid() });

export const projectUserParamsSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
});
