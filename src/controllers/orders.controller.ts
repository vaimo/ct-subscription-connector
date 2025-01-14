import { UpdateAction } from '@commercetools/sdk-client-v2';
import CustomError from '../errors/custom.error';
import { Resource } from '../interfaces/resource.interface';
import fetch from 'node-fetch';
import { format } from 'date-fns'; // For date formatting

interface CreateResponse {
    statusCode: number;
    actions: Array<UpdateAction>;
}

/**
 * Handle the create action for orders
 *
 * @param {Resource} resource The resource from the request body
 * @returns {CreateResponse}
 */
const create = async (resource: Resource): Promise<CreateResponse> => {
    const orderDraft = JSON.parse(JSON.stringify(resource));
    const updateActions: Array<UpdateAction> = [];
    const subscriptionTypeId = "5af7be9a-0895-4c20-b881-8039b7a9e271";

    const promises = orderDraft.obj.lineItems
        .filter((lineItem: any) => lineItem.productType.id === subscriptionTypeId)
        .map(async (lineItem: any) => {
            const orderData = {
                customerId: orderDraft.obj.customerId,
                productId: lineItem.id,
                status: true,
                frequency: '',
                startDate: '',
                endDate: ''
            };

            lineItem.variant.attributes.forEach((attribute: any) => {
                switch (attribute.name) {
                    case 'frequency':
                        orderData.frequency = attribute.value.label.toLowerCase();
                        break;
                    case 'startDate':
                        orderData.startDate = format(new Date(attribute.value), 'dd-MM-yyyy');
                        break;
                    case 'endDate':
                        orderData.endDate = format(new Date(attribute.value), 'dd-MM-yyyy');
                        break;
                }
            });

            const response = await fetch('https://ct-subscription.fly.dev/subscriptions/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                throw new Error(`Fly.io API call failed: ${response.statusText}`);
            }
        });

    try {
        await Promise.all(promises);
    } catch (error: any) {
        throw new CustomError(500, `Failed to process order: ${error.message}`);
    }

    return { statusCode: 200, actions: updateActions };
};

/**
 * Handle the order controller according to the action
 *
 * @param {string} action The action that comes with the request. Could be `Create` or `Update`
 * @param {Resource} resource The resource from the request body
 * @returns {Promise<CreateResponse>} The data from the method that handles the action
 */
export const orderController = async (
    action: string,
    resource: Resource
): Promise<CreateResponse> => {
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
