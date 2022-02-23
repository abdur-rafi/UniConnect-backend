create or replace FUNCTION CREATE_BATCH_DEPT_FOR_SAMPLE(
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
    INSERT INTO BATCHDEPT(batch_id, department_id, BATCH_DEPT_GROUP_ID) VALUES (batchId, departmentId, groupId) RETURNING
    batch_id, department_id, BATCH_DEPT_GROUP_ID INTO batchDeptRow.batch_id, batchDeptRow.department_id, batchDeptRow.BATCH_DEPT_GROUP_ID;
    return batchDeptRow;
end;
/

