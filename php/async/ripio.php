<?php

namespace ccxt\async;

// PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
// https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

use Exception; // a common import
use \ccxt\ArgumentsRequired;
use \ccxt\Precise;

class ripio extends Exchange {

    public function describe() {
        return $this->deep_extend(parent::describe (), array(
            'id' => 'ripio',
            'name' => 'Ripio',
            'countries' => array( 'AR' ),
            'rateLimit' => 50,
            'version' => 'v3',
            'pro' => false,
            // new metainfo interface
            'has' => array(
                'CORS' => null,
                'spot' => true,
                'margin' => null,
                'swap' => null,
                'future' => null,
                'option' => null,
                'cancelOrder' => true,
                'createOrder' => true,
                'fetchBalance' => true,
                'fetchClosedOrders' => true,
                'fetchCurrencies' => true,
                'fetchOpenOrders' => true,
                'fetchOrder' => true,
                'fetchOrderBook' => true,
                'fetchOrders' => true,
                'fetchTicker' => true,
                'fetchTrades' => true,
            ),
            'urls' => array(
                'logo' => 'https://user-images.githubusercontent.com/1892491/179565296-42198bf8-2228-47d6-a1b5-fd763a163c9d.jpg',
                'api' => array(
                    'public' => 'https://api.ripiotrade.co/v3/public',
                    'private' => 'https://api.ripiotrade.co/v3',
                ),
                'www' => 'https://trade.ripio.com',
                'doc' => array(
                    'https://apidocs.ripiotrade.co',
                ),
            ),
            'api' => array(
                'public' => array(
                    'get' => array(
                        '{pair}/ticker/', // rates
                        '{pair}/orders/', // orderbook
                        '{pair}/trades/',
                        'currencies/',
                        'pairs/',
                    ),
                ),
                'private' => array(
                    'get' => array(
                        'market/',
                        'market/summary/',
                        'market/estimated_price/',
                        'market/user_orders/list/',
                        'market/user_orders/{code}/',
                        'wallets/balance/',
                    ),
                    'post' => array(
                        'market/create_order/',
                    ),
                    'delete' => array(
                        'market/user_orders/',
                    ),
                ),
            ),
            'fees' => array(
                'trading' => array(
                    'tierBased' => true,
                    'percentage' => true,
                    'taker' => 0.0 / 100,
                    'maker' => 0.0 / 100,
                ),
            ),
            'precisionMode' => TICK_SIZE,
            'requiredCredentials' => array(
                'apiKey' => true,
                'secret' => false,
            ),
            'exceptions' => array(
                'exact' => array(
                    '400' => '\\ccxt\\InvalidOrder',
                    '401' => '\\ccxt\\PermissionDenied',
                    '402' => '\\ccxt\\AuthenticationError',
                    '403' => '\\ccxt\\PermissionDenied',
                    '404' => '\\ccxt\\NullResponse',
                    '405' => '\\ccxt\\ExchangeError',
                    '429' => '\\ccxt\\DDoSProtection',
                    '500' => '\\ccxt\\ExchangeError',
                    '502' => '\\ccxt\\NetworkError',
                    '503' => '\\ccxt\\OnMaintenance',
                ),
                'broad' => array(
                    'You did another transaction with the same amount in an interval lower than 10 (ten) minutes, it is not allowed in order to prevent mistakes. Try again in a few minutes' => '\\ccxt\\ExchangeError',
                    'Invalid order quantity' => '\\ccxt\\InvalidOrder',
                    'Funds insufficient' => '\\ccxt\\InsufficientFunds',
                    'Order already canceled' => '\\ccxt\\InvalidOrder',
                    'Order already completely executed' => '\\ccxt\\OrderNotFillable',
                    'No orders to cancel' => '\\ccxt\\OrderNotFound',
                    'Minimum value not reached' => '\\ccxt\\ExchangeError',
                    'Limit exceeded' => '\\ccxt\\DDoSProtection',
                    'Too many requests' => '\\ccxt\\RateLimitExceeded',
                ),
            ),
        ));
    }

