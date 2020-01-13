import { Callback, Logger, IPluginAuth } from '@verdaccio/types';
import * as mysql from 'mysql';

interface MysqlAuthConfig {
    connection : mysql.ConnectionConfig;
    queries : IMysqlQueries;
}

interface IMysqlQueries{
    readonly add_user: string;
    readonly update_user: string;
    readonly auth_user: string;
}

export default class MysqlAuth  implements IPluginAuth<MysqlAuthConfig> {

    private config : mysql.ConnectionConfig;
    private queries : IMysqlQueries;

    private logger: Logger;
    private connOK: boolean;
    
    constructor(configuration : MysqlAuthConfig, stuff: { logger: Logger}){

        this.config = configuration.connection;
        this.queries = new MysqlQueries(configuration.queries);
        this.logger = stuff.logger;
        
        this.connOK = false;

        // Calling initialization at the constructor check connection to the database.
        this.test()
            .then((success : boolean) => {
                if(success) {
                    this.connOK = true;
                }
            })
            .catch((reason) => {
                this.connOK = false;
            });
    }

    authenticate(user: string, password: string, cb: Callback){
        const connection = mysql.createConnection(this.config);

        if(this.queries.auth_user.length == 0){
            this.logger.info('MySQL - Can\'t authenticate: authenticate query is empty');
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
            this.logger.info('MySQL - Can\'t add user: add_user query is empty');
            cb(null, false)
            return;
        }

        connection.query(this.queries.add_user,[user, password], (error, result) => {
            if(error){
                cb(null, false);
            }
            else { 
                cb(null, result[0].usergroups.split(','));
            }

            connection.end();
        });
    }

    changePassword(user: string, password: string, newPassword: string, cb: Callback){
        const connection = mysql.createConnection(this.config);

        if(this.queries.update_user.length == 0){
            this.logger.info('MySQL - Can\'t change password: update_user query is empty');
            cb(null, false)
            return;
        }

        connection.query(this.queries.update_user,[newPassword, user, password], (error, result) => {
            if(error){
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
}


class MysqlQueries implements IMysqlQueries{

    constructor(private custom : IMysqlQueries){

    }

    public get add_user() : string{
        if(this.custom.add_user !== undefined){
            return this.custom.add_user;
        }

        return '';
    }

    public get update_user() : string{
        if(this.custom.update_user !== undefined){
            return this.custom.update_user;
        }
        return '';
    }

    public get auth_user(): string{
        if(this.custom.auth_user !== undefined){
            return this.custom.auth_user;
        }
        return '';
    }
}