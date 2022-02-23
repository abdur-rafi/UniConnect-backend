create or replace FUNCTION CREATE_MANAGEMENT(
    personId number,
    uniId Number,
    role MANAGEMENT.uni_management_role%TYPE
)
RETURN MANAGEMENT%rowtype
AS
    managementRow MANAGEMENT%rowtype;
BEGIN
    INSERT INTO MANAGEMENT(person_id, university_id, uni_management_role) VALUES (personId, uniId, role)
    RETURNING management_id, person_id, university_id, timestamp, uni_management_role
    INTO
    managementRow.management_id, managementRow.person_id, managementRow.university_id, managementRow.timestamp, managementRow.uni_management_role;
    return managementRow;
end;
/