    public function fetch_markets($params = array ()) {
        $response = yield $this->publicGetPairs ($params);
        // {
        //   "message" => null,
        //   "data" => array(
        //     {
        //       "base" => "BTC",
        //       "base_name" => "string",
        //       "quote" => "BRL",
        //       "quote_name" => "string",
        //       "symbol" => "BRLBTC",
        //       "enabled" => true,
        //       "min_amount" => 0,
        //       "price_tick" => 0,
        //       "min_value" => 0
        //     }
        //   )
        // }
        $result = array();
        $results = $this->safe_value($response, 'data', array());
        for ($i = 0; $i < count($results); $i++) {
            $market = $results[$i];
            $id = $this->safe_string($market, 'symbol');
            $baseId = $this->safe_string($market, 'base');
            $quoteId = $this->safe_string($market, 'quote');
            $base = $this->safe_currency_code($baseId);
            $quote = $this->safe_currency_code($quoteId);
            $symbol = $base . '/' . $quote;
            $precision = array(
                'amount' => $this->safe_number($market, 'min_amount'),
                'price' => $this->safe_number($market, 'price_tick'),
            );
            $limits = array(
                'amount' => array(
                    'min' => $this->safe_number($market, 'min_amount'),
                    'max' => null,
                ),
                'price' => array(
                    'min' => null,
                    'max' => null,
                ),
                'cost' => array(
                    'min' => $this->safe_number($market, 'min_value'),
                    'max' => null,
                ),
            );
            $active = $this->safe_value($market, 'enabled', true);
            $maker = 0.0025;
            $taker = 0.005;
            $result[] = array(
                'id' => $id,
                'symbol' => $symbol,
                'base' => $base,
                'quote' => $quote,
                'baseId' => $baseId,
                'quoteId' => $quoteId,
                'type' => 'spot',
                'spot' => true,
                'active' => $active,
                'precision' => $precision,
                'maker' => $maker,
                'taker' => $taker,
                'limits' => $limits,
                'info' => $market,
            );
        }
        return $result;
    }

    public function fetch_currencies($params = array ()) {
        $response = yield $this->publicGetCurrencies ($params);
        // {
        //   "message" => null,
        //   "data" => array(
        //     {
        //       "active" => true,
        //       "code" => "BTC",
        //       "min_withdraw_amount" => 0,
        //       "name" => "string",
        //       "precision" => 0
        //     }
        //   )
        // }
        $results = $this->safe_value($response, 'data', array());
        $result = array();
        for ($i = 0; $i < count($results); $i++) {
            $currency = $results[$i];
            $id = $this->safe_string($currency, 'code');
            $code = $this->safe_currency_code($id);
            $name = $this->safe_string($currency, 'name');
            $active = $this->safe_value($currency, 'active', true);
            $precision = $this->safe_integer($currency, 'precision');
            $min_withdraw_amount = $this->safe_integer($currency, 'min_withdraw_amount');
            $result[$code] = array(
                'id' => $id,
                'code' => $code,
                'name' => $name,
                'info' => $currency, // the original payload
                'active' => $active,
                'fee' => null,
                'precision' => $precision,
                'limits' => array(
                    'amount' => array( 'min' => null, 'max' => null ),
                    'withdraw' => array( 'min' => $min_withdraw_amount, 'max' => null ),
                ),
            );
        }
        return $result;
    }

    public function parse_symbol($symbol) {
        $currencies = explode('/', $symbol);
        $quote = $currencies[1];
        $base = $currencies[0];
        return $quote . $base;
    }

