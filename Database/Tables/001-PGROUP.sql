create table PGROUP
(
    GROUP_ID     NUMBER       default "C##UNICONNECT_V2"."ISEQ$$_76839".nextval generated as identity
        primary key,
    NAME         VARCHAR2(256)
        constraint GROUP_NAME_MIN_LENGTH
            check (LENGTH(NAME) >= 3),
    TIMESTAMP    TIMESTAMP(6) default sysdate not null,
    USER_CREATED CHAR         default ('N')
)
/

