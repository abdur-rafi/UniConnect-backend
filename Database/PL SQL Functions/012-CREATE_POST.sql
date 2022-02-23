create or replace FUNCTION CREATE_POST(
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

