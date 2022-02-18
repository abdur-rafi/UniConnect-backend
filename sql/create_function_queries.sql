
CREATE OR REPLACE FUNCTION CREATE_GROUP(
    grName PGROUP.name%TYPE
)
return pGroup%rowtype
AS
    row PGROUP%rowtype;
BEGIN
    INSERT INTO PGROUP(NAME) VALUES (grName) returning group_id, name, timestamp INTO row.group_id, row.name, row.timestamp;
    return row;
end;

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

CREATE OR REPLACE FUNCTION CREATE_DEPARTMENT(
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
    DEPARTMENT_ID, NAME, UNIVERSITY_ID, ALL_GROUP_ID, STUDENTS_GROUP_ID, TEACHERS_GROUP_ID, UGSTUDENTS_GROUP_ID, PGSTUDENTS_GROUP_ID INTO
    newRow.department_id, newRow.name, newRow.university_id, newRow.all_group_id, newRow.students_group_id, newRow.teachers_group_id, newRow.ugStudents_group_id, newRow.pgStudents_group_id;
    return newRow;
end;


CREATE OR REPLACE FUNCTION CREATE_BATCH(
    batchName BATCH.name%TYPE,
    universityId number,
    batchYear number,
    sType BATCH.BATCHOFSTYPE%TYPE
)
return BATCH%rowtype
As
    groupId number;
    batchRow BATCH%rowtype;
BEGIN
    INSERT INTO PGROUP(Name) VALUES (batchName) RETURNING group_id INTO groupId;
    INSERT INTO Batch(NAME, UNIVERSITY_ID, GROUP_ID, YEAR,BATCHOFSTYPE) VALUES (batchName, universityId, groupId, batchYear, sType)
    returning BATCH_ID, NAME, UNIVERSITY_ID, GROUP_ID, YEAR, batchOfsType
    INTO  batchRow.batch_id, batchRow.name, batchRow.university_id, batchRow.group_id, batchRow.year, batchRow.batchOfsType;
    return batchRow;
end;


CREATE OR REPLACE FUNCTION CREATE_BATCH_DEPT(
    batchId number,
    departmentId number
)
RETURN BATCHDEPT%rowtype
AS

    groupId number;
    batchDeptRow BATCHDEPT%rowtype;
    buId number;
    duId number;
BEGIN
    SELECT university_id INTO buId FROM Batch WHERE batch_id = batchId;
    SELECT university_id INTO duId FROM Department WHERE department_id = departmentId;
    IF buId != duId THEN
        raise_application_error(-1000, 'BATCH AND DEPARTMENT NOT IN SAME UNIVERSITY');
    end if;
    INSERT INTO pGroup(Name) VALUES
    ((SELECT Name FROM DEPARTMENT WHERE department_id = departmentId) || '-' || (SELECT YEAR FROM BATCH WHERE batch_id = batchId)) returning group_id INTO groupId ;
    INSERT INTO BATCHDEPT(batch_id, department_id, group_id) VALUES (batchId, departmentId, groupId) RETURNING
    batch_id, department_id, group_id INTO batchDeptRow.batch_id, batchDeptRow.department_id, batchDeptRow.group_id;
    return batchDeptRow;
end;

CREATE OR REPLACE FUNCTION CREATE_SECTION(
    batchId number,
    departmentId number,
    sectionName SECTION.section_name%TYPE
)
RETURN SECTION%rowtype

AS
    sectionRow SECTION%rowtype;
    groupId number;
BEGIN
    INSERT INTO PGROUP(NAME) VALUES ((
        (SELECT NAME FROM DEPARTMENT WHERE department_id = departmentId) || '-' || (SELECT YEAR FROM BATCH WHERE batch_id = batchId) || '-' || sectionName )
        )
    RETURNING group_id INTO groupId;
    INSERT INTO SECTION(batch_id, department_id, section_name, group_id) VALUES (batchId, departmentId, sectionName, groupId)
    RETURNING batch_id, department_id, section_name, group_id INTO sectionRow.batch_id, sectionRow.department_id, sectionRow.section_name, sectionRow.group_id;
    return sectionRow;
end;

CREATE OR REPLACE FUNCTION CREATE_PERSON(
    fName PERSON.first_name%type,
    lName PERSON.last_name%type,
    address_ PERSON.address%type,
    email_ PERSON.email%type,
    phoneNo PERSON.phone_no%type,
    dateOfBirth PERSON.date_of_birth%type,
    password_ PERSON.password%type
)
return Person%rowtype
AS
    personRow Person%rowtype;
BEGIN
    INSERT INTO Person(first_name, last_name, address, email, phone_no, date_of_birth, password)
    VALUES
    (fName, lName, address_,email_,phoneNo, dateOfBirth,password_)
    returning
    person_id, first_name, last_name, address, email, phone_no, date_of_birth, password
    INTO
    personRow.person_id, personRow.first_name, personRow.last_name, personRow.address, personRow.email, personRow.phone_no, personRow.date_of_birth,
        personRow.password;
    return personRow;
end;

CREATE OR REPLACE FUNCTION CREATE_MANAGEMENT(
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

CREATE OR REPLACE FUNCTION CREATE_ACADEMIC_ROLE(
    personId number,
    generatedPass ACADEMIC_ROLE.GENERATED_PASS%TYPE,
    password_ ACADEMIC_ROLE.PASSWORD%TYPE,
    uniAllGroupRole ACADEMIC_ROLE. UNI_ALL_GROUP_ROLE%TYPE,
    uniSelfGroupRole ACADEMIC_ROLE.UNI_SELF_GROUP_ROLE%TYPE,
    deptAllGroupRole ACADEMIC_ROLE.DEPT_ALL_GROUP_ROLE%TYPE,
    deptSelfGroupRole ACADEMIC_ROLE.DEPT_SELF_GROUP_ROLE%TYPE
)
RETURN ACADEMIC_ROLE%rowtype
AS
    academicRole ACADEMIC_ROLE%rowtype;
BEGIN
    INSERT INTO
        ACADEMIC_ROLE(person_id, generated_pass, PASSWORD, uni_all_group_role, uni_self_group_role, dept_all_group_role, dept_self_group_role)
    VALUES (personId, generatedPass, password_, uniAllGroupRole, uniSelfGroupRole, deptAllGroupRole, deptSelfGroupRole)
    RETURNING ROLE_ID, person_id, generated_pass, TIMESTAMP,uni_all_group_role, uni_self_group_role, dept_all_group_role, dept_self_group_role
    INTO
    academicRole.ROLE_ID, academicRole.person_id,
        academicRole.generated_pass, academicRole.TIMESTAMP,academicRole.uni_all_group_role,
        academicRole.uni_self_group_role, academicRole.dept_all_group_role, academicRole.dept_self_group_role;
    return academicRole;
end;


CREATE OR REPLACE FUNCTION CREATE_STUDENT(
    personId number,
    batchId number,
    departmentId number,
    generatedPass ACADEMIC_ROLE.generated_pass%TYPE,
    password_ ACADEMIC_ROLE.GENERATED_PASS%TYPE,
    sectionName STUDENT.section_name%TYPE,
    sectionRolNo STUDENT.section_roll_no%TYPE,
    uniGroupRole ACADEMIC_ROLE.uni_all_group_role%TYPE,
    deptAllRole ACADEMIC_ROLE.DEPT_ALL_GROUP_ROLE%TYPE,
    deptAllStudentsRole STUDENT.dept_all_students_role%TYPE,
    deptSTypeGroupRole ACADEMIC_ROLE.DEPT_SELF_GROUP_ROLE%TYPE,
    batchGroupRole STUDENT.batch_group_role%TYPE,
    deptBatchGroupRole STUDENT.dept_batch_group_role%TYPE,
    sectionGroupRole STUDENT.section_group_role%TYPE,
    uniAllStdGroupRole STUDENT.uni_all_students_group_role%TYPE,
    unisTypeGroupRole ACADEMIC_ROLE.UNI_SELF_GROUP_ROLE%TYPE

)
RETURN STUDENT%rowtype
AS
    studentRow STUDENT%rowtype;
    academicRoleRow ACADEMIC_ROLE%rowtype;
BEGIN
    academicRoleRow := CREATE_ACADEMIC_ROLE(personId,generatedPass,password_, uniGroupRole,unisTypeGroupRole,deptAllRole,deptSTypeGroupRole);
    INSERT INTO STUDENT(ROLE_ID, BATCH_ID, DEPARTMENT_ID, SECTION_NAME, SECTION_ROLL_NO, DEPT_ALL_STUDENTS_ROLE, BATCH_GROUP_ROLE, DEPT_BATCH_GROUP_ROLE,
                        SECTION_GROUP_ROLE, UNI_ALL_STUDENTS_GROUP_ROLE)
    VALUES
    (academicRoleRow.ROLE_ID, batchId, departmentId, sectionName, sectionRolNo, deptAllStudentsRole, batchGroupRole, deptBatchGroupRole,sectionGroupRole,
    uniAllStdGroupRole) returning
    role_id, batch_id, department_id, section_name, section_roll_no,
    dept_all_students_role,batch_group_role, dept_batch_group_role, section_group_role,
    uni_all_students_group_role
    INTO
    studentRow.ROLE_ID, studentRow.batch_id, studentRow.department_id, studentRow.section_name ,studentRow.section_roll_no,
    studentRow.dept_all_students_role, studentRow.batch_group_role, studentRow.dept_batch_group_role, studentRow.section_group_role,
    studentRow.uni_all_students_group_role;
    return studentRow;
end;


CREATE OR REPLACE FUNCTION CREATE_TEACHER(
    personId number,
    generatedPass ACADEMIC_ROLE.GENERATED_PASS%TYPE,
    password_ ACADEMIC_ROLE.PASSWORD%TYPE,
    rank_ TEACHER.RANK%TYPE,
    departmentId number,
    uniGroupRole ACADEMIC_ROLE.UNI_ALL_GROUP_ROLE%TYPE,
    uniTeacherGroupRole ACADEMIC_ROLE.UNI_SELF_GROUP_ROLE%TYPE,
    deptAllGroupRole ACADEMIC_ROLE.DEPT_ALL_GROUP_ROLE%TYPE,
    deptTeacherGroupRole ACADEMIC_ROLE.DEPT_SELF_GROUP_ROLE%TYPE
)
RETURN TEACHER%rowtype
AS
    teacherRow TEACHER%rowtype;
    academicRoleRow ACADEMIC_ROLE%rowtype;
BEGIN
    academicRoleRow := CREATE_ACADEMIC_ROLE(personId, generatedPass,password_,uniGroupRole,
        uniTeacherGroupRole, deptAllGroupRole,deptTeacherGroupRole);

    INSERT INTO TEACHER(ROLE_ID, rank, department_id)
    VALUES (academicRoleRow.ROLE_ID, rank_, departmentId)
    RETURNING ROLE_ID, rank, department_id
    INTO
    teacherRow.ROLE_ID, teacherRow.rank, teacherRow.department_id;
    return teacherRow;
end;


CREATE OR REPLACE FUNCTION CREATE_CONTENT(
    text_ CONTENT.TEXT%TYPE,
    roleId number
)
RETURN CONTENT%rowtype
IS
    contentRow CONTENT%rowtype;
BEGIN
    INSERT INTO CONTENT(TEXT, ROLE_ID) VALUES (text_, roleId)
    RETURNING CONTENT_ID,TEXT,POSTED_AT,ROLE_ID
    INTO
    contentRow.CONTENT_ID,contentRow.TEXT,contentRow.POSTED_AT,contentRow.ROLE_ID;
    return contentRow;
end;


CREATE OR REPLACE FUNCTION CREATE_POST(
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
    contentRow := CREATE_CONTENT(text_, roleId);
    INSERT INTO POST(content_id, title, group_id) VALUES (contentRow.CONTENT_ID,title_, groupId)
    RETURNING CONTENT_ID, TITLE, GROUP_ID
    INTO
        postRow.CONTENT_ID, postRow.TITLE, postRow.GROUP_ID;
    return postRow;
end;

CREATE OR REPLACE FUNCTION CREATE_COMMENT(
    text_ CONTENT.TEXT%TYPE,
    roleId number,
    commentOf number
)
return COMMENT_%rowtype
IS
    contentRow CONTENT%rowtype;
    commentRow COMMENT_%rowtype;
BEGIN
    contentRow := CREATE_CONTENT(text_, roleId);
    INSERT INTO COMMENT_(CONTENT_ID, COMMENT_OF) VALUES (contentRow.CONTENT_ID, commentOf)
    RETURNING CONTENT_ID, COMMENT_OF
    INTO
        commentRow.CONTENT_ID, commentRow.COMMENT_OF;
    return commentRow;
end;

BEGIN
    GENERATE_SAMPLE_DATA(5);
end;
