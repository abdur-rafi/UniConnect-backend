create or replace FUNCTION CREATE_CONTENT(
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
    contentRow.CONTENT_ID,contentRow.TEXT,contentRow.POSTED_AT,contentRow.ROLE_ID,contentRow.GROUP_ID;
    return contentRow;
end;
/

