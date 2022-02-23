create or replace FUNCTION CREATE_BATCH_DEPT(
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

