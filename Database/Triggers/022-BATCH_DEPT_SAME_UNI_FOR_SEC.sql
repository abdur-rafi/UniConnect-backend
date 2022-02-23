create or replace trigger BATCH_DEPT_SAME_UNI_FOR_SEC
    before insert
    on SECTION
    for each row
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
/

