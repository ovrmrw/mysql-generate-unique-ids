import cluster from 'node:cluster';
import mysql from 'mysql2/promise';

export async function invokeWorker() {
    if (!cluster.isWorker) {
        return;
    }

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });

    const time = {};
    const stats = [];
    let errorCount = 0;
    let continueErrorCount = 0;
    let maxContinueErrorCount = 0;

    const idLength = parseInt(process.env.ID_LENGTH);
    const rows = parseInt(process.env.ROWS);
    let i = 0;
    while (i < rows) {
        try {
            const { uniqueId, processingTime } = await createUniqueId(connection, idLength);
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
    connection.end();
    const message = { stats, time, errorCount, continueErrorCount: maxContinueErrorCount };
    process.send(JSON.stringify(message));
    process.exit(0);
}

/**
 * 
 * @param {mysql.Connection} connection 
 * @param {number} idLength 
 * @returns 
 */
async function createUniqueId(connection, idLength) {
    const startTime = Date.now();
    const uniqueId = getRandomID(idLength);
    const query = `INSERT INTO unique_ids (unique_id) VALUES ('${uniqueId}');`;
    // const query = `INSERT INTO unique_ids (unique_id) VALUES (SUBSTR(MD5(RAND()), 1, ${idLength}))`
    const [result] = await connection.execute(query);
    const processingTime = Date.now() - startTime;
    return { uniqueId, processingTime };
}

/**
 * 
 * @param {number} length 
 * @returns 
 */
function getRandomID(length) {
    const result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}
