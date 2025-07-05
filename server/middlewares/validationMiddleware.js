import { StatusCodes } from 'http-status-codes';

export const PROPERTIES = {
    BODY: 'body',
    PARAMS: 'params',
    QUERY: 'query',
  };

export default (schema, property) => (req, res, next) => {

  if (!Object.values(PROPERTIES).includes(property)) {
    next(new Error('Invalid property type for schema validation.'));
  }

  const { value, error } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      errors: error.details.map(detail => detail.message),
    });
  }

  next();
};