create table TEACHER
(
    ROLE_ID       NUMBER not null
        primary key
        references ACADEMIC_ROLE,
    RANK          VARCHAR2(128),
    DEPARTMENT_ID NUMBER not null
        references DEPARTMENT
)
/

