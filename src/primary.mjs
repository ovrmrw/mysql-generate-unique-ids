import cluster from 'node:cluster'
import os from 'node:os'
import mysql from 'mysql2/promise';

export async function invokePrimary() {
    if (!cluster.isPrimary) {
        return;
    }

    await createTable()

    // const totalRows = 10000 * 10000
    const totalRows = 1 * 10000
    // const totalRows = 10
    const idLength = 8

    const cpus = os.cpus(); // length: 10
    const workers = cpus.map(_ => cluster.fork({ ROWS: totalRows / cpus.length, ID_LENGTH: idLength }))
    const promises = []
    const time = {}
    const stats = []
    const continueErrorCounts = []
    let errorCount = 0
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

async function createTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });
    // await connection.execute('DROP TABLE IF EXISTS unique_ids;'); // テーブル削除
    const createTable = `
        CREATE TABLE IF NOT EXISTS unique_ids (
            id bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            unique_id varchar(16) NOT NULL UNIQUE
        );
    `;
    await connection.execute(createTable);
    connection.end();
}
