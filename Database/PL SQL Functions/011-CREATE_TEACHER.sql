create or replace FUNCTION CREATE_TEACHER(
    personId number,
    token_ ACADEMIC_ROLE.TOKEN%TYPE,
    rank_ TEACHER.RANK%TYPE,
    departmentId number
)
RETURN TEACHER%rowtype
AS
    teacherRow TEACHER%rowtype;
    academicRoleRow ACADEMIC_ROLE%rowtype;
BEGIN
    academicRoleRow := CREATE_ACADEMIC_ROLE(personId, token_);

    INSERT INTO TEACHER(ROLE_ID, rank, department_id)
    VALUES (academicRoleRow.ROLE_ID, rank_, departmentId)
    RETURNING ROLE_ID, rank, department_id
    INTO
    teacherRow.ROLE_ID, teacherRow.rank, teacherRow.department_id;
    return teacherRow;
end;
/

