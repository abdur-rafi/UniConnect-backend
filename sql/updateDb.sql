CREATE INDEX GROUP_MEMBER_ALL_GROUP_QUERY ON GROUP_MEMBER(ROLE_ID);

create OR REPLACE PROCEDURE GENERATE_SAMPLE_DATA(
    uniName UNIVERSITY.NAME%TYPE
)
IS
    deptCount number := 5;
    type deptNameArrType is varray(5) of varchar2(100);
    type deptCodeType is varray (5) of char(2);
    deptNameArr deptNameArrType := deptNameArrType('Computer Science and Engineering', 'Electric and Electronics Engineering', 'Bio Medical Engineering', 'Mechanical Engineering', 'Civil Engineering');
    deptCodeArr deptCodeType := deptCodeType('01', '02', '03', '04', '05');
    type batchYearArrType is varray(5) of number;
    type batchNameType is varray(5) of varchar2(100);
    batchYear batchYearArrType := batchYearArrType(2015, 2016, 2017, 2018, 2018);
    batchName batchNameType := batchNameType('pounopunik', 'shotoronjo', 'shoteronjo', 'atharo','master');
    type numberArrType is varray (10) of number;
    createdDeptIds numberArrType := numberArrType();
    createdBatchIds numberArrType := numberArrType();
    type sectionNameType is varray (2) of SECTION.SECTION_NAME%TYPE;
    sectionNames sectionNameType := sectionNameType('A', 'B');
    varsityId number;
    dummy number;
    uniRole char(3);

BEGIN
    varsityId := CREATE_UNIVERSITY(uniName).UNIVERSITY_ID;
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
            dummy := CREATE_BATCH_DEPT(createdBatchIds(i), createdDeptIds(j)).DEPARTMENT_ID;
            for k in 1 .. sectionNames.COUNT loop
                dummy := CREATE_SECTION(createdBatchIds(i), createdDeptIds(j),sectionNames(k)).DEPARTMENT_ID;
--                 COMMIT ;
                for l in 1.. 60 loop
                    dummy := CREATE_STUDENT(null,createdBatchIds(i), createdDeptIds(j),dbms_random.string('A', 9),
                        sectionNames(k), l
                        ).ROLE_ID;
                end loop;
            end loop;



        end loop;
    end loop;

end;
/


