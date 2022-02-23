create table DEPARTMENT
(
    DEPARTMENT_ID       NUMBER       default "C##UNICONNECT_V2"."ISEQ$$_76845".nextval generated as identity
        primary key,
    NAME                VARCHAR2(512)                not null
        constraint MINIMUM_DEPARTMENT_NAME_LENGTH
            check ((LENGTH(NAME) >= 3)),
    TIMESTAMP           TIMESTAMP(6) default sysdate not null,
    UNIVERSITY_ID       NUMBER                       not null
        references UNIVERSITY
            on delete cascade,
    DEPT_CODE           CHAR(2)                      not null,
    ALL_GROUP_ID        NUMBER                       not null
        references PGROUP,
    STUDENTS_GROUP_ID   NUMBER                       not null
        references PGROUP,
    TEACHERS_GROUP_ID   NUMBER                       not null
        references PGROUP,
    UGSTUDENTS_GROUP_ID NUMBER                       not null
        references PGROUP,
    PGSTUDENTS_GROUP_ID NUMBER                       not null
        references PGROUP,
    constraint UNIQUEDEPTCODE
        unique (UNIVERSITY_ID, DEPT_CODE),
    constraint UNIQUENAME
        unique (UNIVERSITY_ID, NAME)
)
/

