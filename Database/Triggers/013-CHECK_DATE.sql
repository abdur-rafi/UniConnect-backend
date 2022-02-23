create or replace trigger CHECK_DATE
    before insert
    on BATCH
    for each row
DECLARE
BEGIN
    IF (:new.YEAR <= (TO_NUMBER(TO_CHAR(SYSDATE, 'yyyy')) + 2) AND :new.YEAR >= (TO_NUMBER(TO_CHAR(SYSDATE, 'yyyy')) - 10) AND MOD(:new.YEAR, 1) = 0) = FALSE THEN
        RAISE_APPLICATION_ERROR(-20999, 'invalid date');
    end if;
end;
/

