
ALTER TABLE COMMENT_ ADD TIME TIMESTAMP  DEFAULT(SYSDATE);
ALTER TABLE COMMENT_ RENAME COLUMN TIME TO POSTED_AT;

create FUNCTION CREATE_CONTENT(
    text_ CONTENT.TEXT%TYPE,
    roleId number,
    groupId number
)
RETURN CONTENT%rowtype
IS
    contentRow CONTENT%rowtype;
BEGIN
    INSERT INTO CONTENT(TEXT, ROLE_ID, GROUP_ID) VALUES (text_, roleId, groupId)
    RETURNING CONTENT_ID,TEXT,POSTED_AT,ROLE_ID, GROUP_ID
    INTO
    contentRow.CONTENT_ID,contentRow.TEXT,contentRow.POSTED_AT,contentRow.ROLE_ID, contentRow.GROUP_ID;
    return contentRow;
end;
/

create FUNCTION CREATE_POST(
    text_ CONTENT.TEXT%TYPE,
    roleId number,
    title_ POST.TITLE%TYPE,
    groupId number
)
RETURN POST%rowtype
IS
    contentRow CONTENT%rowtype;
    postRow POST%rowtype;
BEGIN
    contentRow := CREATE_CONTENT(text_, roleId, groupId);
    INSERT INTO POST(content_id, title) VALUES (contentRow.CONTENT_ID,title_)
    RETURNING CONTENT_ID, TITLE
    INTO
        postRow.CONTENT_ID, postRow.TITLE;
    return postRow;
end;
/



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

