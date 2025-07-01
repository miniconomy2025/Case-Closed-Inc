import Joi from 'joi'

export const getCaseByNameSchema = Joi.object({
  name: Joi.string().max(32).required()
});