create table PERSON
(
    PERSON_ID     NUMBER       default "C##UNICONNECT_V2"."ISEQ$$_76859".nextval generated as identity
        primary key,
    FIRST_NAME    VARCHAR2(256)
        constraint MINIMUM_FIRST_NAME_LENGTH
            check ((LENGTH(FIRST_NAME) >= 2)),
    LAST_NAME     VARCHAR2(256),
    HOUSE_ADDRESS VARCHAR2(1024),
    EMAIL         VARCHAR2(512)                not null
        unique,
    PHONE_NO      CHAR(11)
        unique,
    DATE_OF_BIRTH DATE,
    PASSWORD      VARCHAR2(256)                not null,
    TIMESTAMP     TIMESTAMP(6) default sysdate not null,
    DISTRICT      VARCHAR2(256)
        constraint CHECK_DISTRICT_LENGTH
            check (LENGTH(DISTRICT) >= 2)
        constraint CHECK_DIVISION_LENGTH
            check (LENGTH(DISTRICT) >= 2),
    DIVISION      VARCHAR2(256),
    POSTAL_CODE   VARCHAR2(16)
)
/

