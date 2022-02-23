create table MANAGEMENT
(
    MANAGEMENT_ID       NUMBER       default "C##UNICONNECT_V2"."ISEQ$$_76872".nextval generated as identity
        primary key,
    PERSON_ID           NUMBER                       not null
        references PERSON,
    UNIVERSITY_ID       NUMBER                       not null
        references UNIVERSITY,
    TIMESTAMP           TIMESTAMP(6) default sysdate not null,
    UNI_MANAGEMENT_ROLE CHAR(3)
        references ROLE
)
/