    public function fetch_ticker($symbol, $params = array ()) {
        yield $this->load_markets();
        $ripioSymbol = $this->parse_symbol($symbol);
        $request = array(
            'pair' => $this->market_id($ripioSymbol),
        );
        $response = yield $this->publicGetPairTicker (array_merge($request, $params));
        // {
        //   "message" => null,
        //   "data" => {
        //     "high" => 15999.12,
        //     "low" => 15000.12,
        //     "volume" => 123.12345678,
        //     "trades_quantity" => 123,
        //     "last" => 15500.12,
        //     "buy" => 15400.12,
        //     "sell" => 15600.12,
        //     "date" => "2017-10-20T00:00:00Z"
        //  }
        // }
        $ticker = $this->safe_value($response, 'data', array());
        $timestamp = $this->parse_date($this->safe_string($ticker, 'date'));
        $last = $this->safe_number($ticker, 'last');
        return array(
            'symbol' => $symbol,
            'timestamp' => $timestamp,
            'datetime' => $this->iso8601($timestamp),
            'high' => $this->safe_number($ticker, 'high'),
            'low' => $this->safe_number($ticker, 'low'),
            'bid' => $this->safe_number($ticker, 'buy'),
            'bidVolume' => null,
            'ask' => $this->safe_number($ticker, 'sell'),
            'askVolume' => null,
            'vwap' => null,
            'open' => null,
            'close' => $last,
            'last' => $last,
            'previousClose' => null,
            'change' => null,
            'percentage' => null,
            'average' => null,
            'baseVolume' => $this->safe_number($ticker, 'volume'),
            'quoteVolume' => null,
            'info' => $ticker,
        );
    }

    public function fetch_order_book($symbol, $limit = null, $params = array ()) {
        yield $this->load_markets();
        $ripioSymbol = $this->parse_symbol($symbol);
        $params = array_merge($params, array( 'pair' => $this->market_id($ripioSymbol) ));
        $response = yield $this->publicGetPairOrders ($params);
        // {
        //     "data" => {
        //         "asks" => array(
        //             {
        //                 "amount" => 197,
        //                 "code" => "qeM4ZCp1E",
        //                 "unit_price" => 60
        //             }
        //         ),
        //         "bids" => array(
        //             array(
        //                 "amount" => 20,
        //                 "code" => "DbqCd9e4_",
        //                 "unit_price" => 50
        //             }
        //         )
        //     ),
        //     "message" => null
        // }
        $orderbook = $this->parse_order_book($response['data'], $symbol, null, 'bids', 'asks', 'unit_price', 'amount');
        return $orderbook;
    }

    public function parse_trade($trade, $market = null) {
        $timestamp = $this->parse_date($this->safe_string($trade, 'date'));
        $id = $timestamp;
        $side = $this->safe_string_lower($trade, 'type');
        $takerOrMaker = null;
        $priceString = $this->safe_string($trade, 'unit_price');
        $amountString = $this->safe_string($trade, 'amount');
        $price = $this->parse_number($priceString);
        $amount = $this->parse_number($amountString);
        $cost = $this->parse_number(Precise::string_mul($priceString, $amountString));
        $fee = null;
        return array(
            'id' => $id,
            'timestamp' => $timestamp,
            'datetime' => $this->iso8601($timestamp),
            'type' => null,
            'side' => $side,
            'price' => $price,
            'amount' => $amount,
            'cost' => $cost,
            'takerOrMaker' => $takerOrMaker,
            'fee' => $fee,
            'info' => $trade,
        );
    }

    public function fetch_trades($symbol, $since = null, $limit = null, $params = array ()) {
        yield $this->load_markets();
        $ripioSymbol = $this->parse_symbol($symbol);
        $params = array_merge($params, array( 'pair' => $this->market_id($ripioSymbol) ));
        $response = yield $this->publicGetPairTrades ($params);
        // {
        //   "message" => null,
        //   "data" => {
        //     "trades" => array(
        //       array(
        //         "type" => "sell",
        //         "amount" => 0.2404764,
        //         "unit_price" => 15160,
        //         "active_order_code" => "Bk0fQxsZV",
        //         "passive_order_code" => "rJEcVyob4",
        //         "date" => "2019-01-03T02:27:33.947Z"
        //       ),
        //       array(
        //         "type" => "sell",
        //         "amount" => 0.00563617,
        //         "unit_price" => 15163,
        //         "active_order_code" => "Bk0fQxsZV",
        //         "passive_order_code" => "B1cl2ys_4",
        //         "date" => "2019-01-03T02:27:33.943Z"
        //       ),
        //       {
        //         "type" => "sell",
        //         "amount" => 0.00680154,
        //         "unit_price" => 15163.03,
        //         "active_order_code" => "Bk0fQxsZV",
        //         "passive_order_code" => "Synrhyj_V",
        //         "date" => "2019-01-03T02:27:33.940Z"
        //       }
        //     ),
        //     "pagination" => {
        //       "total_pages" => 1,
        //       "current_page" => 1,
        //       "page_size" => 100,
        //       "registers_count" => 21
        //     }
        //   }
        // }
        $data = $this->safe_value($response, 'data');
        $trades = $this->safe_value($data, 'trades');
        return $this->parse_trades($trades, null, $since, $limit);
    }

