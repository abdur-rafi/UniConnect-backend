
CREATE TABLE ROLE(
    role char(3),
    primary key (role)
);

INSERT INTO ROLE VALUES ('adm');
INSERT INTO ROLE VALUES ('mod');
INSERT INTO ROLE VALUES ('mem');

CREATE TABLE sTYPE(
    type char(2),
    primary key (type)
);

INSERT INTO sType VALUES ('ug');
INSERT INTO sType VALUES ('pg');

Create TABLE pGroup(
    group_id number generated by default as identity primary key ,
    name varchar2(256),
    timestamp timestamp default sysdate not null

);


CREATE TABLE University(
    university_id number GENERATED BY DEFAULT AS IDENTITY primary key ,
    name varchar2(512) not null ,
    timestamp timestamp default sysdate not null,
    all_group_id number not null references pGroup,
    teachers_group_id number not null references pGroup,
    students_group_id number not null references pGroup,
    ugStudents_group_id number not null references pGroup,
    pgStudents_group_id number not null references pGroup
);

CREATE TABLE Department(
    department_id number GENERATED BY DEFAULT AS IDENTITY primary key ,
    name varchar2(512) not null,
    timestamp timestamp default sysdate not null,
    university_id number not null references UNIVERSITY on delete CASCADE ,
    dept_code char(2) not null unique ,
    all_group_id number not null references pGroup,
    students_group_id number not null references pGroup,
    teachers_group_id number not null references pGroup,
    ugStudents_group_id number not null references pGroup,
    pgStudents_group_id number not null references pGroup,

    CONSTRAINT uniqueName UNIQUE (university_id, name)

);


CREATE TABLE Batch(
    batch_id number generated by default as identity  primary key ,
    name varchar2(256),
    university_id number not null ,
    FOREIGN KEY (university_id) references University on delete CASCADE,
    group_id number not null ,
    foreign key (group_id) references pGroup on delete CASCADE,
    year number not null,
    batchOfsType char(2),
    constraint ugOrPg foreign key (batchOfsType) references sTYPE ,
    constraint uniqueBatchYear unique (university_id,batchOfsType, year)

);


CREATE TABLE BatchDept(
    batch_id number not null ,
    department_id number not null ,
    foreign key (batch_id) references BATCH(batch_id) on delete CASCADE,
    foreign key (department_id) references Department(department_id) on delete CASCADE,
    CONSTRAINT pair_key_bd PRIMARY KEY (batch_id, department_id),
    group_id number not null ,
    foreign key (group_id) references pGroup on delete CASCADE
);

CREATE TABLE  Section(
    batch_id number not null ,
    department_id number not null ,
    section_name char(1),
    constraint triplet primary key (section_name, batch_id, department_id),
    foreign key (batch_id, department_id) references BatchDept on delete CASCADE,
    group_id number not null ,
    foreign key (group_id) references pGroup on delete CASCADE
);


CREATE TABLE Person(
    person_id number GENERATED BY DEFAULT AS IDENTITY primary key ,
    first_name VARCHAR2(256) ,
    last_name VARCHAR2(256)  ,
    address VARCHAR2(1024)  ,
    email VARCHAR2(512) unique not null ,
    phone_no CHAR(11) unique ,
    date_of_birth Date ,
    password VARCHAR2(256) not null,
    university_id number not null references UNIVERSITY on delete cascade ,
    uni_group_role char(3) references ROLE,
    timestamp Timestamp default sysdate not null
);

CREATE TABLE Teacher(
    teacher_id number GENERATED BY DEFAULT AS IDENTITY primary key ,
    person_id number not null unique,
    rank varchar2(128) not null ,
    timestamp timestamp default sysdate not null,
    department_id number not null references Department on delete cascade ,
    dept_group_role char(3) references ROLE,
    uni_teacher_group_role char(3) references ROLE
);

CREATE TABLE Student(
     student_id number generated by default as identity primary key ,
     person_id number not null ,
     batch_id number not null,
     department_id number not null ,
     section_name char(1),
     section_roll_no number,
     dept_all_role char(3) references ROLE,
     dept_all_students_role char(3) references ROLE,
     dept_sType_group_role char(3) references ROLE,
     batch_group_role char(3) references ROLE,
     dept_batch_group_role char(3) references ROLE,
     section_group_role char(3) references ROLE,
     uni_all_students_group_role CHAR(3) references ROLE,
     uni_sType_group_role char(3) references ROLE,
     FOREIGN KEY (section_name, batch_id, department_id) references Section(section_name, batch_id, department_id),
     constraint uniqueRole UNIQUE (section_name, batch_id, department_id, section_roll_no)
);

CREATE TABLE MANAGEMENT(
    management_id number generated by default as identity primary key ,
    person_id number not null references Person,
    university_id number not null references UNIVERSITY,
    timestamp Timestamp default sysdate not null,
    uni_management_role char(3) references ROLE
);


CREATE TABLE Group_Member(
    person_id number not null ,
    group_id number not null ,
    timestamp timestamp default sysdate not null ,
    type char(3),
    group_role char(3),
    FOREIGN KEY (person_id) references Person(person_id) on delete CASCADE,
    FOREIGN KEY (group_id) references pGroup(group_id) on delete CASCADE,
    FOREIGN KEY (group_role) references ROLE,
    constraint pair_key PRIMARY KEY (person_id, group_id)

);


CREATE TABLE Post(
    post_id number generated by default as identity primary key ,
    title VARCHAR2(512) not null ,
    content CLOB not null ,
    time timestamp default sysdate not null,
    group_id number not null ,
    person_id number not null ,
    FOREIGN KEY (group_id) REFERENCES pGroup(group_id) on delete CASCADE,
    FOREIGN KEY (person_id) references PERSON(person_id) on delete CASCADE
);

