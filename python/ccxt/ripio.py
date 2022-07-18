# -*- coding: utf-8 -*-

# PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
# https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

from ccxt.base.exchange import Exchange
from ccxt.base.errors import ExchangeError
from ccxt.base.errors import AuthenticationError
from ccxt.base.errors import PermissionDenied
from ccxt.base.errors import ArgumentsRequired
from ccxt.base.errors import NullResponse
from ccxt.base.errors import InsufficientFunds
from ccxt.base.errors import InvalidOrder
from ccxt.base.errors import OrderNotFound
from ccxt.base.errors import OrderNotFillable
from ccxt.base.errors import NetworkError
from ccxt.base.errors import DDoSProtection
from ccxt.base.errors import RateLimitExceeded
from ccxt.base.errors import OnMaintenance
from ccxt.base.decimal_to_precision import TICK_SIZE
from ccxt.base.precise import Precise


class ripio(Exchange):

    def describe(self):
        return self.deep_extend(super(ripio, self).describe(), {
            'id': 'ripio',
            'name': 'Ripio',
            'countries': ['AR'],
            'rateLimit': 50,
            'version': 'v3',
            'pro': False,
            # new metainfo interface
            'has': {
                'cancelOrder': True,
                'CORS': None,
                'createOrder': True,
                'fetchBalance': True,
                'fetchClosedOrders': True,
                'fetchCurrencies': True,
                'fetchOpenOrders': True,
                'fetchOrder': True,
                'fetchOrderBook': True,
                'fetchOrders': True,
                'fetchTicker': True,
                'fetchTrades': True,
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
                        '{pair}/ticker/',  # rates
                        '{pair}/orders/',  # orderbook
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
                    'tierBased': True,
                    'percentage': True,
                    'taker': 0.0 / 100,
                    'maker': 0.0 / 100,
                },
            },
            'precisionMode': TICK_SIZE,
            'requiredCredentials': {
                'apiKey': True,
                'secret': False,
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
                    'You did another transaction with the same amount in an interval lower than 10(ten) minutes, it is not allowed in order to prevent mistakes. Try again in a few minutes': ExchangeError,
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
        })

    def fetch_markets(self, params={}):
        response = self.publicGetPairs(params)
        # {
        #   "message": null,
        #   "data": [
        #     {
        #       "base": "BTC",
        #       "base_name": "string",
        #       "quote": "BRL",
        #       "quote_name": "string",
        #       "symbol": "BRLBTC",
        #       "enabled": True,
        #       "min_amount": 0,
        #       "price_tick": 0,
        #       "min_value": 0
        #     }
        #   ]
        # }
        result = []
        results = self.safe_value(response, 'data', [])
        for i in range(0, len(results)):
            market = results[i]
            id = self.safe_string(market, 'symbol')
            baseId = self.safe_string(market, 'base')
            quoteId = self.safe_string(market, 'quote')
            base = self.safe_currency_code(baseId)
            quote = self.safe_currency_code(quoteId)
            symbol = base + '/' + quote
            precision = {
                'amount': self.safe_number(market, 'min_amount'),
                'price': self.safe_number(market, 'price_tick'),
            }
            limits = {
                'amount': {
                    'min': self.safe_number(market, 'min_amount'),
                    'max': None,
                },
                'price': {
                    'min': None,
                    'max': None,
                },
                'cost': {
                    'min': self.safe_number(market, 'min_value'),
                    'max': None,
                },
            }
            active = self.safe_value(market, 'enabled', True)
            maker = 0.0025
            taker = 0.005
            result.append({
                'id': id,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'baseId': baseId,
                'quoteId': quoteId,
                'type': 'spot',
                'spot': True,
                'active': active,
                'precision': precision,
                'maker': maker,
                'taker': taker,
                'limits': limits,
                'info': market,
            })
        return result

    def fetch_currencies(self, params={}):
        response = self.publicGetCurrencies(params)
        # {
        #   "message": null,
        #   "data": [
        #     {
        #       "active": True,
        #       "code": "BTC",
        #       "min_withdraw_amount": 0,
        #       "name": "string",
        #       "precision": 0
        #     }
        #   ]
        # }
        results = self.safe_value(response, 'data', [])
        result = {}
        for i in range(0, len(results)):
            currency = results[i]
            id = self.safe_string(currency, 'code')
            code = self.safe_currency_code(id)
            name = self.safe_string(currency, 'name')
            active = self.safe_value(currency, 'active', True)
            precision = self.safe_integer(currency, 'precision')
            min_withdraw_amount = self.safe_integer(currency, 'min_withdraw_amount')
            result[code] = {
                'id': id,
                'code': code,
                'name': name,
                'info': currency,  # the original payload
                'active': active,
                'fee': None,
                'precision': precision,
                'limits': {
                    'amount': {'min': None, 'max': None},
                    'withdraw': {'min': min_withdraw_amount, 'max': None},
                },
            }
        return result

    def fetch_ticker(self, symbol, params={}):
        self.load_markets()
        request = {
            'pair': self.market_id(symbol),
        }
        response = self.publicGetPairTicker(self.extend(request, params))
        # {
        #   "message": null,
        #   "data": {
        #     "high": 15999.12,
        #     "low": 15000.12,
        #     "volume": 123.12345678,
        #     "trades_quantity": 123,
        #     "last": 15500.12,
        #     "buy": 15400.12,
        #     "sell": 15600.12,
        #     "date": "2017-10-20T00:00:00Z"
        #  }
        # }
        ticker = self.safe_value(response, 'ticker', {})
        timestamp = self.parse_date(self.safe_string(response, 'date'))
        last = self.safe_number(ticker, 'last')
        return {
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': self.iso8601(timestamp),
            'high': self.safe_number(ticker, 'high'),
            'low': self.safe_number(ticker, 'low'),
            'bid': self.safe_number(ticker, 'buy'),
            'bidVolume': None,
            'ask': self.safe_number(ticker, 'sell'),
            'askVolume': None,
            'vwap': None,
            'open': None,
            'close': last,
            'last': last,
            'previousClose': None,
            'change': None,
            'percentage': None,
            'average': None,
            'baseVolume': self.safe_number(ticker, 'volume'),
            'quoteVolume': None,
            'info': ticker,
        }

    def fetch_order_book(self, symbol, limit=None, params={}):
        self.load_markets()
        params = self.extend(params, {'pair': self.market_id(symbol)})
        response = self.privateGetMarket(params)
        # {
        #   "data": {
        #     "buying": [
        #       {
        #         "unit_price": 54049,
        #         "code": "BypTSfJSz",
        #         "user_code": "H1u6_cuGM",
        #         "amount": 0.02055746
        #       }
        #     ],
        #     "selling": [
        #       {
        #         "unit_price": 1923847,
        #         "code": "IasDflk",
        #         "user_code": "H1u6_cuGM",
        #         "amount": 0.1283746
        #       }
        #     ],
        #     ...
        #   }
        # }
        orderbook = self.parse_order_book(response['data'], symbol, None, 'buying', 'selling', 'unit_price', 'amount')
        return orderbook

    def parse_trade(self, trade, market=None):
        timestamp = self.parse_date(self.safe_string(trade, 'timestamp'))
        id = timestamp
        side = self.safe_string_lower(trade, 'type')
        takerOrMaker = 'taker'
        priceString = self.safe_number(trade, 'unit_price')
        amountString = self.safe_number(trade, 'amount')
        price = self.parse_number(priceString)
        amount = self.parse_number(amountString)
        cost = self.parse_number(Precise.mul(priceString, amountString))
        fee = None
        return {
            'id': id,
            'timestamp': timestamp,
            'datetime': self.iso8601(timestamp),
            'type': None,
            'side': side,
            'price': price,
            'amount': amount,
            'cost': cost,
            'takerOrMaker': takerOrMaker,
            'fee': fee,
            'info': trade,
        }

    def fetch_trades(self, symbol, since=None, limit=None, params={}):
        self.load_markets()
        market = self.market(symbol)
        params = self.extend(params, {'pair': self.market_id(symbol)})
        response = self.publicGetPairTrades(params)
        # {
        #   "message": null,
        #   "data": {
        #     "trades": [
        #       {
        #         "type": "sell",
        #         "amount": 0.2404764,
        #         "unit_price": 15160,
        #         "active_order_code": "Bk0fQxsZV",
        #         "passive_order_code": "rJEcVyob4",
        #         "date": "2019-01-03T02:27:33.947Z"
        #       },
        #       {
        #         "type": "sell",
        #         "amount": 0.00563617,
        #         "unit_price": 15163,
        #         "active_order_code": "Bk0fQxsZV",
        #         "passive_order_code": "B1cl2ys_4",
        #         "date": "2019-01-03T02:27:33.943Z"
        #       },
        #       {
        #         "type": "sell",
        #         "amount": 0.00680154,
        #         "unit_price": 15163.03,
        #         "active_order_code": "Bk0fQxsZV",
        #         "passive_order_code": "Synrhyj_V",
        #         "date": "2019-01-03T02:27:33.940Z"
        #       }
        #     ],
        #     "pagination": {
        #       "total_pages": 1,
        #       "current_page": 1,
        #       "page_size": 100,
        #       "registers_count": 21
        #     }
        #   }
        # }
        return self.parse_trades(response, market, since, limit)

    def fetch_balance(self, params={}):
        self.load_markets()
        response = self.privateGetWalletsBalance(params)
        # {
        #   "message": null,
        #   "data": [
        #     {
        #       "address": "3JentmkNdL97VQDtgRMehxPJKS4AveUZJa",
        #       "available_amount": 5.23423423,
        #       "currency_code": "BTC",
        #       "last_update": "2020-10-20T18:39:45.198Z",
        #       "locked_amount": 0,
        #       "memo": null,
        #       "tag": null
        #     },
        #     {
        #       "address": "rfMyfzcavQ4tUe1yJYMS4YPUZhAvcWRbRm",
        #       "available_amount": 75.31057927,
        #       "currency_code": "XRP",
        #       "last_update": "2020-10-20T18:39:45.198Z",
        #       "locked_amount": 0,
        #       "memo": null,
        #       "tag": "0700000000"
        #     }
        #   ]
        # }
        result = {'info': response}
        for i in range(0, len(response)):
            balance = response[i]
            currencyId = self.safe_string(balance, 'symbol')
            code = self.safe_currency_code(currencyId)
            account = self.account()
            account['free'] = self.safe_string(balance, 'available_amount')
            account['used'] = self.safe_string(balance, 'locked_amount')
            result[code] = account
        return self.parse_balance(result)

    def create_order(self, symbol, type, side, amount, price=None, params={}):
        self.load_markets()
        uppercaseType = type.upper()
        uppercaseSide = side.upper()
        request = {
            'pair': self.market_id(symbol),
            'order_type': uppercaseType,  # LIMIT, MARKET
            'side': uppercaseSide,  # BUY or SELL
            'amount': self.parse_number(amount),
        }
        if uppercaseType == 'limited':
            request['unit_price'] = self.parse_number(price)
        response = self.privatePostMarketCreateOrder(self.extend(request, params))
        # {
        #   "message": null,
        #   "data": {
        #     "code": "string"
        #   }
        # }
        return response['data']['code']

    def cancel_order(self, id, symbol=None, params={}):
        self.load_markets()
        market = self.market(symbol)
        request = {'code': id}
        response = self.privateDeleteMarketUserOrders(self.extend(request, params))
        # {
        #   "message": null,
        #   "data": {
        #     "code": "string",
        #     "create_date": "string",
        #     "executed_amount": 0,
        #     "pair": "BRLBTC",
        #     "remaining_amount": 0,
        #     "remaining_price": 0,
        #     "requested_amount": 0,
        #     "status": "string",
        #     "subtype": "string",
        #     "total_price": 0,
        #     "type": "string",
        #     "unit_price": 0,
        #     "update_date": "string"
        #   }
        # }
        return self.parse_order(response['data'], market)

    def fetch_order(self, id, symbol=None, params={}):
        if symbol is None:
            raise ArgumentsRequired(self.id + ' fetchOrder() requires a symbol argument')
        self.load_markets()
        market = self.market(symbol)
        request = {'code': id}
        response = self.privateGetMarketUserOrdersCode(self.extend(request, params))
        # {
        #   "message": null,
        #   "data": {
        #     "code": "SkvtQoOZf",
        #     "type": "buy",
        #     "subtype": "limited",
        #     "requested_amount": 0.02347418,
        #     "remaining_amount": 0,
        #     "unit_price": 42600,
        #     "status": "executed_completely",
        #     "create_date": "2017-12-08T23:42:54.960Z",
        #     "update_date": "2017-12-13T21:48:48.817Z",
        #     "pair": "BRLBTC",
        #     "total_price": 1000,
        #     "executed_amount": 0.02347418,
        #     "remaining_price": 0,
        #     "transactions": [
        #       {
        #         "amount": 0.2,
        #         "create_date": "2020-02-21 20:24:43.433",
        #         "total_price": 1000,
        #         "unit_price": 5000
        #       },
        #       {
        #         "amount": 0.2,
        #         "create_date": "2020-02-21 20:49:37.450",
        #         "total_price": 1000,
        #         "unit_price": 5000
        #       }
        #     ]
        #   }
        # }
        return self.parse_order(response, market)

    def fetch_orders(self, symbol=None, since=None, limit=None, params={}):
        if symbol is None:
            raise ArgumentsRequired(self.id + ' fetchOrders() requires a symbol argument')
        self.load_markets()
        market = self.market(symbol)
        request = {
            'pair': self.market_id(symbol),
            # 'status': 'executed_partially,waiting,pending_creation,executed_completely,canceled' ,
            # 'page_size': 200,
            # 'current_page': 1,
        }
        if limit is not None:
            request['current_page'] = limit
        response = self.privateGetMarketUserOrdersList(self.extend(request, params))
        # {
        #   "message": null,
        #   "data": {
        #     "orders": [
        #       {
        #         "code": "SkvtQoOZf",
        #         "type": "buy",
        #         "subtype": "limited",
        #         "requested_amount": 0.02347418,
        #         "remaining_amount": 0,
        #         "unit_price": 42600,
        #         "status": "executed_completely",
        #         "create_date": "2017-12-08T23:42:54.960Z",
        #         "update_date": "2017-12-13T21:48:48.817Z",
        #         "pair": "BRLBTC",
        #         "total_price": 1000,
        #         "executed_amount": 0.02347418,
        #         "remaining_price": 0
        #       },
        #       {
        #         "code": "SyYpGa8p_",
        #         "type": "buy",
        #         "subtype": "market",
        #         "requested_amount": 0.00033518,
        #         "remaining_amount": 0,
        #         "unit_price": 16352.12,
        #         "status": "executed_completely",
        #         "create_date": "2017-10-20T00:26:40.403Z",
        #         "update_date": "2017-10-20T00:26:40.467Z",
        #         "pair": "BRLBTC",
        #         "total_price": 5.48090358,
        #         "executed_amount": 0.00033518,
        #         "remaining_price": 0
        #       }
        #     ],
        #     "pagination": {
        #       "total_pages": 1,
        #       "current_page": 1,
        #       "page_size": 100,
        #       "registers_count": 21
        #     }
        #   }
        # }
        results = self.safe_value(response, 'results', {})
        data = self.safe_value(results, 'data', [])
        return self.parse_orders(data, market, since, limit)

    def fetch_open_orders(self, symbol=None, since=None, limit=None, params={}):
        request = {
            'status': 'executed_partially,waiting,pending_creation',
        }
        return self.fetch_orders(symbol, since, limit, self.extend(request, params))

    def fetch_closed_orders(self, symbol=None, since=None, limit=None, params={}):
        request = {
            'status': 'executed_completely,canceled',
        }
        return self.fetch_orders(symbol, since, limit, self.extend(request, params))

    def parse_order_status(self, status):
        statuses = {
            'executed_completely': 'executed completely',
            'executed_partially': 'executed partially',
            'waiting': 'waiting',
            'canceled': 'canceled',
            'pending_creation': 'pending creation',
        }
        return self.safe_string(statuses, status, status)

    def parse_order(self, order, market=None):
        # {
        #     "code": "SkvtQoOZf",
        #     "type": "buy",
        #     "subtype": "limited",
        #     "requested_amount": 0.02347418,
        #     "remaining_amount": 0,
        #     "unit_price": 42600,
        #     "status": "executed_completely",
        #     "create_date": "2017-12-08T23:42:54.960Z",
        #     "update_date": "2017-12-13T21:48:48.817Z",
        #     "pair": "BRLBTC",
        #     "total_price": 1000,
        #     "executed_amount": 0.02347418,
        #     "remaining_price": 0
        # }
        code = self.safe_string(order, 'code')
        amount = self.safe_number(order, 'requested_amount')
        cost = None
        type = self.safe_string_lower(order, 'subtype')
        price = self.safe_number(order, 'unit_price')
        side = self.safe_string_lower(order, 'type')
        status = self.parse_order_status(self.safe_string(order, 'status'))
        timestamp = self.parse_date(self.safe_string(order, 'created_at'))
        average = None
        filled = self.safe_number(order, 'executed_amount')
        trades = None
        lastTradeTimestamp = self.parse_date(self.safe_string(order, 'update_date'))
        remaining = self.safe_number(order, 'remaining_amount')
        symbol = self.safe_symbol(order, 'pair')
        return {
            'id': code,
            'clientOrderId': None,
            'info': order,
            'timestamp': timestamp,
            'datetime': self.iso8601(timestamp),
            'lastTradeTimestamp': lastTradeTimestamp,
            'symbol': symbol,
            'type': type,
            'timeInForce': None,
            'postOnly': None,
            'side': side,
            'price': price,
            'stopPrice': None,
            'amount': amount,
            'cost': cost,
            'average': average,
            'filled': filled,
            'remaining': remaining,
            'status': status,
            'fee': None,
            'trades': trades,
        }

    def sign(self, path, api='public', method='GET', params={}, headers=None, body=None):
        request = '/' + self.version + '/' + self.implode_params(path, params)
        url = self.urls['api'][api] + request
        query = self.omit(params, self.extract_params(path))
        if api == 'public':
            if query:
                url += '?' + self.urlencode(query)
        elif api == 'private':
            self.check_required_credentials()
            if method == 'POST':
                body = self.json(query)
            else:
                if query:
                    url += '?' + self.urlencode(query)
            headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + self.apiKey,
            }
        return {'url': url, 'method': method, 'body': body, 'headers': headers}

    def handle_errors(self, code, reason, url, method, headers, body, response, requestHeaders, requestBody):
        if response is None:
            return
        if (code >= 400) and (code <= 503):
            feedback = self.id + ' ' + body
            message = self.safe_string(response, 'message')
            self.throw_broadly_matched_exception(self.exceptions['broad'], message, feedback)
            status = str(code)
            self.throw_exactly_matched_exception(self.exceptions['exact'], status, feedback)