    public function fetch_balance($params = array ()) {
        yield $this->load_markets();
        $response = yield $this->privateGetWalletsBalance ($params);
        // {
        //   "message" => null,
        //   "data" => array(
        //     array(
        //       "address" => "3JentmkNdL97VQDtgRMehxPJKS4AveUZJa",
        //       "available_amount" => 5.23423423,
        //       "currency_code" => "BTC",
        //       "last_update" => "2020-10-20T18:39:45.198Z",
        //       "locked_amount" => 0,
        //       "memo" => null,
        //       "tag" => null
        //     ),
        //     {
        //       "address" => "rfMyfzcavQ4tUe1yJYMS4YPUZhAvcWRbRm",
        //       "available_amount" => 75.31057927,
        //       "currency_code" => "XRP",
        //       "last_update" => "2020-10-20T18:39:45.198Z",
        //       "locked_amount" => 0,
        //       "memo" => null,
        //       "tag" => "0700000000"
        //     }
        //   )
        // }
        $result = array( 'info' => $response );
        $data = $this->safe_value($response, 'data');
        for ($i = 0; $i < count($data); $i++) {
            $balance = $data[$i];
            $currencyId = $this->safe_string($balance, 'currency_code');
            $code = $this->safe_currency_code($currencyId);
            $account = $this->account();
            $account['free'] = $this->safe_number($balance, 'available_amount');
            $account['used'] = $this->safe_number($balance, 'locked_amount');
            $account['total'] = $this->safe_number($balance, 'available_amount') . $this->safe_number($balance, 'locked_amount');
            $result[$code] = $account;
        }
        return $this->safe_balance($result);
    }

    public function create_order($symbol, $type, $side, $amount, $price = null, $params = array ()) {
        yield $this->load_markets();
        $ripioSymbol = $this->parse_symbol($symbol);
        $uppercaseType = strtoupper($type);
        $uppercaseSide = strtoupper($side);
        $request = array(
            'pair' => $this->market_id($ripioSymbol),
            'subtype' => $uppercaseType, // LIMIT, MARKET
            'type' => $uppercaseSide, // BUY or SELL
            'amount' => $this->parse_number($amount),
        );
        if ($uppercaseType === 'LIMITED') {
            $request['unit_price'] = $this->parse_number($price);
        }
        $response = yield $this->privatePostMarketCreateOrder (array_merge($request, $params));
        // {
        //   "message" => null,
        //   "data" => {
        //     "code" => "string"
        //   }
        // }
        return $response['data']['code'];
    }

    public function cancel_order($id, $symbol = null, $params = array ()) {
        yield $this->load_markets();
        $ripioSymbol = $this->parse_symbol($symbol);
        $market = $this->market($ripioSymbol);
        $request = array( 'code' => $id );
        $response = yield $this->privateDeleteMarketUserOrders (array_merge($request, $params));
        // {
        //   "message" => null,
        //   "data" => {
        //     "code" => "string",
        //     "create_date" => "string",
        //     "executed_amount" => 0,
        //     "pair" => "BRLBTC",
        //     "remaining_amount" => 0,
        //     "remaining_price" => 0,
        //     "requested_amount" => 0,
        //     "status" => "string",
        //     "subtype" => "string",
        //     "total_price" => 0,
        //     "type" => "string",
        //     "unit_price" => 0,
        //     "update_date" => "string"
        //   }
        // }
        return $this->parse_order($response['data'], $market);
    }

