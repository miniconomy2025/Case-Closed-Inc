import Joi from 'joi'

export const getCaseByIdSchema = Joi.object({
  id: Joi.number().required()
});

export const orderCaseSchema = Joi.object({
  quantity: Joi.number().required()
});