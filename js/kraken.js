'use strict';

//  ---------------------------------------------------------------------------

const ccxt = require ('ccxt');
const { NotImplemented } = require ('ccxt/js/base/errors');

//  ---------------------------------------------------------------------------

module.exports = class kraken extends ccxt.kraken {
    describe () {
        return this.deepExtend (super.describe (), {
            'has': {
                'ws': true,
                'fetchWsTicker': true,
                'fetchWsOrderBook': true,
            },
            'urls': {
                'api': {
                    'ws': 'wss://ws.kraken.com',
                    'wsauth': 'wss://ws-auth.kraken.com',
                    'betaws': 'wss://beta-ws.kraken.com',
                },
            },
            'versions': {
                'ws': '0.2.0',
            },
            'options': {
                'subscriptionStatusByChannelId': {},
            },
        });
    }

    handleWsTicker (client, response) {
        const data = response[2];
        const market = this.safeValue (this.options['marketsByNumericId'], data[0].toString ());
        const symbol = this.safeString (market, 'symbol');
        return {
            'info': response,
            'symbol': symbol,
            'last': parseFloat (data[1]),
            'ask': parseFloat (data[2]),
            'bid': parseFloat (data[3]),
            'change': parseFloat (data[4]),
            'baseVolume': parseFloat (data[5]),
            'quoteVolume': parseFloat (data[6]),
            'active': data[7] ? false : true,
            'high': parseFloat (data[8]),
            'low': parseFloat (data[9]),
        };
    }

    async fetchWsBalance (params = {}) {
        await this.loadMarkets ();
        this.balance = await this.fetchBalance (params);
        const channelId = '1000';
        const subscribe = {
            'command': 'subscribe',
            'channel': channelId,
        };
        const messageHash = channelId + ':b:e';
        const url = this.urls['api']['ws'];
        return this.sendWsMessage (url, messageHash, subscribe, channelId);
    }

    async fetchWsTickers (symbols = undefined, params = {}) {
        await this.loadMarkets ();
        // rewrite
        throw new NotImplemented (this.id + 'fetchWsTickers not implemented yet');
        // const market = this.market (symbol);
        // const numericId = market['info']['id'].toString ();
        // const url = this.urls['api']['websocket']['public'];
        // return await this.WsTickerMessage (url, '1002' + numericId, {
        //     'command': 'subscribe',
        //     'channel': 1002,
        // });
    }

    async fetchWsTrades (symbol, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const numericId = this.safeString (market, 'numericId');
        const messageHash = numericId + ':trades';
        const url = this.urls['api']['ws'];
        const subscribe = {
            'command': 'subscribe',
            'channel': numericId,
        };
        return this.sendWsMessage (url, messageHash, subscribe, numericId);
    }

    async loadMarkets (reload = false, params = {}) {
        const markets = await super.loadMarkets (reload, params);
        let marketsByWsName = this.safeValue (this.options, 'marketsByWsName');
        if ((marketsByWsName === undefined) || reload) {
            marketsByWsName = {};
            for (let i = 0; i < this.symbols.length; i++) {
                const symbol = this.symbols[i];
                const market = this.markets[symbol];
                const info = this.safeValue (market, 'info', {});
                const wsName = this.safeString (info, 'wsname');
                marketsByWsName[wsName] = market;
            }
            this.options['marketsByWsName'] = marketsByWsName;
        }
        return markets;
    }

    async fetchWsOrderBook (symbol, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const wsName = this.safeValue (market['info'], 'wsname');
        const name = 'book';
        const messageHash = wsName + ':' + name;
        const url = this.urls['api']['ws'];
        const subscribe = {
            'event': 'subscribe',
            'pair': [
                wsName,
            ],
            'subscription': {
                'name': name,
            },
        };
        if (limit !== undefined) {
            subscribe['subscription']['depth'] = limit; // default 10, valid options 10, 25, 100, 500, 1000
        }
        return this.sendWsMessage (url, messageHash, subscribe, messageHash);
    }

    async fetchWsHeartbeat (params = {}) {
        await this.loadMarkets ();
        const channelId = '1010';
        const url = this.urls['api']['ws'];
        return this.sendWsMessage (url, channelId);
    }

    signWsMessage (client, messageHash, message, params = {}) {
        if (messageHash.indexOf ('1000') === 0) {
            const reload = false;
            if (this.checkRequiredCredentials (reload)) {
                const nonce = this.nonce ();
                const payload = this.urlencode ({ 'nonce': nonce });
                const signature = this.hmac (this.encode (payload), this.encode (this.secret), 'sha512');
                message = this.extend (message, {
                    'key': this.apiKey,
                    'payload': payload,
                    'sign': signature,
                });
            }
        }
        return message;
    }

    handleWsHeartbeat (client, message) {
        //
        // every second
        //
        //     [ 1010 ]
        //
        const channelId = '1010';
        this.resolveWsFuture (client, channelId, message);
    }

    parseWsTrade (client, trade, market = undefined) {
        //
        // public trades
        //
        //     [
        //         "t", // trade
        //         "42706057", // id
        //         1, // 1 = buy, 0 = sell
        //         "0.05567134", // price
        //         "0.00181421", // amount
        //         1522877119, // timestamp
        //     ]
        //
        const id = trade[1].toString ();
        const side = trade[2] ? 'buy' : 'sell';
        const price = parseFloat (trade[3]);
        const amount = parseFloat (trade[4]);
        const timestamp = trade[5] * 1000;
        let symbol = undefined;
        if (market !== undefined) {
            symbol = market['symbol'];
        }
        return {
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': symbol,
            'id': id,
            'order': undefined,
            'type': undefined,
            'takerOrMaker': undefined,
            'side': side,
            'price': price,
            'amount': amount,
            'cost': price * amount,
            'fee': undefined,
        };
    }

    handleWsOrderBook (client, message) {
        //
        // first message (snapshot)
        //
        //     [
        //         0, // channelID
        //         {
        //             "as": [
        //                 [ "5541.30000", "2.50700000", "1534614248.123678" ],
        //                 [ "5541.80000", "0.33000000", "1534614098.345543" ],
        //                 [ "5542.70000", "0.64700000", "1534614244.654432" ]
        //             ],
        //             "bs": [
        //                 [ "5541.20000", "1.52900000", "1534614248.765567" ],
        //                 [ "5539.90000", "0.30000000", "1534614241.769870" ],
        //                 [ "5539.50000", "5.00000000", "1534613831.243486" ]
        //             ]
        //         },
        //         "book-100",
        //         "XBT/USD"
        //     ]
        //
        // subsequent updates
        //
        //     [
        //         1234,
        //         { // optional
        //             "a": [
        //                 [ "5541.30000", "2.50700000", "1534614248.456738" ],
        //                 [ "5542.50000", "0.40100000", "1534614248.456738" ]
        //             ]
        //         },
        //         { // optional
        //             "b": [
        //                 [ "5541.30000", "0.00000000", "1534614335.345903" ]
        //             ]
        //         },
        //         "book-10",
        //         "XBT/USD"
        //     ]
        //
        const messageLength = message.length;
        const wsName = message[messageLength - 1];
        const market = this.safeValue (this.options['marketsByWsName'], wsName);
        const symbol = market['symbol'];
        let timestamp = undefined;
        const messageHash = wsName + ':book';
        // if this is a snapshot
        if ('as' in message[1]) {
            // todo get depth from marketsByWsName
            this.orderbooks[symbol] = this.limitedOrderBook ({}, 10);
            const orderbook = this.orderbooks[symbol];
            const sides = {
                'as': 'asks',
                'bs': 'bids',
            };
            const keys = Object.keys (sides);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const side = sides[key];
                const bookside = orderbook[side];
                const deltas = this.safeValue (message[1], key, []);
                timestamp = this.handleWsDeltas (deltas, bookside, timestamp);
            }
            orderbook['timestamp'] = timestamp;
            this.resolveWsFuture (client, messageHash, orderbook.limit ());
        } else {
            const orderbook = this.orderbooks[symbol];
            // else, if this is an orderbook update
            let a = undefined;
            let b = undefined;
            if (messageLength === 5) {
                a = this.safeValue (message[1], 'a', []);
                b = this.safeValue (message[2], 'b', []);
            } else {
                if ('a' in message[1]) {
                    a = this.safeValue (message[1], 'a', []);
                } else {
                    b = this.safeValue (message[1], 'b', []);
                }
            }
            if (a !== undefined) {
                timestamp = this.handleWsDeltas (a, orderbook['asks'], timestamp);
            }
            if (b !== undefined) {
                timestamp = this.handleWsDeltas (b, orderbook['bids'], timestamp);
            }
            orderbook['timestamp'] = timestamp;
            this.resolveWsFuture (client, messageHash, orderbook.limit ());
        }
    }

    handleWsDeltas (deltas, bookside, timestamp) {
        for (let j = 0; j < deltas.length; j++) {
            const delta = deltas[j];
            const price = delta[0]; // no need to conver the price here
            const amount = parseFloat (delta[1]);
            timestamp = Math.max (timestamp || 0, parseInt (delta[2] * 1000));
            bookside.store (price, amount);
        }
        return timestamp;
    }

    handleWsSystemStatus (client, message) {
        //
        //     {
        //         connectionID: 15527282728335292000,
        //         event: 'systemStatus',
        //         status: 'online',
        //         version: '0.2.0'
        //     }
        //
        return message;
    }

    handleWsSubscriptionStatus (client, message) {
        //
        //     {
        //         channelID: 210,
        //         channelName: 'book-10',
        //         event: 'subscriptionStatus',
        //         pair: 'ETH/XBT',
        //         status: 'subscribed',
        //         subscription: { depth: 10, name: 'book' }
        //     }
        //
        const channelId = this.safeString (message, 'channelID');
        this.options['subscriptionStatusByChannelId'][channelId] = message;
    }

    handleWsMessage (client, message) {
        if (Array.isArray (message)) {
            const channelId = message[0].toString ();
            const subscriptionStatus = this.safeValue (this.options['subscriptionStatusByChannelId'], channelId);
            if (subscriptionStatus !== undefined) {
                const subscription = this.safeValue (subscriptionStatus, 'subscription', {});
                const name = this.safeString (subscription, 'name');
                const methods = {
                    'book': 'handleWsOrderBook',
                };
                const method = this.safeString (methods, name);
                if (method === undefined) {
                    return message;
                } else {
                    return this[method] (client, message);
                }
            }
        } else {
            const event = this.safeString (message, 'event');
            const methods = {
                'systemStatus': 'handleWsSystemStatus',
                'subscriptionStatus': 'handleWsSubscriptionStatus',
            };
            const method = this.safeString (methods, event);
            if (method === undefined) {
                return message;
            } else {
                return this[method] (client, message);
            }
        }
    }
};
