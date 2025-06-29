import { getCaseByName, getAllCases } from "../daos/caseDao.js";
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

export const getCases = async (req, res, next) => {
  try {
    const cases = await getAllCases();
    const status = StatusCodes.OK;
    const response = cases || []; 

    res.status(status).json(response);
  } catch (error) {
    next(error);
  }
};

export const getCase = async (req, res, next) => {
  try {
    const { name } = req.params;
    const caseItem = await getCaseByName(name);
    let status, response;

    if (caseItem) {
      status = StatusCodes.OK;
      response = caseItem;
    } else {
      status = StatusCodes.NOT_FOUND;
      response = { error: getReasonPhrase(StatusCodes.NOT_FOUND) };
    }

    res.status(status).json(response);
  } catch (error) {
    next(error);
  }
};