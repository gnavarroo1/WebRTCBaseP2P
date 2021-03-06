export { suite, test, params, skip, only } from '@testdeck/mocha';
import path from 'path';
import * as _chai from 'chai';
const _should = _chai.should();
export const should = _should;
import * as dotenv from 'dotenv';
// const dotEnvPath = path.resolve(`../.env${process.env.NODE_ENV === 'test' ? '.test':''}`);
// console.log(dotEnvPath);
dotenv.config();
export const MONGODB_URI =  process.env.MONGODB_URI;
