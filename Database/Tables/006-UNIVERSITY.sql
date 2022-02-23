create table UNIVERSITY
(
    UNIVERSITY_ID       NUMBER       default "C##UNICONNECT_V2"."ISEQ$$_76842".nextval generated as identity
        primary key,
    NAME                VARCHAR2(512)                not null
        constraint UNI_NAME_MIN_LENGTH
            check (LENGTH(NAME) >= 3),
    TIMESTAMP           TIMESTAMP(6) default sysdate not null,
    ALL_GROUP_ID        NUMBER                       not null
        references PGROUP,
    TEACHERS_GROUP_ID   NUMBER                       not null
        references PGROUP,
    STUDENTS_GROUP_ID   NUMBER                       not null
        references PGROUP,
    UGSTUDENTS_GROUP_ID NUMBER                       not null
        references PGROUP,
    PGSTUDENTS_GROUP_ID NUMBER                       not null
        references PGROUP
)
/

