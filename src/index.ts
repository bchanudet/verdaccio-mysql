import { Callback, Logger, IPluginAuth } from '@verdaccio/types';
import * as mysql from 'mysql';
import { IMysqlQueries, MysqlQueries } from './mysql-queries';

interface MysqlAuthConfig {
    connection : mysql.ConnectionConfig;
    customQueries : IMysqlQueries;
}

export default class MysqlAuth  implements IPluginAuth<MysqlAuthConfig> {

    private config : mysql.ConnectionConfig;
    private queries : IMysqlQueries;

    private logger: Logger;
    
    constructor(configuration : MysqlAuthConfig, stuff: { logger: Logger}){

        this.config = configuration.connection;
        this.queries = new MysqlQueries(configuration.customQueries);
        this.logger = stuff.logger;
    }


    authenticate(user: string, password: string, cb: Callback){
        const connection = mysql.createConnection(this.config);

        if(this.queries.auth_user.length == 0){
            this.logger.info('MySQL - Can\'t authenticate : authenticate query is empty');
            cb(null, false)
            return;
        }

        connection.query(this.queries.auth_user,[user, password], (error, result) => {
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