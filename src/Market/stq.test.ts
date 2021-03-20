import 'mocha';
import {expect} from 'chai';
import {insertIntoInflux} from './stq';

describe('STQ Symbol Test', () => {
    it('it should get market', () => {
        const market = insertIntoInflux();
        expect(market).to.be.not.null;
    });
});
