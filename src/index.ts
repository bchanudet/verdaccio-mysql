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
    private connOK: boolean;
    
    constructor(configuration : MysqlAuthConfig, stuff: { logger: Logger}){

        this.config = configuration.connection;
        this.queries = new MysqlQueries(configuration.customQueries);
        this.logger = stuff.logger;
        
        this.connOK = false;

        // Calling initialization at the constructor check connection to the database.
        // It will also create the default tables if not overriden.
        this.test()
            .then((success : boolean) => {
                if(success) {
                    this.connOK = true;
                    this.initialize();
                }
            })
            .catch((reason) => {
                this.connOK = false;
            });
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

    private async test() : Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const connection = mysql.createConnection(this.config);

            connection.query('SELECT 1', (err, res) => {
                if(err){
                    this.logger.error('MySQL - Test connection did not work');
                    this.logger.error('MySQL - Error: '+ err.message);
                    reject();
                }
                connection.destroy();
                resolve();
                return;
            })
        });
    }

    private async initialize() : Promise<boolean> {
        return new Promise<boolean>(async (resolve, reject) => {
            const connection = mysql.createConnection(this.config);
            let queries : string[] = this.queries.init_database;
            
            for(let i = 0, l = queries.length; i < l; i+= 1){
                connection.query(queries[i], (error, result)=> {
                    if(error){
                        this.logger.error('MySQL - Error during initialization');
                        this.logger.error('MySQL - '+ error.message);
                        connection.end();
                        reject();
                        return;
                    }
                });
            }
            resolve();
        });
    }
}