CREATE TABLE postComment(
    comment_id number generated by default as identity primary key ,
    content clob not null ,
    person_id number not null ,
    post_id number not null ,
    FOREIGN KEY (person_id) references Person(person_id) on delete CASCADE,
    FOREIGN KEY (post_id) references Post(post_id) on delete CASCADE
);
CREATE Table Vote(
    vote_id number generated by default  as identity primary key ,
    person_id number not null ,
    post_id number not null ,
    timestamp timestamp default sysdate not null ,
    FOREIGN KEY (person_id) references Person(person_id) on delete CASCADE,
    foreign key (post_id) references Post(post_id) on delete CASCADE,
    CONSTRAINT one_vote_to_one_post UNIQUE (person_id, post_id)
);


-- (SELECT 'DROP TABLE ' || table_name || ';' FROM user_tables);

-- DROP TABLE VOTE;
-- DROP TABLE POSTCOMMENT;
-- DROP TABLE GROUP_MEMBER;
-- DROP TABLE Post;
-- DROP TABLE Student;
-- DROP TABLE Teacher;
-- drop table MANAGEMENT;
-- DROP TABLE Section;
-- DROP TABLE BatchDept;
-- DROP TABLE Batch;
-- DROP TABLE Department;
-- DROP TABLE PERSON;
-- DROP TABLE UNIVERSITY;
-- DROP TABLE pGroup;
-- DROP TABLE ROLE;
-- DROP TABLE sTYPE;

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
    password_ PERSON.password%type,
    uniId PERSON.university_id%type,
    uniGroupRole PERSON.UNI_GROUP_ROLE%type
)
return Person%rowtype
AS
    personRow Person%rowtype;
BEGIN
    INSERT INTO Person(first_name, last_name, address, email, phone_no, date_of_birth, password, university_id, uni_group_role)
    VALUES
    (fName, lName, address_,email_,phoneNo, dateOfBirth,password_,uniId, uniGroupRole)
    returning
    person_id, first_name, last_name, address, email, phone_no, date_of_birth, password, university_id, uni_group_role
    INTO
    personRow.person_id, personRow.first_name, personRow.last_name, personRow.address, personRow.email, personRow.phone_no, personRow.date_of_birth,
        personRow.password, personRow.university_id, personRow.uni_group_role;
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


CREATE OR REPLACE FUNCTION CREATE_STUDENT(
    personId number,
    batchId number,
    departmentId number,
    sectionName STUDENT.section_name%TYPE,
    sectionRolNo STUDENT.section_roll_no%TYPE,
    deptAllRole STUDENT.dept_all_role%TYPE,
    deptAllStudentsRole STUDENT.dept_all_students_role%TYPE,
    deptSTypeGroupRole STUDENT.dept_sType_group_role%TYPE,
    batchGroupRole STUDENT.batch_group_role%TYPE,
    deptBatchGroupRole STUDENT.dept_batch_group_role%TYPE,
    sectionGroupRole STUDENT.section_group_role%TYPE,
    uniAllStdGroupRole STUDENT.uni_all_students_group_role%TYPE,
    unisTypeGroupRole STUDENT.uni_sType_group_role%TYPE

)
RETURN STUDENT%rowtype
AS
    studentRow STUDENT%rowtype;
BEGIN
    INSERT INTO STUDENT(person_id, batch_id, department_id, section_name, section_roll_no, dept_all_role,
                        dept_all_students_role, dept_sType_group_role, batch_group_role, dept_batch_group_role, section_group_role,
                        uni_all_students_group_role, uni_sType_group_role)
    VALUES
    (personId, batchId, departmentId, sectionName, sectionRolNo, deptAllRole, deptAllStudentsRole, deptSTypeGroupRole, batchGroupRole, deptBatchGroupRole,sectionGroupRole,
    uniAllStdGroupRole, unisTypeGroupRole) returning
    student_id, person_id, batch_id, department_id, section_name, section_roll_no, dept_all_role,
    dept_all_students_role, dept_sType_group_role, batch_group_role, dept_batch_group_role, section_group_role,
    uni_all_students_group_role, uni_sType_group_role
    INTO
    studentRow.student_id, studentRow.person_id, studentRow.batch_id, studentRow.department_id, studentRow.section_name, studentRow.section_roll_no, studentRow.dept_all_role,
    studentRow.dept_all_students_role, studentRow.dept_sType_group_role, studentRow.batch_group_role, studentRow.dept_batch_group_role, studentRow.section_group_role,
    studentRow.uni_all_students_group_role, studentRow.uni_sType_group_role;
    return studentRow;

end;


CREATE OR REPLACE FUNCTION CREATE_TEACHER(
    personId number,
    rank_ TEACHER.RANK%TYPE,
    departmentId number,
    deptGroupRole TEACHER.DEPT_GROUP_ROLE%TYPE,
    uniTeacherGroupRole TEACHER.uni_teacher_group_role%TYPE
)
RETURN TEACHER%rowtype
AS
    teacherRow TEACHER%rowtype;
BEGIN
    INSERT INTO TEACHER(person_id, rank, department_id, dept_group_role, uni_teacher_group_role)
    VALUES (personId, rank_, departmentId, deptGroupRole, uniTeacherGroupRole)
    RETURNING teacher_id, person_id, rank, department_id, dept_group_role, uni_teacher_group_role
    INTO
    teacherRow.teacher_id, teacherRow.person_id, teacherRow.rank, teacherRow.department_id, teacherRow.dept_group_role, teacherRow.uni_teacher_group_role;
    return teacherRow;

end;
