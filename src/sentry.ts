import * as Sentry from '@sentry/node';
import {isDev} from './config';

Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    enabled: !isDev,
});
