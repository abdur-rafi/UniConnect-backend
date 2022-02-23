create or replace FUNCTION CREATE_SECTION(
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
    INSERT INTO SECTION(batch_id, department_id, section_name, SECTION_GROUP_ID) VALUES (batchId, departmentId, sectionName, groupId)
    RETURNING batch_id, department_id, section_name, SECTION_GROUP_ID INTO sectionRow.batch_id, sectionRow.department_id, sectionRow.section_name, sectionRow.SECTION_GROUP_ID;
    return sectionRow;
end;
/

