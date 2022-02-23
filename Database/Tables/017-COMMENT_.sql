create table COMMENT_
(
    CONTENT_ID NUMBER not null
        primary key
        references CONTENT
            on delete cascade,
    COMMENT_OF NUMBER not null
        references CONTENT
            on delete cascade,
    POSTED_AT  TIMESTAMP(6) default (SYSDATE)
)
/

