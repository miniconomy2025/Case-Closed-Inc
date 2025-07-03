import { StatusCodes } from 'http-status-codes';

export const handleCollection = async (req, res, next) => {
    try {

        // 1. Buck logistics will come collect an order
        // We will give the order ref or id

        // 2. Hand over order
        // deduct cases stock for x amount on the order 

        // 3. Mark order as status complete/collected

        return res
            .status(StatusCodes.OK)
            .json({ message: 'Collection successfully recorded' });

    } catch (error) {
        next(error);
    };
};