import mysql from 'mysql2';
import * as config from './config.mjs';
import { getRandomId } from './utils.mjs';

export class MysqlClient {
    constructor() {
        this.connection = mysql.createConnection(config.db);
    }

    closeConnection() {
        this.connection.end();
    }

    async createTable() {
        // テーブル削除
        // await new Promise((resolve, reject) => {
        //     this.connection.execute('DROP TABLE IF EXISTS unique_ids;', (err) => {
        //         if (err) {
        //             reject(err);
        //             return;
        //         }
        //         resolve();
        //     });
        // });

        // テーブル作成
        const query = `
            CREATE TABLE IF NOT EXISTS unique_ids (
                id bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                unique_id varchar(16) NOT NULL UNIQUE
            );
        `;    
        await new Promise((resolve, reject) => {
            this.connection.execute(query, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    /**
     * 
     * @param {number} length 
     * @returns 
     */
    async createUniqueId(length) {
        const startTime = Date.now();
        const uniqueId = getRandomId(length);
        const query = `INSERT INTO unique_ids (unique_id) VALUES ('${uniqueId}');`;
        await new Promise((resolve, reject) => {
            this.connection.execute(query, err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
        const processingTime = Date.now() - startTime;
        return { uniqueId, processingTime };
    }
}
