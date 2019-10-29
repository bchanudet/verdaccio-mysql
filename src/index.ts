import { Callback, Logger, IPluginAuth } from '@verdaccio/types';
import * as mysql from 'mysql';

class MysqlQueries {

    public authenticate : string;
    public add_user : string;
    public update_user : string;

    constructor(config : MysqlQueries){
        console.log(config, typeof config);
        this.add_user = config.add_user !== undefined ? config.add_user : 'INSERT INTO `users`(`username`,`password`) VALUES(?, PASSWORD(?));';
        this.update_user = config.update_user !== undefined ? config.update_user : 'UPDATE `users` SET `password`=? WHERE `username`=?;';
        this.authenticate = config.authenticate !== undefined ? config.authenticate : `
            SELECT
                u.\`username\`,
                GROUP_CONCAT(g.\`name\`) AS usergroups
            FROM
                \`users\` u
            LEFT JOIN \`user_group\` ug
                ON ug.\`username\` = u.\`username\`
            LEFT JOIN \`groups\` g
                ON ug.\`group\` = g.\`name\`
            WHERE
                u.\`username\` = ?
                AND u.\`password\` = PASSWORD(?)
        `;
    }
}

interface MysqlAuthConfig {
    connection : mysql.ConnectionConfig;
    customQueries : MysqlQueries;
}

export default class MysqlAuth  implements IPluginAuth<MysqlAuthConfig> {

    private config : mysql.ConnectionConfig;
    private queries : MysqlQueries;

    private logger: Logger;
    
    constructor(configuration : MysqlAuthConfig, stuff: { logger: Logger}){

        this.config = configuration.connection;
        this.queries = new MysqlQueries(configuration.customQueries);
        this.logger = stuff.logger;
    }


    authenticate(user: string, password: string, cb: Callback){
        const connection = mysql.createConnection(this.config);

        if(this.queries.authenticate.length == 0){
            this.logger.info('MySQL - Can\'t authenticate : authenticate query is empty');
            cb(null, false)
            return;
        }

        connection.query(this.queries.authenticate,[user, password], (error, result) => {
            if(error || result.length !== 1 || result[0].usergroups === null){
                cb(null, false);
            }
            else { 
                cb(null, result[0].usergroups.split(','));
            }

            connection.end();
        });
    }

    adduser(user: string, password: string, cb: Callback){
        const connection = mysql.createConnection(this.config);

        if(this.queries.add_user.length == 0){
            this.logger.info('MySQL - Can\'t add user : add_user query is empty');
            cb(null, false)
            return;
        }

        connection.query(this.queries.add_user,[user, password], (error, result) => {
            if(error || result.length !== 1 || result[0].usergroups === null){
                cb(null, false);
            }
            else { 
                cb(null, result[0].usergroups.split(','));
            }

            connection.end();
        });
    }


}