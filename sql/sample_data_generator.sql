CREATE OR REPLACE PROCEDURE GENERATE_SAMPLE_DATA(
    d Number
)
IS
    deptCount number := 5;
    type deptNameArrType is varray(5) of varchar2(100);
    type deptCodeType is varray (5) of char(2);
    deptNameArr deptNameArrType := deptNameArrType('Computer Science and Engineering', 'Electric and Electronics Engineering', 'Bio Medical Engineering', 'Mechanical Engineering', 'Civil Engineering');
    deptCodeArr deptCodeType := deptCodeType('01', '02', '03', '04', '05');
    type batchYearArrType is varray(4) of number;
    type batchNameType is varray(4) of varchar2(100);
    batchYear batchYearArrType := batchYearArrType(2015, 2016, 2017, 2017);
    batchName batchNameType := batchNameType('pounopunik', 'shotoronjo', 'sotero', 'master');
    type numberArrType is varray (10) of number;
    createdDeptIds numberArrType := numberArrType();
    createdBatchIds numberArrType := numberArrType();
    type sectionNameType is varray (2) of SECTION.SECTION_NAME%TYPE;
    sectionNames sectionNameType := sectionNameType('A', 'B');
    varsityId number;
    dummy number;
    uniRole char(3);

BEGIN
    varsityId := CREATE_UNIVERSITY('Bangladesh University Of Engineering And Technology').UNIVERSITY_ID;
    for i in 1..deptNameArr.COUNT Loop
        createdDeptIds.extend();
        createdDeptIds(i) := CREATE_DEPARTMENT(varsityId, deptNameArr(i),deptCodeArr(i)).DEPARTMENT_ID;
    end loop;
    for i in 1.. batchName.COUNT - 1 loop
        createdBatchIds.extend();
        createdBatchIds(i) := CREATE_BATCH(batchName(i),varsityId,batchYear(i),'ug').BATCH_ID;
    end loop;
    createdBatchIds.extend();
    createdBatchIds(batchName.COUNT) := CREATE_BATCH(batchName(batchName.COUNT),varsityId,batchYear(batchYear.COUNT),'pg').BATCH_ID;
    for i in 1 .. createdBatchIds.COUNT loop
        for j in 1 .. createdDeptIds.COUNT loop
            dummy := CREATE_BATCH_DEPT_FOR_SAMPLE(createdBatchIds(i), createdDeptIds(j),batchName(i), deptNameArr(j)).DEPARTMENT_ID;
            for k in 1 .. sectionNames.COUNT loop
                dummy := CREATE_SECTION(createdBatchIds(i), createdDeptIds(j),sectionNames(k)).DEPARTMENT_ID;
--                 for l in 1.. 60 loop
--                     if l < 3 THEN
--                         uniRole := 'adm';
--                     ELSIF l < 6 THEN
--                         uniRole := 'mod';
--                     ELSE
--                         uniRole := 'mem';
--                     end if;
--
--                     dummy := CREATE_PERSON(null, null, null,null, null, null,'password' || j,varsityId,uniRole).PERSON_ID;
--                     dummy := CREATE_STUDENT(dummy,createdBatchIds(i), createdDeptIds(j),sectionNames(k),
--                         l,uniRole, uniRole, uniRole, uniRole,uniRole,
--                         uniRole, uniRole, uniRole).PERSON_ID;
--                 end loop;
            end loop;



        end loop;
    end loop;

end;


CREATE OR REPLACE FUNCTION CREATE_BATCH_DEPT_FOR_SAMPLE(
    batchId number,
    departmentId number,
    batchName BATCH.name%TYPE,
    deptName DEPARTMENT.name%TYPE
)
RETURN BATCHDEPT%rowtype
AS

    groupId number;
    batchDeptRow BATCHDEPT%rowtype;
BEGIN
    INSERT INTO pGroup(Name) VALUES
    (deptName || '-' || batchName) returning group_id INTO groupId ;
    INSERT INTO BATCHDEPT(batch_id, department_id, group_id) VALUES (batchId, departmentId, groupId) RETURNING
    batch_id, department_id, group_id INTO batchDeptRow.batch_id, batchDeptRow.department_id, batchDeptRow.group_id;
    return batchDeptRow;
end;
