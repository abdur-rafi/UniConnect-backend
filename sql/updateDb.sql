-- auto-generated definition
create table COMMENT_2
(
    CONTENT_ID NUMBER not null
        primary key
        references CONTENT ON DELETE CASCADE ,
    COMMENT_OF NUMBER not null
        references CONTENT ON DELETE CASCADE ,
    POSTED_AT  TIMESTAMP(6) default (SYSDATE)
)
/

;
INSERT INTO COMMENT_2 SELECT * FROM COMMENT_;

DROP TABLE COMMENT_;
ALTER TABLE COMMENT_2 RENAME TO COMMENT_;

-- auto-generated definition
create table POST2
(
    CONTENT_ID NUMBER not null
        primary key
        references CONTENT ON DELETE CASCADE ,
    TITLE      CLOB   not null
)
/

INSERT INTO POST2 SELECT * FROM POST;
DROP TABLE POST;
ALTER TABLE POST2 RENAME TO POST;

DELETE FROM CONTENT WHERE CONTENT_ID = :cId;