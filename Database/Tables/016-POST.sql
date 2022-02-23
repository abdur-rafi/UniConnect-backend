create table POST
(
    CONTENT_ID NUMBER not null
        primary key
        references CONTENT
            on delete cascade,
    TITLE      CLOB   not null
)
/

