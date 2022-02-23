create table BATCHDEPT
(
    BATCH_ID            NUMBER not null
        references BATCH
            on delete cascade,
    DEPARTMENT_ID       NUMBER not null
        references DEPARTMENT
            on delete cascade,
    BATCH_DEPT_GROUP_ID NUMBER not null
        references PGROUP
            on delete cascade,
    constraint PAIR_KEY_BD
        primary key (BATCH_ID, DEPARTMENT_ID)
)
/