    public function fetch_order($id, $symbol = null, $params = array ()) {
        if ($symbol === null) {
            throw new ArgumentsRequired($this->id . ' fetchOrder() requires a $symbol argument');
        }
        yield $this->load_markets();
        $market = $this->market($symbol);
        $request = array( 'code' => $id );
        $response = yield $this->privateGetMarketUserOrdersCode (array_merge($request, $params));
        // {
        //     "data" => {
        //         "code" => "ZAeXh5ief",
        //         "create_date" => "2022-07-11T13:47:17.590Z",
        //         "executed_amount" => 30.09664345,
        //         "pair" => "BRLCELO",
        //         "remaining_amount" => 0,
        //         "remaining_price" => 0,
        //         "requested_amount" => 30.09664345,
        //         "status" => "executed_completely",
        //         "subtype" => "market",
        //         "total_price" => 499.94,
        //         "type" => "buy",
        //         "unit_price" => 16.61115469,
        //         "update_date" => "2022-07-11T13:47:17.610Z",
        //         "transactions" => array(
        //             array(
        //                 "amount" => 30,
        //                 "create_date" => "2022-07-11T13:47:17.603Z",
        //                 "total_price" => 210,
        //                 "unit_price" => 7
        //             ),
        //             array(
        //                 "amount" => 0.09664345,
        //                 "create_date" => "2022-07-11T13:47:17.607Z",
        //                 "total_price" => 289.94,
        //                 "unit_price" => 3000.1
        //             }
        //         )
        //     ),
        //     "message" => null
        // }
        $data = $this->safe_value($response, 'data');
        return $this->parse_order($data, $market);
    }

    public function fetch_orders($symbol = null, $since = null, $limit = null, $params = array ()) {
        if ($symbol === null) {
            throw new ArgumentsRequired($this->id . ' fetchOrders() requires a $symbol argument');
        }
        $ripioSymbol = $this->parse_symbol($symbol);
        yield $this->load_markets();
        $request = array(
            'pair' => $this->market_id($ripioSymbol),
        );
        if ($limit !== null) {
            $request['page_size'] = $limit;
        }
        $side = $this->safe_string($params, 'side', null);
        if ($side) {
            $request['type'] = $side;
        }
        $status = $this->safe_string($params, 'status', null);
        if ($status) {
            $request['status'] = $status;
        }
        $response = yield $this->privateGetMarketUserOrdersList (array_merge($request, $params));
        // {
        //   "message" => null,
        //   "data" => {
        //     "orders" => array(
        //       array(
        //         "code" => "SkvtQoOZf",
        //         "type" => "buy",
        //         "subtype" => "limited",
        //         "requested_amount" => 0.02347418,
        //         "remaining_amount" => 0,
        //         "unit_price" => 42600,
        //         "status" => "executed_completely",
        //         "create_date" => "2017-12-08T23:42:54.960Z",
        //         "update_date" => "2017-12-13T21:48:48.817Z",
        //         "pair" => "BRLBTC",
        //         "total_price" => 1000,
        //         "executed_amount" => 0.02347418,
        //         "remaining_price" => 0
        //       ),
        //       {
        //         "code" => "SyYpGa8p_",
        //         "type" => "buy",
        //         "subtype" => "market",
        //         "requested_amount" => 0.00033518,
        //         "remaining_amount" => 0,
        //         "unit_price" => 16352.12,
        //         "status" => "executed_completely",
        //         "create_date" => "2017-10-20T00:26:40.403Z",
        //         "update_date" => "2017-10-20T00:26:40.467Z",
        //         "pair" => "BRLBTC",
        //         "total_price" => 5.48090358,
        //         "executed_amount" => 0.00033518,
        //         "remaining_price" => 0
        //       }
        //     ),
        //     "pagination" => {
        //       "total_pages" => 1,
        //       "current_page" => 1,
        //       "page_size" => 100,
        //       "registers_count" => 21
        //     }
        //   }
        // }
        $data = $this->safe_value($response, 'data', array());
        $orders = $this->safe_value($data, 'orders', array());
        return $this->parse_orders($orders, null, $since, $limit);
    }

    public function fetch_open_orders($symbol = null, $since = null, $limit = null, $params = array ()) {
        $request = array(
            'status' => array( 'executed_partially', 'waiting' ),
        );
        return yield $this->fetch_orders($symbol, $since, $limit, array_merge($request, $params));
    }

