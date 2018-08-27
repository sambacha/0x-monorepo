import { schemas } from '@0xproject/json-schemas';
import { SignedOrder } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import { BalanceAndAllowance, OrderAndTraderInfo, OrdersAndTradersInfo, TraderInfo } from '../types';
import { assert } from '../utils/assert';

import { ContractWrapper } from './contract_wrapper';
import { OrderValidatorContract } from './generated/order_validator';

/**
 * This class includes the functionality related to interacting with the OrderValidator contract.
 */
export class OrderValidatorWrapper extends ContractWrapper {
    public abi: ContractAbi = artifacts.OrderValidator.compilerOutput.abi;
    private _orderValidatorContractIfExists?: OrderValidatorContract;
    /**
     * Instantiate OrderValidatorWrapper
     * @param web3Wrapper Web3Wrapper instance to use
     * @param networkId Desired networkId
     */
    constructor(web3Wrapper: Web3Wrapper, networkId: number) {
        super(web3Wrapper, networkId);
    }
    /**
     * Get an object conforming to OrderAndTraderInfo containing on-chain information of the provided order and address
     * @return  OrderAndTraderInfo
     */
    public async getOrderAndTraderInfoAsync(order: SignedOrder, takerAddress: string): Promise<OrderAndTraderInfo> {
        assert.doesConformToSchema('order', order, schemas.signedOrderSchema);
        assert.isETHAddressHex('takerAddress', takerAddress);
        const OrderValidatorContractInstance = await this._getOrderValidatorContractAsync();
        const orderAndTraderInfo = await OrderValidatorContractInstance.getOrderAndTraderInfo.callAsync(
            order,
            takerAddress,
        );
        const result = {
            orderInfo: orderAndTraderInfo[0],
            traderInfo: orderAndTraderInfo[1],
        };
        return result;
    }
    /**
     * Get an object conforming to OrdersAndTradersInfo containing on-chain information of the provided orders and addresses
     * @return  OrdersAndTradersInfo
     */
    public async getOrdersAndTradersInfoAsync(
        orders: SignedOrder[],
        takerAddresses: string[],
    ): Promise<OrdersAndTradersInfo> {
        assert.doesConformToSchema('orders', orders, schemas.signedOrdersSchema);
        _.forEach(takerAddresses, (takerAddress, index) =>
            assert.isETHAddressHex(`takerAddresses[${index}]`, takerAddress),
        );
        assert.assert(orders.length === takerAddresses.length, 'Expected orders.length to equal takerAddresses.length');
        const OrderValidatorContractInstance = await this._getOrderValidatorContractAsync();
        const ordersAndTradersInfo = await OrderValidatorContractInstance.getOrdersAndTradersInfo.callAsync(
            orders,
            takerAddresses,
        );
        const result = {
            ordersInfo: ordersAndTradersInfo[0],
            tradersInfo: ordersAndTradersInfo[1],
        };
        return result;
    }
    /**
     * Get an object conforming to TraderInfo containing on-chain balance and allowances for maker and taker of order
     * @return  TraderInfo
     */
    public async getTraderInfoAsync(order: SignedOrder, takerAddress: string): Promise<TraderInfo> {
        assert.doesConformToSchema('order', order, schemas.signedOrderSchema);
        assert.isETHAddressHex('takerAddress', takerAddress);
        const OrderValidatorContractInstance = await this._getOrderValidatorContractAsync();
        const result = await OrderValidatorContractInstance.getTraderInfo.callAsync(order, takerAddress);
        return result;
    }
    /**
     * Get an array of objects conforming to TraderInfo containing on-chain balance and allowances for maker and taker of order
     * @return  array of TraderInfo
     */
    public async getTradersInfoAsync(orders: SignedOrder[], takerAddresses: string[]): Promise<TraderInfo[]> {
        assert.doesConformToSchema('orders', orders, schemas.signedOrdersSchema);
        _.forEach(takerAddresses, (takerAddress, index) =>
            assert.isETHAddressHex(`takerAddresses[${index}]`, takerAddress),
        );
        assert.assert(orders.length === takerAddresses.length, 'Expected orders.length to equal takerAddresses.length');
        const OrderValidatorContractInstance = await this._getOrderValidatorContractAsync();
        const result = await OrderValidatorContractInstance.getTradersInfo.callAsync(orders, takerAddresses);
        return result;
    }
    /**
     * Get an object conforming to BalanceAndAllowance containing on-chain balance and allowance for some address and assetData
     * @return  BalanceAndAllowance
     */
    public async getBalanceAndAllowanceAsync(address: string, assetData: string): Promise<BalanceAndAllowance> {
        assert.isETHAddressHex('address', address);
        assert.isHexString('assetData', assetData);
        const OrderValidatorContractInstance = await this._getOrderValidatorContractAsync();
        const balanceAndAllowance = await OrderValidatorContractInstance.getBalanceAndAllowance.callAsync(
            address,
            assetData,
        );
        const result = {
            balance: balanceAndAllowance[0],
            allowance: balanceAndAllowance[1],
        };
        return result;
    }
    // HACK: We don't want this method to be visible to the other units within that package but not to the end user.
    // TS doesn't give that possibility and therefore we make it private and access it over an any cast. Because of that tslint sees it as unused.
    // tslint:disable-next-line:no-unused-variable
    private _invalidateContractInstance(): void {
        delete this._orderValidatorContractIfExists;
    }
    private async _getOrderValidatorContractAsync(): Promise<OrderValidatorContract> {
        if (!_.isUndefined(this._orderValidatorContractIfExists)) {
            return this._orderValidatorContractIfExists;
        }
        const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(artifacts.OrderValidator);
        const contractInstance = new OrderValidatorContract(
            abi,
            address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._orderValidatorContractIfExists = contractInstance;
        return this._orderValidatorContractIfExists;
    }
}
