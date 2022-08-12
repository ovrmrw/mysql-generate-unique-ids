import cluster from 'node:cluster'
import os from 'node:os'
import { MysqlClient } from './mysql-client.mjs';

export async function invokePrimary(totalRows) {
    if (!cluster.isPrimary) {
        return;
    }

    const client = new MysqlClient();
    await client.createTable();
    client.closeConnection();

    const cpus = os.cpus();
    const workers = cpus.map(_ => cluster.fork({ ROWS: totalRows / cpus.length }));
    const promises = [];
    const time = {};
    const stats = [];
    const continueErrorCounts = [];
    let errorCount = 0;
    for (const worker of workers) {
        const promise = new Promise((resolve, reject) => {
            worker
                .on('message', message => {
                    const { stats: _stats, time: _time, errorCount: _errorCount, continueErrorCount: _continueErrorCount } = JSON.parse(message);
                    for (const s of _stats) {
                        stats.push(s);
                    }
                    for (const [k, v] of Object.entries(_time)) {
                        if (!time[k]) {
                            time[k] = 0;
                        }
                        time[k] += v;
                    }
                    continueErrorCounts.push(_continueErrorCount);
                    errorCount += _errorCount;
                })
                .on('error', reject)
                .on('exit', resolve)
        })
        promises.push(promise)
    }
    await Promise.all(promises)
    for (const k in time) {
        if (time[k] < totalRows / 1000) {
            delete time[k];
        }
    }
    console.log({ stats });
    console.log({ time })
    console.log({ errorCount });
    console.log({ continueErrorCounts });
}
