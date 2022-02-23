create or replace FUNCTION CREATE_UNIVERSITY(
    uniName UNIVERSITY.name%TYPE
)

RETURN UNIVERSITY%rowtype
As
    uniRow UNIVERSITY%rowtype;
    allGrId NUMBER;
    teachGrId NUMBER;
    stdGrId Number;
    ugStdId Number;
    pgStdId NUMBER;
BEGIN
    allGrId := CREATE_GROUP(uniName).group_id;
    teachGrId := CREATE_GROUP(uniName || '- All Teacher').group_id;
    stdGrId := CREATE_GROUP(uniName || '- All Student').group_id;
    ugStdId := CREATE_GROUP(uniName || '- UG').group_id;
    pgStdId := CREATE_GROUP(uniName || '-PG').group_id;
    INSERT INTO UNIVERSITY(NAME, ALL_GROUP_ID, TEACHERS_GROUP_ID, STUDENTS_GROUP_ID, UGSTUDENTS_GROUP_ID, PGSTUDENTS_GROUP_ID)
    VALUES (uniName,allGrId, teachGrId, stdGrId,ugStdId, pgStdId) RETURNING
    UNIVERSITY_ID, NAME, ALL_GROUP_ID, TEACHERS_GROUP_ID, STUDENTS_GROUP_ID, UGSTUDENTS_GROUP_ID, PGSTUDENTS_GROUP_ID, TIMESTAMP
    INTO uniRow.university_id, uniRow.name, uniRow.all_group_id, uniRow.teachers_group_id, uniRow.students_group_id, uniRow.ugStudents_group_id, uniRow.pgStudents_group_id, uniRow.timestamp;
    return uniRow;
end;
/

