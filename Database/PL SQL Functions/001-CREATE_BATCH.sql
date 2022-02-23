create or replace FUNCTION CREATE_BATCH(
    batchName BATCH.name%TYPE,
    universityId number,
    batchYear number,
    sType BATCH.BATCH_TYPE%TYPE
)
return BATCH%rowtype
As
    groupId number;
    batchRow BATCH%rowtype;
BEGIN
    INSERT INTO PGROUP(Name) VALUES (batchName) RETURNING group_id INTO groupId;
    INSERT INTO Batch(NAME, UNIVERSITY_ID, BATCH_GROUP_ID, YEAR,BATCH_TYPE) VALUES (batchName, universityId, groupId, batchYear, sType)
    returning BATCH_ID, NAME, UNIVERSITY_ID, BATCH_GROUP_ID, YEAR, BATCH_TYPE
    INTO  batchRow.batch_id, batchRow.name, batchRow.university_id, batchRow.BATCH_group_id, batchRow.year, batchRow.BATCH_TYPE;
    return batchRow;
end;
/

