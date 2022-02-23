create or replace trigger CHECK_DATE_OF_BIRTH
    before insert
    on PERSON
    for each row
DECLARE
BEGIN
    IF (:new.DATE_OF_BIRTH <= ADD_MONTHS(SYSDATE, - 120) AND :new.DATE_OF_BIRTH >= (ADD_MONTHS(SYSDATE, -1300))) = FALSE THEN
        RAISE_APPLICATION_ERROR(-20999, 'invalid date');
    end if;
end;
/

