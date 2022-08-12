import cluster from 'node:cluster';
import dotenv from 'dotenv';
dotenv.config();

import { invokePrimary } from './primary.mjs';
import { invokeWorker } from './worker.mjs';

async function main() {
    if (cluster.isPrimary) {
        await invokePrimary()
    } else {
        await invokeWorker()
    }
}

main().catch(console.error);
