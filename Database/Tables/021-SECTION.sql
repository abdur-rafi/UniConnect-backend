create table SECTION
(
    BATCH_ID         NUMBER not null,
    DEPARTMENT_ID    NUMBER not null,
    SECTION_NAME     CHAR   not null,
    SECTION_GROUP_ID NUMBER not null
        references PGROUP
            on delete cascade,
    constraint TRIPLET
        primary key (SECTION_NAME, BATCH_ID, DEPARTMENT_ID),
    foreign key (BATCH_ID, DEPARTMENT_ID) references BATCHDEPT
        on delete cascade
)
/

