create table ACADEMIC_ROLE
(
    ROLE_ID   NUMBER       default "C##UNICONNECT_V2"."ISEQ$$_76864".nextval generated as identity
        primary key,
    PERSON_ID NUMBER
        references PERSON,
    TOKEN     VARCHAR2(256)                not null
        constraint MINIMUM_TOKEN_LENGTH
            check (LENGTH(TOKEN) >= 8),
    TIMESTAMP TIMESTAMP(6) default sysdate not null
)
/

