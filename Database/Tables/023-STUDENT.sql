create table STUDENT
(
    ROLE_ID         NUMBER not null
        primary key
        references ACADEMIC_ROLE,
    BATCH_ID        NUMBER not null,
    DEPARTMENT_ID   NUMBER not null
        references DEPARTMENT
            on delete cascade,
    SECTION_NAME    CHAR,
    SECTION_ROLL_NO NUMBER,
    constraint UNIQUEROLE
        unique (SECTION_NAME, BATCH_ID, DEPARTMENT_ID, SECTION_ROLL_NO),
    foreign key (SECTION_NAME, BATCH_ID, DEPARTMENT_ID) references SECTION
)
/

