create or replace FUNCTION CREATE_GROUP(
    grName PGROUP.name%TYPE,
    user_created_ PGROUP.USER_CREATED%TYPE := 'N'
)
return pGroup%rowtype
AS
    row PGROUP%rowtype;
BEGIN
    INSERT INTO PGROUP(NAME,USER_CREATED) VALUES (grName, user_created_) returning group_id, name, timestamp, USER_CREATED
        INTO row.group_id, row.name, row.timestamp, row.USER_CREATED;
    return row;
end;
/

