import cluster from 'node:cluster';
import { MysqlClient } from './mysql-client.mjs';

/**
 * 
 * @param {number} idLength 
 * @returns 
 */
export async function invokeWorker(idLength) {
    if (!cluster.isWorker) {
        return;
    }

    const client = new MysqlClient();
    
    const time = {};
    const stats = [];
    let errorCount = 0;
    let continueErrorCount = 0;
    let maxContinueErrorCount = 0;

    const rows = parseInt(process.env.ROWS);
    let i = 0;
    while (i < rows) {
        try {
            const { uniqueId, processingTime } = await client.createUniqueId(idLength);
            if (continueErrorCount > maxContinueErrorCount) {
                maxContinueErrorCount = continueErrorCount
            }
            continueErrorCount = 0;
            if (!time[processingTime]) {
                time[processingTime] = 0
            }
            time[processingTime]++
            i++;
            if (i % (rows / 10) === 0) {
                stats.push({
                    i,
                    r: uniqueId,
                    t: processingTime
                });
            }
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') {
                errorCount++;
                continueErrorCount++;
            } else {
                throw e;
            }
        }
    }
    client.closeConnection();
    const message = { stats, time, errorCount, continueErrorCount: maxContinueErrorCount };
    process.send(JSON.stringify(message));
    process.exit(0);
}
