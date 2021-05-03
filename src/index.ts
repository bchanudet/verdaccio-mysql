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

    private authQueryEmptyWarned: boolean;
    private addQueryEmptyWarned: boolean;
    private passwordQueryEmptyWarned: boolean;
    
    constructor(configuration : MysqlAuthConfig, stuff: { logger: Logger}){

        this.config = configuration.connection;
        this.queries = new MysqlQueries(configuration.queries);
        this.logger = stuff.logger;
        
        this.authQueryEmptyWarned = false;
        this.addQueryEmptyWarned = false;
        this.passwordQueryEmptyWarned = false;

        this.test();
    }

    authenticate(user: string, password: string, cb: Callback){
        if(this.queries.auth_user.length == 0 && !this.authQueryEmptyWarned){
            this.logger.warn('MySQL - Can\'t authenticate: authenticate query is empty');
            this.authQueryEmptyWarned = true;
            return cb(null, false);
        }

        this.runQuery(this.queries.auth_user,[user, password], (error, result) => {
            if(error){
                return cb(null, false);
            }
            else if(!Array.isArray(result)){
                this.logger.error({}, 'MySQL - Result is not an rowset');
                return cb(null, false);
            }
            else if(result[0] === null){
                this.logger.error({}, 'MySQL - The query returned an invalid result');
                return cb(null, false);
            }
            else if(result.length === 0){
                // Usual case where everything is valid but we got a bad password.
                return cb(null, false);
            }
            else if(result.length > 1){
                this.logger.error({"rows": result.length}, "MySQL - The query returned @{rows} rows. Only one row must be returned.");
                return cb(null, false);
            }
            else { 
                let groups: string = "";
                if(result[0].usergroups === undefined){
                    this.logger.warn({},"MySQL - The query didn't contain a `usergroups` column. Group feature will likely not be functionnal.");
                }
                else if(result[0].usergroups !== null){
                    groups = result[0].usergroups;
                }
                
                return cb(null, groups.split(','));
            }
        });
    }

    adduser(user: string, password: string, cb: Callback){

        if(this.queries.add_user.length == 0 && !this.addQueryEmptyWarned){
            this.logger.warn({}, 'MySQL - Can\'t add user: add_user query is empty');
            this.addQueryEmptyWarned = true;
            return cb(null, false);
        }

        this.runQuery(this.queries.add_user,[user, password], (error, result) => {
            if(error){
                this.logger.error({error}, "MySQL - Error: @{error.message}");
                return cb(null, false);
            }
            else { 
                return cb(null, true);
            }
        });
    }

    changePassword(user: string, password: string, newPassword: string, cb: Callback){
        if(this.queries.update_user.length == 0 && !this.passwordQueryEmptyWarned){
            this.logger.warn({}, 'MySQL - Can\'t change password: update_user query is empty');
            this.passwordQueryEmptyWarned = true;
            return cb(null, false);
        }

        this.runQuery(this.queries.update_user,[newPassword, user, password], (error, result) => {
            if(error){
                this.logger.error({error}, "MySQL - Error: @{error.message}");
                cb(null, false);
            }
            else { 
                cb(null, true);
            }
        });
    }

    private async test() : Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            this.runQuery('SELECT 1', [], (err, res) => {
                if(err){
                    this.logger.error({}, 'MySQL - Test connection did not work');
                    this.logger.error({err}, 'MySQL - Error: @{err.message}');
                    reject();
                }
                resolve(true);
                return;
            });
        });
    }

    private runQuery(query: string, parameters: string[], callback: mysql.queryCallback): void{
        const connection = mysql.createConnection(this.config);

        this.logger.debug({query, parameters}, 'MySQL - Running @{query} with @{parameters}');
        connection.query(query, parameters, (error, result) => {
            if(error){
                this.logger.error({error}, 'MySQL - Error: @{err.message}');
            }
            return callback(error, result);
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