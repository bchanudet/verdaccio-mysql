CREATE TABLE IF NOT EXISTS `users` (
    `username` VARCHAR(255) NOT NULL,
    `password` TEXT NOT NULL,
    PRIMARY KEY (`username`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE IF NOT EXISTS `groups`(
    `name` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`name`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE IF NOT EXISTS `user_group` (
    `username` VARCHAR(255) NOT NULL,
    `group` VARCHAR(255) NOT NULL,
    UNIQUE INDEX `guid_user_guid_group` (`username`, `group`),
    INDEX `fk_group` (`group`),
    CONSTRAINT `fk_group` FOREIGN KEY (`group`) REFERENCES `groups` (`name`) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT `fk_user` FOREIGN KEY (`username`) REFERENCES `users` (`username`) ON UPDATE CASCADE ON DELETE CASCADE
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;