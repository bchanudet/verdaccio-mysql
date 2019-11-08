
export interface IMysqlQueries{
    readonly add_user: string;
    readonly update_user: string;
    readonly auth_user: string;
    readonly init_database: string[];
    readonly skip_init: boolean;
}

export class MysqlQueries implements IMysqlQueries{

    constructor(private custom : IMysqlQueries){

    }

    public get skip_init() : boolean{
        if(this.custom.skip_init !== undefined){
            return this.custom.skip_init;
        }

        return false;
    }

    public get add_user() : string{
        if(this.custom.add_user !== undefined){
            return this.custom.add_user;
        }

        return this._default_add_user;
    }

    public get update_user() : string{
        if(this.custom.update_user !== undefined){
            return this.custom.update_user;
        }
        return this._default_update_user;
    }

    public get auth_user(): string{
        if(this.custom.auth_user !== undefined){
            return this.custom.auth_user;
        }
        return this._default_auth_user;
    }

    public get init_database(): string[]{
        if(this.custom.auth_user !== undefined){
            return this.custom.init_database;
        }
        return this._default_init_database;
    }

    private get _default_add_user(): string{
        return `
            INSERT INTO \`users\`
                (\`username\`,\`password\`) 
            VALUES
                (
                    ?,
                    PASSWORD(?)
                );
            `;
    }

    private get _default_update_user(): string{
        return `
            UPDATE 
                \`users\` 
            SET 
                \`password\`= PASSWORD(?) 
            WHERE 
                \`username\`=?;
        `;
    }

    private get _default_auth_user(): string{
        return `
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

    private get _default_init_database(): string[]{
        return [
            `CREATE TABLE IF NOT EXISTS \`users\` (
                \`username\` VARCHAR(255) NOT NULL,
                \`password\` TEXT NOT NULL,
                PRIMARY KEY (\`username\`)
            )
            COLLATE='utf8_general_ci'
            ENGINE=InnoDB
            ;`,
            `CREATE TABLE IF NOT EXISTS \`groups\` (
                \`name\` VARCHAR(255) NOT NULL,
                PRIMARY KEY (\`name\`)
            )
            COLLATE='utf8_general_ci'
            ENGINE=InnoDB
            ;`,
            `CREATE TABLE IF NOT EXISTS \`user_group\` (
                \`username\` VARCHAR(255) NOT NULL,
                \`group\` VARCHAR(255) NOT NULL,
                UNIQUE INDEX \`guid_user_guid_group\` (\`username\`, \`group\`),
                INDEX \`fk_group\` (\`group\`),
                CONSTRAINT \`fk_group\` FOREIGN KEY (\`group\`) REFERENCES \`groups\` (\`name\`) ON UPDATE CASCADE ON DELETE CASCADE,
                CONSTRAINT \`fk_user\` FOREIGN KEY (\`username\`) REFERENCES \`users\` (\`username\`) ON UPDATE CASCADE ON DELETE CASCADE
            )
            COLLATE='utf8_general_ci'
            ENGINE=InnoDB
            ;`
        ];
    }
}