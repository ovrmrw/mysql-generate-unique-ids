import cluster from 'node:cluster';
import { invokePrimary } from './primary.mjs';
import { invokeWorker } from './worker.mjs';

// const totalRows = 10000 * 10000;
const totalRows = 1 * 10000;
// const totalRows = 10;
const idLength = 8;

async function main() {
    if (cluster.isPrimary) {
        await invokePrimary(totalRows);
    } else {
        await invokeWorker(idLength);
    }
}

main().catch(console.error);
