create table BATCH
(
    BATCH_ID       NUMBER generated as identity
        primary key,
    NAME           VARCHAR2(256)
        constraint MINIMUM_BATCH_NAME_LENGTH
            check ((LENGTH(NAME) >= 3)),
    UNIVERSITY_ID  NUMBER not null
        references UNIVERSITY
            on delete cascade,
    BATCH_GROUP_ID NUMBER not null
        references PGROUP
            on delete cascade,
    YEAR           NUMBER not null,
    BATCH_TYPE     CHAR(2)
        constraint UGORPG
            references STYPE,
    constraint UNIQUEBATCHNAME
        unique (UNIVERSITY_ID, BATCH_TYPE, NAME),
    constraint UNIQUEBATCHYEAR
        unique (UNIVERSITY_ID, BATCH_TYPE, YEAR)
)
/

