create or replace FUNCTION CREATE_STUDENT(
    personId number,
    batchId number,
    departmentId number,
    token_ ACADEMIC_ROLE.TOKEN%TYPE,
    sectionName STUDENT.section_name%TYPE,
    sectionRolNo STUDENT.section_roll_no%TYPE

)
RETURN STUDENT%rowtype
AS
    studentRow STUDENT%rowtype;
    academicRoleRow ACADEMIC_ROLE%rowtype;
BEGIN
    academicRoleRow := CREATE_ACADEMIC_ROLE(personId,token_);
    INSERT INTO STUDENT(ROLE_ID, BATCH_ID, DEPARTMENT_ID, SECTION_NAME, SECTION_ROLL_NO)
    VALUES
    (academicRoleRow.ROLE_ID, batchId, departmentId, sectionName, sectionRolNo) returning
    role_id, batch_id, department_id, section_name, section_roll_no
    INTO
    studentRow.ROLE_ID, studentRow.batch_id, studentRow.department_id, studentRow.section_name ,studentRow.section_roll_no;
    return studentRow;
end;
/

