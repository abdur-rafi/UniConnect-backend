

-- ALTER TABLE VOTE ADD CONSTRAINT unique_vote PRIMARY KEY(ROLE_ID, CONTENT_ID);

-- CREATE OR REPLACE FUNCTION TOGGLE_VOTE(
--     rId number,
--     cId number,
--     down_ VOTE.DOWN%TYPE
-- )
-- RETURN NUMBER
-- AS
--     exist number;
--     down_in_db VOTE.DOWN%TYPE;
-- BEGIN
--     SELECT COUNT(*) INTO exist FROM GROUP_MEMBER WHERE ROLE_ID = rId AND GROUP_ID = (SELECT GROUP_ID FROM CONTENT WHERE CONTENT_ID = cId);
--     IF exist = 0 THEN
--         RAISE_APPLICATION_ERROR(-20111, 'Role not in group');
--         RETURN 1;
--     end if;
--     SELECT COUNT(*) INTO exist FROM VOTE WHERE ROLE_ID = rId AND CONTENT_ID = cId;
--     IF exist = 0 THEN
--         INSERT INTO VOTE(CONTENT_ID, ROLE_ID, DOWN) VALUES (cId, rId, down_);
--     ELSE
--         SELECT DOWN INTO down_in_db FROM VOTE WHERE ROLE_ID = rId AND CONTENT_ID = cId;
--         if(down_in_db = down_) THEN
--             DELETE FROM VOTE WHERE ROLE_ID = rId AND CONTENT_ID = cId;
--         ELSE
--             UPDATE VOTE SET DOWN = down_ WHERE ROLE_ID = rId AND CONTENT_ID = cId;
--         end if;
--      end if;
--     RETURN 0;
-- end;
-- /

-- CREATE TABLE JOIN_GROUP_REQUEST(
--     REQUEST_ID       NUMBER generated as identity
--         primary key,
--     GROUP_ID NUMBER REFERENCES PGROUP,
--     REQUEST_FROM NUMBER REFERENCES ACADEMIC_ROLE,
--     REQUEST_TO NUMBER REFERENCES ACADEMIC_ROLE,
--     REQUESTED_AT TIMESTAMP DEFAULT SYSDATE,
--     UNIQUE (GROUP_ID, REQUEST_FROM, REQUEST_TO),
--     FOREIGN KEY (GROUP_ID, REQUEST_FROM) references GROUP_MEMBER
-- );
--
-- ALTER TABLE ACADEMIC_ROLE modify person_ID null;

create OR REPLACE FUNCTION CREATE_DEPARTMENT(
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

CREATE OR REPLACE TRIGGER BATCH_DEPT_SAME_UNI
BEFORE INSERT
ON BATCHDEPT
FOR EACH ROW
DECLARE
    deptUni NUmber;
    batchUni Number;
BEGIN
    SELECT UNIVERSITY_ID INTO deptUni FROM DEPARTMENT WHERE DEPARTMENT_ID = :new.DEPARTMENT_ID;
    SELECT UNIVERSITY_ID INTO batchUni FROM BATCH WHERE BATCH_ID = :new.BATCH_ID;
    IF(deptUni != batchUni) THEN
        RAISE_APPLICATION_ERROR(-20001, 'BATCH DEPARTMENT UNIVERSITY MISMATCH');
    end if;

end;

create OR REPLACE FUNCTION CREATE_BATCH_DEPT(
    batchId number,
    departmentId number
)
RETURN BATCHDEPT%rowtype
AS

    groupId number;
    batchDeptRow BATCHDEPT%rowtype;
BEGIN
    INSERT INTO pGroup(Name) VALUES
    ((SELECT Name FROM DEPARTMENT WHERE department_id = departmentId) || '-' || (SELECT YEAR FROM BATCH WHERE batch_id = batchId)) returning group_id INTO groupId ;
    INSERT INTO BATCHDEPT(batch_id, department_id, BATCH_DEPT_GROUP_ID) VALUES (batchId, departmentId, groupId) RETURNING
    batch_id, department_id, BATCH_DEPT_GROUP_ID INTO batchDeptRow.batch_id, batchDeptRow.department_id, batchDeptRow.BATCH_DEPT_GROUP_ID;
    return batchDeptRow;
end;

/


CREATE OR REPLACE TRIGGER BATCH_DEPT_SAME_UNI_FOR_SEC
BEFORE INSERT
ON SECTION
FOR EACH ROW
DECLARE
    deptUni NUmber;
    batchUni Number;
BEGIN
    SELECT UNIVERSITY_ID INTO deptUni FROM DEPARTMENT WHERE DEPARTMENT_ID = :new.DEPARTMENT_ID;
    SELECT UNIVERSITY_ID INTO batchUni FROM BATCH WHERE BATCH_ID = :new.BATCH_ID;
    IF(deptUni != batchUni) THEN
        RAISE_APPLICATION_ERROR(-20001, 'BATCH DEPARTMENT UNIVERSITY MISMATCH');
    end if;

end;

create table VOTE_
(
    CONTENT_ID NUMBER not null
        references CONTENT ON DELETE CASCADE ,
    DOWN       CHAR default 'N',
    ROLE_ID    NUMBER not null
        references ACADEMIC_ROLE ON DELETE CASCADE ,
    constraint UNIQUE_VOTE_
        primary key (ROLE_ID, CONTENT_ID)
);


INSERT INTO VOTE_ SELECT * FROM VOTE;
DROP TABLE VOTE;
ALTER TABLE VOTE_ RENAME TO VOTE;