    public function fetch_closed_orders($symbol = null, $since = null, $limit = null, $params = array ()) {
        $request = array(
            'status' => array( 'executed_completely', 'canceled' ),
        );
        return yield $this->fetch_orders($symbol, $since, $limit, array_merge($request, $params));
    }

    public function parse_order_status($status) {
        $statuses = array(
            'executed_completely' => 'closed',
            'executed_partially' => 'open',
            'waiting' => 'open',
            'canceled' => 'canceled',
            'pending_creation' => 'pending creation',
        );
        return $this->safe_string($statuses, $status, $status);
    }

    public function parse_order($order, $market = null) {
        // {
        //     "code" => "SkvtQoOZf",
        //     "type" => "buy",
        //     "subtype" => "limited",
        //     "requested_amount" => 0.02347418,
        //     "remaining_amount" => 0,
        //     "unit_price" => 42600,
        //     "status" => "executed_completely",
        //     "create_date" => "2017-12-08T23:42:54.960Z",
        //     "update_date" => "2017-12-13T21:48:48.817Z",
        //     "pair" => "BRLBTC",
        //     "total_price" => 1000,
        //     "executed_amount" => 0.02347418,
        //     "remaining_price" => 0
        // }
        $code = $this->safe_string($order, 'code');
        $amount = $this->safe_number($order, 'requested_amount');
        $type = $this->safe_string_lower($order, 'subtype');
        $price = $this->safe_number($order, 'unit_price');
        $side = $this->safe_string_lower($order, 'type');
        $status = $this->parse_order_status($this->safe_string($order, 'status'));
        $timestamp = $this->parse_date($this->safe_string($order, 'create_date'));
        $average = null;
        $filled = $this->safe_number($order, 'executed_amount');
        $cost = $this->parse_number(Precise::string_mul($this->safe_string($order, 'unit_price'), $this->safe_string($order, 'executed_amount')));
        $trades = null;
        $lastTradeTimestamp = $this->parse_date($this->safe_string($order, 'update_date'));
        $remaining = $this->safe_number($order, 'remaining_amount');
        $symbol = $market;
        return array(
            'id' => $code,
            'clientOrderId' => null,
            'info' => $order,
            'timestamp' => $timestamp,
            'datetime' => $this->iso8601($timestamp),
            'lastTradeTimestamp' => $lastTradeTimestamp,
            'symbol' => $symbol,
            'type' => $type,
            'timeInForce' => null,
            'postOnly' => null,
            'side' => $side,
            'price' => $price,
            'stopPrice' => null,
            'amount' => $amount,
            'cost' => $cost,
            'average' => $average,
            'filled' => $filled,
            'remaining' => $remaining,
            'status' => $status,
            'fee' => null,
            'trades' => $trades,
        );
    }

    public function sign($path, $api = 'public', $method = 'GET', $params = array (), $headers = null, $body = null) {
        $request = '/' . $this->implode_params($path, $params);
        $url = $this->urls['api'][$api] . $request;
        $query = $this->omit($params, $this->extract_params($path));
        if ($api === 'public') {
            if ($query) {
                $url .= '?' . $this->urlencode($query);
            }
        } elseif ($api === 'private') {
            $this->check_required_credentials();
            if ($method === 'POST' || $method === 'DELETE') {
                $body = $this->json($query);
            } else {
                if ($query) {
                    $url .= '?' . $this->urlencode($query);
                }
            }
            $headers = array(
                'Content-Type' => 'application/json',
                'x-api-key' => $this->apiKey,
            );
        }
        return array( 'url' => $url, 'method' => $method, 'body' => $body, 'headers' => $headers );
    }

    public function handle_errors($code, $reason, $url, $method, $headers, $body, $response, $requestHeaders, $requestBody) {
        if ($response === null) {
            return;
        }
        if (($code >= 400) && ($code <= 503)) {
            $feedback = $this->id . ' ' . $body;
            $message = $this->safe_string($response, 'message');
            $this->throw_broadly_matched_exception($this->exceptions['broad'], $message, $feedback);
            $status = (string) $code;
            $this->throw_exactly_matched_exception($this->exceptions['exact'], $status, $feedback);
        }
    }
}
