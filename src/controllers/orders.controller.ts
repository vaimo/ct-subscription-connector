import { UpdateAction } from '@commercetools/sdk-client-v2';
import CustomError from '../errors/custom.error';
import { Resource } from '../interfaces/resource.interface';
import fetch from 'node-fetch';

/**
 * Handle the create action for orders
 *
 * @param {Resource} resource The resource from the request body
 * @returns {object}
 */
const create = async (resource: Resource) => {
    const orderDraft = JSON.parse(JSON.stringify(resource));
    const updateActions: Array<UpdateAction> = [];

    const hasSubscriptionProduct = orderDraft.obj.lineItems.some((lineItem: any) => {
        return lineItem.productType?.obj?.key === 'subscription';
    });

    if (!hasSubscriptionProduct) {
        return { statusCode: 200, message: 'No subscription products in the order' };
    }

    // Prepare the data to send to the Fly.io HTTPS API
    const orderData = {
        orderId: orderDraft.id,
        customerId: orderDraft.obj.customerId,
        lineItems: orderDraft.obj.lineItems,
    };

    console.log(orderDraft);

    return { statusCode: 200, actions: updateActions }

    // try {
    //     // Call the Fly.io API
    //     const response = await fetch('https://ct-subscription.fly.dev/subscriptions/add', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify(orderData),
    //     });
    //
    //     if (!response.ok) {
    //         throw new Error(`Fly.io API call failed: ${response.statusText}`);
    //     }
    //
    //     // Add an update action to mark the order as processed
    //     const updateAction: UpdateAction = {
    //         action: 'addCustomField',
    //         name: 'processedByExtension',
    //         value: true,
    //     };
    //
    //     updateActions.push(updateAction);
    //
    //     return { statusCode: 201, actions: updateActions };
    // } catch (error: any) {
    //     console.error('Error calling Fly.io API:', error.message);
    //     throw new CustomError('ApiError', 500, `Failed to process order: ${error.message}`);
    // }
};

/**
 * Handle the order controller according to the action
 *
 * @param {string} action The action that comes with the request. Could be `Create` or `Update`
 * @param {Resource} resource The resource from the request body
 * @returns {Promise<object>} The data from the method that handles the action
 */
export const orderController = async (
    action: string,
    resource: Resource
): Promise<object> => {
    switch (action) {
        case 'Create': {
            return await create(resource);
        }
        case 'Update':
            throw new CustomError(
                400,
                `Update action is not supported`
            );

        default:
            throw new CustomError(
                400,
                `The action is not recognized. Allowed values are 'Create'.`
            );
    }
};
