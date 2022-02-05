
ALTER TABLE COMMENT_ ADD TIME TIMESTAMP  DEFAULT(SYSDATE);
ALTER TABLE COMMENT_ RENAME COLUMN TIME TO POSTED_AT;
create OR REPLACE FUNCTION CREATE_COMMENT(
    text_ CONTENT.TEXT%TYPE,
    roleId number,
    commentOf number
)
return COMMENT_%rowtype
IS
    contentRow CONTENT%rowtype;
    commentRow COMMENT_%rowtype;
    groupId Number;
BEGIN
    SELECT GROUP_ID INTO groupId FROM CONTENT WHERE CONTENT_ID = commentOf;
    contentRow := CREATE_CONTENT(text_, roleId, groupId);
    INSERT INTO COMMENT_(CONTENT_ID, COMMENT_OF) VALUES (contentRow.CONTENT_ID, commentOf)
    RETURNING CONTENT_ID, COMMENT_OF, POSTED_AT
    INTO
        commentRow.CONTENT_ID, commentRow.COMMENT_OF, commentRow.POSTED_AT;
    return commentRow;
end;
/

