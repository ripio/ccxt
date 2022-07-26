'use strict';

//  ---------------------------------------------------------------------------

const Exchange = require ('./base/Exchange');
const { AuthenticationError, ExchangeError, InvalidOrder, ArgumentsRequired, OrderNotFound, InsufficientFunds, DDoSProtection, PermissionDenied, NullResponse, NetworkError, OrderNotFillable, RateLimitExceeded, OnMaintenance } = require ('./base/errors');
const { TICK_SIZE } = require ('./base/functions/number');
const Precise = require ('./base/Precise');

//  ---------------------------------------------------------------------------

module.exports = class ripio extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'ripio',
            'name': 'Ripio',
            'countries': [ 'AR' ],
            'rateLimit': 50,
            'version': 'v3',
            'pro': false,
            // new metainfo interface
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': undefined,
                'swap': undefined,
                'future': undefined,
                'option': undefined,
                'cancelOrder': true,
                'createOrder': true,
                'fetchBalance': true,
                'fetchClosedOrders': true,
                'fetchCurrencies': true,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchOrders': true,
                'fetchTicker': true,
                'fetchTrades': true,
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1892491/179565296-42198bf8-2228-47d6-a1b5-fd763a163c9d.jpg',
                'api': {
                    'public': 'https://api.ripiotrade.co/v3/public',
                    'private': 'https://api.ripiotrade.co/v3',
                },
                'www': 'https://trade.ripio.com',
                'doc': [
                    'https://apidocs.ripiotrade.co',
                ],
            },
            'api': {
                'public': {
                    'get': [
                        '{pair}/ticker/', // rates
                        '{pair}/orders/', // orderbook
                        '{pair}/trades/',
                        'currencies/',
                        'pairs/',
                    ],
                },
                'private': {
                    'get': [
                        'market/',
                        'market/summary/',
                        'market/estimated_price/',
                        'market/user_orders/list/',
                        'market/user_orders/{code}/',
                        'wallets/balance/',
                    ],
                    'post': [
                        'market/create_order/',
                    ],
                    'delete': [
                        'market/user_orders/',
                    ],
                },
            },
            'fees': {
                'trading': {
                    'tierBased': true,
                    'percentage': true,
                    'taker': 0.0 / 100,
                    'maker': 0.0 / 100,
                },
            },
            'precisionMode': TICK_SIZE,
            'requiredCredentials': {
                'apiKey': true,
                'secret': false,
            },
            'exceptions': {
                'exact': {
                    '400': InvalidOrder,
                    '401': PermissionDenied,
                    '402': AuthenticationError,
                    '403': PermissionDenied,
                    '404': NullResponse,
                    '405': ExchangeError,
                    '429': DDoSProtection,
                    '500': ExchangeError,
                    '502': NetworkError,
                    '503': OnMaintenance,
                },
                'broad': {
                    'You did another transaction with the same amount in an interval lower than 10 (ten) minutes, it is not allowed in order to prevent mistakes. Try again in a few minutes': ExchangeError,
                    'Invalid order quantity': InvalidOrder,
                    'Funds insufficient': InsufficientFunds,
                    'Order already canceled': InvalidOrder,
                    'Order already completely executed': OrderNotFillable,
                    'No orders to cancel': OrderNotFound,
                    'Minimum value not reached': ExchangeError,
                    'Limit exceeded': DDoSProtection,
                    'Too many requests': RateLimitExceeded,
                },
            },
        });
    }

    async fetchMarkets (params = {}) {
        const response = await this.publicGetPairs (params);
        // {
        //   "message": null,
        //   "data": [
        //     {
        //       "base": "BTC",
        //       "base_name": "string",
        //       "quote": "BRL",
        //       "quote_name": "string",
        //       "symbol": "BRLBTC",
        //       "enabled": true,
        //       "min_amount": 0,
        //       "price_tick": 0,
        //       "min_value": 0
        //     }
        //   ]
        // }
        const result = [];
        const results = this.safeValue (response, 'data', []);
        for (let i = 0; i < results.length; i++) {
            const market = results[i];
            const id = this.safeString (market, 'symbol');
            const baseId = this.safeString (market, 'base');
            const quoteId = this.safeString (market, 'quote');
            const base = this.safeCurrencyCode (baseId);
            const quote = this.safeCurrencyCode (quoteId);
            const symbol = base + '/' + quote;
            const precision = {
                'amount': this.safeNumber (market, 'min_amount'),
                'price': this.safeNumber (market, 'price_tick'),
            };
            const limits = {
                'amount': {
                    'min': this.safeNumber (market, 'min_amount'),
                    'max': undefined,
                },
                'price': {
                    'min': undefined,
                    'max': undefined,
                },
                'cost': {
                    'min': this.safeNumber (market, 'min_value'),
                    'max': undefined,
                },
            };
            const active = this.safeValue (market, 'enabled', true);
            const maker = 0.0025;
            const taker = 0.005;
            result.push ({
                'id': id,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'baseId': baseId,
                'quoteId': quoteId,
                'type': 'spot',
                'spot': true,
                'active': active,
                'precision': precision,
                'maker': maker,
                'taker': taker,
                'limits': limits,
                'info': market,
            });
        }
        return result;
    }

    async fetchCurrencies (params = {}) {
        const response = await this.publicGetCurrencies (params);
        // {
        //   "message": null,
        //   "data": [
        //     {
        //       "active": true,
        //       "code": "BTC",
        //       "min_withdraw_amount": 0,
        //       "name": "string",
        //       "precision": 0
        //     }
        //   ]
        // }
        const results = this.safeValue (response, 'data', []);
        const result = {};
        for (let i = 0; i < results.length; i++) {
            const currency = results[i];
            const id = this.safeString (currency, 'code');
            const code = this.safeCurrencyCode (id);
            const name = this.safeString (currency, 'name');
            const active = this.safeValue (currency, 'active', true);
            const precision = this.safeInteger (currency, 'precision');
            const min_withdraw_amount = this.safeNumber (currency, 'min_withdraw_amount');
            result[code] = {
                'id': id,
                'code': code,
                'name': name,
                'info': currency, // the original payload
                'active': active,
                'fee': undefined,
                'precision': precision,
                'deposit': true,
                'withdraw': true,
                'limits': {
                    'amount': { 'min': undefined, 'max': undefined },
                    'withdraw': { 'min': min_withdraw_amount, 'max': undefined },
                },
            };
        }
        return result;
    }

    parseSymbol (symbol) {
        const currencies = symbol.split ('/');
        const quote = currencies[1];
        const base = currencies[0];
        return quote + base;
    }

    async fetchTicker (symbol, params = {}) {
        await this.loadMarkets ();
        const ripioSymbol = this.parseSymbol (symbol);
        const request = {
            'pair': this.marketId (ripioSymbol),
        };
        const response = await this.publicGetPairTicker (this.extend (request, params));
        // {
        //   "message": null,
        //   "data": {
        //     "high": 15999.12,
        //     "low": 15000.12,
        //     "volume": 123.12345678,
        //     "trades_quantity": 123,
        //     "last": 15500.12,
        //     "buy": 15400.12,
        //     "sell": 15600.12,
        //     "date": "2017-10-20T00:00:00Z"
        //  }
        // }
        const ticker = this.safeValue (response, 'data', {});
        const timestamp = this.parseDate (this.safeString (ticker, 'date'));
        const last = this.safeNumber (ticker, 'last');
        return {
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': this.safeNumber (ticker, 'high'),
            'low': this.safeNumber (ticker, 'low'),
            'bid': this.safeNumber (ticker, 'buy'),
            'bidVolume': undefined,
            'ask': this.safeNumber (ticker, 'sell'),
            'askVolume': undefined,
            'vwap': undefined,
            'open': undefined,
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': undefined,
            'percentage': undefined,
            'average': undefined,
            'baseVolume': this.safeNumber (ticker, 'volume'),
            'quoteVolume': undefined,
            'info': ticker,
        };
    }

    async fetchOrderBook (symbol, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const ripioSymbol = this.parseSymbol (symbol);
        params = this.extend (params, { 'pair': this.marketId (ripioSymbol) });
        const response = await this.publicGetPairOrders (params);
        // {
        //     "data": {
        //         "asks": [
        //             {
        //                 "amount": 197,
        //                 "code": "qeM4ZCp1E",
        //                 "unit_price": 60
        //             }
        //         ],
        //         "bids": [
        //             {
        //                 "amount": 20,
        //                 "code": "DbqCd9e4_",
        //                 "unit_price": 50
        //             }
        //         ]
        //     },
        //     "message": null
        // }
        const orderbook = this.parseOrderBook (response['data'], symbol, undefined, 'bids', 'asks', 'unit_price', 'amount');
        return orderbook;
    }

    parseTrade (trade, market = undefined) {
        const timestamp = this.parseDate (this.safeString (trade, 'date'));
        const id = timestamp;
        const side = this.safeStringLower (trade, 'type');
        const takerOrMaker = undefined;
        const priceString = this.safeString (trade, 'unit_price');
        const amountString = this.safeString (trade, 'amount');
        const price = this.parseNumber (priceString);
        const amount = this.parseNumber (amountString);
        const cost = this.parseNumber (Precise.stringMul (priceString, amountString));
        const fee = undefined;
        return {
            'id': id,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'type': undefined,
            'side': side,
            'price': price,
            'amount': amount,
            'cost': cost,
            'takerOrMaker': takerOrMaker,
            'fee': fee,
            'info': trade,
        };
    }

    async fetchTrades (symbol, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const ripioSymbol = this.parseSymbol (symbol);
        params = this.extend (params, { 'pair': this.marketId (ripioSymbol) });
        const response = await this.publicGetPairTrades (params);
        // {
        //   "message": null,
        //   "data": {
        //     "trades": [
        //       {
        //         "type": "sell",
        //         "amount": 0.2404764,
        //         "unit_price": 15160,
        //         "active_order_code": "Bk0fQxsZV",
        //         "passive_order_code": "rJEcVyob4",
        //         "date": "2019-01-03T02:27:33.947Z"
        //       },
        //       {
        //         "type": "sell",
        //         "amount": 0.00563617,
        //         "unit_price": 15163,
        //         "active_order_code": "Bk0fQxsZV",
        //         "passive_order_code": "B1cl2ys_4",
        //         "date": "2019-01-03T02:27:33.943Z"
        //       },
        //       {
        //         "type": "sell",
        //         "amount": 0.00680154,
        //         "unit_price": 15163.03,
        //         "active_order_code": "Bk0fQxsZV",
        //         "passive_order_code": "Synrhyj_V",
        //         "date": "2019-01-03T02:27:33.940Z"
        //       }
        //     ],
        //     "pagination": {
        //       "total_pages": 1,
        //       "current_page": 1,
        //       "page_size": 100,
        //       "registers_count": 21
        //     }
        //   }
        // }
        const data = this.safeValue (response, 'data');
        const trades = this.safeValue (data, 'trades');
        return this.parseTrades (trades, undefined, since, limit);
    }

    async fetchBalance (params = {}) {
        await this.loadMarkets ();
        const response = await this.privateGetWalletsBalance (params);
        // {
        //   "message": null,
        //   "data": [
        //     {
        //       "address": "3JentmkNdL97VQDtgRMehxPJKS4AveUZJa",
        //       "available_amount": 5.23423423,
        //       "currency_code": "BTC",
        //       "last_update": "2020-10-20T18:39:45.198Z",
        //       "locked_amount": 0,
        //       "memo": null,
        //       "tag": null
        //     },
        //     {
        //       "address": "rfMyfzcavQ4tUe1yJYMS4YPUZhAvcWRbRm",
        //       "available_amount": 75.31057927,
        //       "currency_code": "XRP",
        //       "last_update": "2020-10-20T18:39:45.198Z",
        //       "locked_amount": 0,
        //       "memo": null,
        //       "tag": "0700000000"
        //     }
        //   ]
        // }
        const result = { 'info': response };
        const data = this.safeValue (response, 'data');
        for (let i = 0; i < data.length; i++) {
            const balance = data[i];
            const currencyId = this.safeString (balance, 'currency_code');
            const code = this.safeCurrencyCode (currencyId);
            const account = this.account ();
            account['free'] = this.safeNumber (balance, 'available_amount');
            account['used'] = this.safeNumber (balance, 'locked_amount');
            account['total'] = this.safeNumber (balance, 'available_amount') + this.safeNumber (balance, 'locked_amount');
            result[code] = account;
        }
        return this.safeBalance (result);
    }

    async createOrder (symbol, type, side, amount, price = undefined, params = {}) {
        await this.loadMarkets ();
        const ripioSymbol = this.parseSymbol (symbol);
        const uppercaseType = type.toUpperCase () === 'LIMIT' ? 'LIMITED' : 'MARKET';
        const uppercaseSide = side.toUpperCase ();
        const request = {
            'pair': this.marketId (ripioSymbol),
            'subtype': uppercaseType, // LIMIT, MARKET
            'type': uppercaseSide, // BUY or SELL
            'amount': this.parseNumber (amount),
        };
        if (uppercaseType === 'LIMITED') {
            request['unit_price'] = this.parseNumber (price);
        }
        const response = await this.privatePostMarketCreateOrder (this.extend (request, params));
        // {
        //   "message": null,
        //   "data": {
        //     "code": "string"
        //   }
        // }
        return response['data']['code'];
    }

    async cancelOrder (id, symbol = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchOrder() requires a symbol argument');
        }
        await this.loadMarkets ();
        const ripioSymbol = this.parseSymbol (symbol);
        const market = this.market (ripioSymbol);
        const request = { 'code': id };
        const response = await this.privateDeleteMarketUserOrders (this.extend (request, params));
        // {
        //   "message": null,
        //   "data": {
        //     "code": "string",
        //     "create_date": "string",
        //     "executed_amount": 0,
        //     "pair": "BRLBTC",
        //     "remaining_amount": 0,
        //     "remaining_price": 0,
        //     "requested_amount": 0,
        //     "status": "string",
        //     "subtype": "string",
        //     "total_price": 0,
        //     "type": "string",
        //     "unit_price": 0,
        //     "update_date": "string"
        //   }
        // }
        return this.parseOrder (response['data'], market);
    }

    async fetchOrder (id, symbol = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchOrder() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = { 'code': id };
        const response = await this.privateGetMarketUserOrdersCode (this.extend (request, params));
        // {
        //     "data": {
        //         "code": "ZAeXh5ief",
        //         "create_date": "2022-07-11T13:47:17.590Z",
        //         "executed_amount": 30.09664345,
        //         "pair": "BRLCELO",
        //         "remaining_amount": 0,
        //         "remaining_price": 0,
        //         "requested_amount": 30.09664345,
        //         "status": "executed_completely",
        //         "subtype": "market",
        //         "total_price": 499.94,
        //         "type": "buy",
        //         "unit_price": 16.61115469,
        //         "update_date": "2022-07-11T13:47:17.610Z",
        //         "transactions": [
        //             {
        //                 "amount": 30,
        //                 "create_date": "2022-07-11T13:47:17.603Z",
        //                 "total_price": 210,
        //                 "unit_price": 7
        //             },
        //             {
        //                 "amount": 0.09664345,
        //                 "create_date": "2022-07-11T13:47:17.607Z",
        //                 "total_price": 289.94,
        //                 "unit_price": 3000.1
        //             }
        //         ]
        //     },
        //     "message": null
        // }
        const data = this.safeValue (response, 'data');
        return this.parseOrder (data, market);
    }

    async fetchOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchOrders() requires a symbol argument');
        }
        const ripioSymbol = this.parseSymbol (symbol);
        await this.loadMarkets ();
        const market = this.market (ripioSymbol);
        const request = {
            'pair': this.marketId (ripioSymbol),
        };
        if (limit !== undefined) {
            request['page_size'] = limit;
        }
        const side = this.safeString (params, 'side', undefined);
        if (side) {
            request['type'] = side;
        }
        const status = this.safeString (params, 'status', undefined);
        if (status) {
            request['status'] = status;
        }
        const response = await this.privateGetMarketUserOrdersList (this.extend (request, params));
        // {
        //   "message": null,
        //   "data": {
        //     "orders": [
        //       {
        //         "code": "SkvtQoOZf",
        //         "type": "buy",
        //         "subtype": "limited",
        //         "requested_amount": 0.02347418,
        //         "remaining_amount": 0,
        //         "unit_price": 42600,
        //         "status": "executed_completely",
        //         "create_date": "2017-12-08T23:42:54.960Z",
        //         "update_date": "2017-12-13T21:48:48.817Z",
        //         "pair": "BRLBTC",
        //         "total_price": 1000,
        //         "executed_amount": 0.02347418,
        //         "remaining_price": 0
        //       },
        //       {
        //         "code": "SyYpGa8p_",
        //         "type": "buy",
        //         "subtype": "market",
        //         "requested_amount": 0.00033518,
        //         "remaining_amount": 0,
        //         "unit_price": 16352.12,
        //         "status": "executed_completely",
        //         "create_date": "2017-10-20T00:26:40.403Z",
        //         "update_date": "2017-10-20T00:26:40.467Z",
        //         "pair": "BRLBTC",
        //         "total_price": 5.48090358,
        //         "executed_amount": 0.00033518,
        //         "remaining_price": 0
        //       }
        //     ],
        //     "pagination": {
        //       "total_pages": 1,
        //       "current_page": 1,
        //       "page_size": 100,
        //       "registers_count": 21
        //     }
        //   }
        // }
        const data = this.safeValue (response, 'data', {});
        const orders = this.safeValue (data, 'orders', []);
        return this.parseOrders (orders, market, since, limit);
    }

    async fetchOpenOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        const request = {
            'status': [ 'executed_partially', 'waiting' ],
        };
        return await this.fetchOrders (symbol, since, limit, this.extend (request, params));
    }

    async fetchClosedOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        const request = {
            'status': [ 'executed_completely', 'canceled' ],
        };
        return await this.fetchOrders (symbol, since, limit, this.extend (request, params));
    }

    parseOrderStatus (status) {
        const statuses = {
            'executed_completely': 'closed',
            'executed_partially': 'open',
            'waiting': 'open',
            'canceled': 'canceled',
            'pending_creation': 'pending creation',
        };
        return this.safeString (statuses, status, status);
    }

    parseOrder (order, market = undefined) {
        // {
        //     "code": "SkvtQoOZf",
        //     "type": "buy",
        //     "subtype": "limited",
        //     "requested_amount": 0.02347418,
        //     "remaining_amount": 0,
        //     "unit_price": 42600,
        //     "status": "executed_completely",
        //     "create_date": "2017-12-08T23:42:54.960Z",
        //     "update_date": "2017-12-13T21:48:48.817Z",
        //     "pair": "BRLBTC",
        //     "total_price": 1000,
        //     "executed_amount": 0.02347418,
        //     "remaining_price": 0
        // }
        const code = this.safeString (order, 'code');
        const amount = this.safeNumber (order, 'requested_amount');
        const type = this.safeStringLower (order, 'subtype');
        const price = this.safeNumber (order, 'unit_price');
        const side = this.safeStringLower (order, 'type');
        const status = this.parseOrderStatus (this.safeString (order, 'status'));
        const timestamp = this.parseDate (this.safeString (order, 'create_date'));
        const average = undefined;
        const filled = this.safeNumber (order, 'executed_amount');
        const cost = this.parseNumber (Precise.stringMul (this.safeString (order, 'unit_price'), this.safeString (order, 'executed_amount')));
        const trades = undefined;
        const lastTradeTimestamp = this.parseDate (this.safeString (order, 'update_date'));
        const remaining = this.safeNumber (order, 'remaining_amount');
        const symbol = market;
        return {
            'id': code,
            'clientOrderId': undefined,
            'info': order,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': lastTradeTimestamp,
            'symbol': symbol.symbol,
            'type': type === 'limited' ? 'limit' : type,
            'timeInForce': undefined,
            'postOnly': undefined,
            'side': side,
            'price': price,
            'stopPrice': undefined,
            'amount': amount,
            'cost': cost,
            'average': average,
            'filled': filled,
            'remaining': remaining,
            'status': status,
            'fee': undefined,
            'trades': trades,
        };
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        const request = '/' + this.implodeParams (path, params);
        let url = this.urls['api'][api] + request;
        const query = this.omit (params, this.extractParams (path));
        if (api === 'public') {
            if (Object.keys (query).length) {
                url += '?' + this.urlencode (query);
            }
        } else if (api === 'private') {
            this.checkRequiredCredentials ();
            if (method === 'POST' || method === 'DELETE') {
                body = this.json (query);
            } else {
                if (Object.keys (query).length) {
                    url += '?' + this.urlencode (query);
                }
            }
            headers = {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
            };
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (code, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return;
        }
        if ((code >= 400) && (code <= 503)) {
            const feedback = this.id + ' ' + body;
            const message = this.safeString (response, 'message');
            this.throwBroadlyMatchedException (this.exceptions['broad'], message, feedback);
            const status = code.toString ();
            this.throwExactlyMatchedException (this.exceptions['exact'], status, feedback);
        }
    }
};
