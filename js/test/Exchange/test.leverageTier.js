'use strict';

const assert = require ('assert');

function testLeverageTier (exchange, method, tier) {
    const format = {
        'tier': 1,
        'notionalFloor': 0,
        'notionalCap': 5000,
        'maintenanceMarginRatio': 0.01,
        'maxLeverage': 25,
        'info': {},
    };
    const keys = Object.keys (format);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        assert (key in tier);
    }
    assert (tier['tier'] >= 0);
    assert (tier['notionalFloor'] >= 0);
    assert (tier['notionalCap'] >= 0);
    assert (tier['maintenanceMarginRate'] <= 1);
    assert (tier['maxLeverage'] >= 1);
    console.log (exchange.id, method, tier['tier'], tier['notionalFloor'], tier['notionalCap'], tier['maintenanceMarginRate'], tier['maxLeverage']);
    return tier;
}

module.exports = testLeverageTier;
