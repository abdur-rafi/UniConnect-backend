create table VOTE
(
    CONTENT_ID NUMBER not null
        references CONTENT
            on delete cascade,
    DOWN       CHAR default 'N'
        constraint CONSTRAINT_DOWN_VAL
            check (DOWN = 'Y' OR DOWN = 'N'),
    ROLE_ID    NUMBER not null
        references ACADEMIC_ROLE
            on delete cascade,
    constraint UNIQUE_VOTE_
        primary key (ROLE_ID, CONTENT_ID)
)
/

