import { getCaseOrderById, createCaseOrder, updateCaseOrderStatus, getCasePrice } from "../daos/caseOrdersDao.js";
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { getAvailableCaseStock } from "../daos/stockDao.js";
import { getOrderStatusByName, getOrderStatusById } from "../daos/orderStatusesDao.js";
import { decrementStockByName } from "../daos/stockDao.js";
import { BankClient } from '../clients/index.js';
import { getAccountNumber } from "../daos/bankDetailsDao.js";
import simulationTimer from "./simulationController.js"
import { getEquipmentParameters } from "../daos/equipmentParametersDao.js";

/**
 * Check the status of a given case order.
 */
export const getCaseOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await getCaseOrderById(id);
        let status, response;

        if (order) {
            const orderStatus = await getOrderStatusById(order.order_status_id)

            status = StatusCodes.OK;
            response = {
                ...order,
                status: orderStatus ? orderStatus.name : null,
            };

        } else {
            status = StatusCodes.NOT_FOUND;
            response = { error: getReasonPhrase(StatusCodes.NOT_FOUND) };
        }

        res.status(status).json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * Canel a case order if it has not been paid yet
 */
export const cancelUnpaidOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await getCaseOrderById(id);
    let status, response;

    if (!order) {
      status = StatusCodes.NOT_FOUND;
      response = { error: getReasonPhrase(StatusCodes.NOT_FOUND) };
    } else {
      const paymentPendingStatus = await getOrderStatusByName('payment_pending');

      if (order.order_status_id !== paymentPendingStatus.id) {
        status = StatusCodes.BAD_REQUEST;
        response = { error: 'This order can no longer be cancelled.' };
      } else {
        // change order status to cancelled
        const cancelledStatus = await getOrderStatusByName('order_cancelled');
        await updateCaseOrderStatus(id, cancelledStatus.id);

        // refund amount paid
        if (order.amount_paid > 0 && order.account_number) {
          await BankClient.makePayment(order.account_number, order.amount_paid * 0.8, `Order cancelled, refunding 80% of order ID: ${id}`)
        }

        status = StatusCodes.NO_CONTENT;
        response = { };
      }
    }

    res.status(status).json(response);
  } catch (error) {
    console.log(error)
    next(error);
  }
};

/**
 * Create a new case order if there is enough available stock.
 */
export const postCaseOrder = async (req, res, next) => {
    try {
        const { quantity } = req.body;

        if (quantity % 1000 !== 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: 'Orders must be placed in multiples of 1000 units.',
            });
        };

        const orderStatus = await getOrderStatusByName('payment_pending');
        const stockStatus = await getAvailableCaseStock();
        const {
            plastic_ratio,
            aluminium_ratio,
            production_rate
        } = await getEquipmentParameters();

        const plasticPerCase = plastic_ratio/production_rate;
        const aluminiumPerCase = aluminium_ratio/production_rate;

        const { selling_price: sellingPrice } = await getCasePrice(plasticPerCase, aluminiumPerCase);
        const pricePerCase = Math.round(sellingPrice);

        let status, response;

        const available = stockStatus.available_units;

        if (quantity > available) {
            status = StatusCodes.BAD_REQUEST
            response = { error: 'Insufficient stock. Please try again later.' }
        } else {
            // create order
            const total_price = pricePerCase * quantity;
            const ordered_at = simulationTimer.getDate();

            const { account_number } = await getAccountNumber();

            const newOrder = await createCaseOrder({
                order_status_id: orderStatus.id,
                quantity,
                total_price,
                ordered_at,
            });

            newOrder.account_number = account_number;

            status = StatusCodes.CREATED;
            response = newOrder;
        }

        res.status(status).json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * Update order status to 'pickup_pending' when payment is received.
 */
export const markOrderPaid = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await getCaseOrderById(id);
    let status, response;

    if (!order) {
      status = StatusCodes.NOT_FOUND;
      response = { error: getReasonPhrase(StatusCodes.NOT_FOUND) };
    } else {
      const pickupPendingStatus = await getOrderStatusByName('pickup_pending');
      await updateCaseOrderStatus(id, pickupPendingStatus.id);

      status = StatusCodes.OK;
      response = { message: 'Order status updated to pickup_pending' };
    }

    res.status(status).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status to 'order_complete' when pickup is confirmed and reduce stock.
 */
export const markOrderPickedUp = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await getCaseOrderById(id);
    let status, response;

    if (!order) {
      status = StatusCodes.NOT_FOUND;
      response = { error: getReasonPhrase(StatusCodes.NOT_FOUND) };
    } else {
      const pickupPendingStatus = await getOrderStatusByName('pickup_pending');

      if (order.order_status_id !== pickupPendingStatus.id) {
        status = StatusCodes.BAD_REQUEST;
        response = { error: 'Payment has not been received for order.' };
      } else {
        // revoke stock after pickup
        await decrementStockByName('case', order.quantity);

        const completeStatus = await getOrderStatusByName('order_complete');
        await updateCaseOrderStatus(id, completeStatus.id);

        status = StatusCodes.OK;
        response = { message: 'Order status updated to order_complete and stock reduced.' };
      }
    }

    res.status(status).json(response);
  } catch (error) {
    next(error);
  }
};
