create or replace FUNCTION CREATE_ACADEMIC_ROLE(
    personId number,
    token_ ACADEMIC_ROLE.TOKEN%TYPE
)
RETURN ACADEMIC_ROLE%rowtype
AS
    academicRole ACADEMIC_ROLE%rowtype;
BEGIN
    INSERT INTO
        ACADEMIC_ROLE(person_id, TOKEN)
    VALUES (personId, token_)
    RETURNING ROLE_ID, person_id, token, TIMESTAMP
    INTO
    academicRole.ROLE_ID, academicRole.person_id,
        academicRole.TOKEN, academicRole.TIMESTAMP;
    return academicRole;
end;
/

