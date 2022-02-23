create or replace FUNCTION CREATE_DEPARTMENT(
    universityId number,
    deptName DEPARTMENT.name%TYPE,
    deptCode DEPARTMENT.dept_code%TYPE
)
RETURN DEPARTMENT%rowtype
AS
    newRow DEPARTMENT%rowtype;
    allGrId NUMBER;
    teachGrId NUMBER;
    stdGrId Number;
    ugStdId Number;
    pgStdId NUMBER;

BEGIN
    allGrId := CREATE_GROUP(deptName).group_id;
    teachGrId := CREATE_GROUP(deptName || ' - All Teacher').group_id;
    stdGrId := CREATE_GROUP(deptName || ' - All Student').group_id;
    ugStdId := CREATE_GROUP(deptName || ' - UG').group_id;
    pgStdId := CREATE_GROUP(deptName || ' -PG').group_id;
    INSERT INTO DEPARTMENT(NAME, dept_code, UNIVERSITY_ID, ALL_GROUP_ID, STUDENTS_GROUP_ID, TEACHERS_GROUP_ID, UGSTUDENTS_GROUP_ID, PGSTUDENTS_GROUP_ID)
    VALUES (deptName, deptCode, universityId, allGrId, stdGrId, teachGrId, ugStdId, pgStdId) RETURNING
    DEPARTMENT_ID, NAME, UNIVERSITY_ID, ALL_GROUP_ID, STUDENTS_GROUP_ID, TEACHERS_GROUP_ID, UGSTUDENTS_GROUP_ID, PGSTUDENTS_GROUP_ID, TIMESTAMP, DEPT_CODE INTO
    newRow.department_id, newRow.name, newRow.university_id, newRow.all_group_id, newRow.students_group_id, newRow.teachers_group_id, newRow.ugStudents_group_id,
        newRow.pgStudents_group_id, newRow.TIMESTAMP, newRow.DEPT_CODE;
    return newRow;
end;
/

