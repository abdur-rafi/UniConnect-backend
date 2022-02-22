-- ALTER TABLE PERSON RENAME COLUMN HOME_ADDRESS TO HOUSE_ADDRESS;
-- ALTER TABLE PERSON ADD DISTRICT VARCHAR2(256);
-- ALTER TABLE PERSON ADD DIVISION VARCHAR2(256);
-- ALTER TABLE PERSON ADD POSTAL_CODE VARCHAR2(16);


-- create OR REPLACE FUNCTION CREATE_PERSON(
--     fName PERSON.first_name%type,
--     lName PERSON.last_name%type,
--     house_addr PERSON.HOUSE_ADDRESS%type,
--     email_ PERSON.email%type,
--     phoneNo PERSON.phone_no%type,
--     dateOfBirth PERSON.date_of_birth%type,
--     password_ PERSON.password%type,
--     district_ PERSON.DISTRICT%TYPE,
--     division_ PERSON.DIVISION%TYPE,
--     postal_ PERSON.POSTAL_CODE%TYPE
-- )
-- return Person%rowtype
-- AS
--     personRow Person%rowtype;
-- BEGIN
--     INSERT INTO Person(first_name, last_name, HOUSE_ADDRESS, email, phone_no, date_of_birth, password, DISTRICT, DIVISION, POSTAL_CODE)
--     VALUES
--     (fName, lName, house_addr,email_,phoneNo, dateOfBirth,password_, district_, division_, postal_)
--     returning
--     person_id, first_name, last_name, HOUSE_ADDRESS, email, phone_no, date_of_birth, password, DISTRICT, DIVISION, POSTAL_CODE
--     INTO
--     personRow.person_id, personRow.first_name, personRow.last_name, personRow.HOUSE_ADDRESS, personRow.email, personRow.phone_no, personRow.date_of_birth,
--         personRow.password, personRow.DISTRICT, personRow.DIVISION, personRow.POSTAL_CODE;
--     return personRow;
-- end;
-- /


-- ALTER TABLE ACADEMIC_ROLE ADD CONSTRAINT MINIMUM_TOKEN_LENGTH CHECK ( LENGTH(TOKEN) >= 8 );
-- ALTER TABLE BATCH ADD CONSTRAINT  MINIMUM_BATCH_NAME_LENGTH CHECK((LENGTH(NAME) >= 3));

CREATE OR REPLACE TRIGGER CHECK_DATE
BEFORE INSERT ON
    BATCH
    FOR EACH ROW
DECLARE
BEGIN
    IF (:new.YEAR <= (TO_NUMBER(TO_CHAR(SYSDATE, 'yyyy')) + 2) AND :new.YEAR >= (TO_NUMBER(TO_CHAR(SYSDATE, 'yyyy')) - 10) AND MOD(:new.YEAR, 1) = 0) = FALSE THEN
        RAISE_APPLICATION_ERROR(-20999, 'invalid date');
    end if;
end;



ALTER TABLE DEPARTMENT ADD CONSTRAINT  MINIMUM_DEPARTMENT_NAME_LENGTH CHECK((LENGTH(NAME) >= 3));

ALTER TABLE PERSON ADD CONSTRAINT  MINIMUM_FIRST_NAME_LENGTH CHECK((LENGTH(FIRST_NAME) >= 2));

CREATE OR REPLACE TRIGGER CHECK_DATE_OF_BIRTH
BEFORE INSERT ON
    PERSON
    FOR EACH ROW
DECLARE
BEGIN
    IF (:new.DATE_OF_BIRTH <= ADD_MONTHS(SYSDATE, - 120) AND :new.DATE_OF_BIRTH >= (ADD_MONTHS(SYSDATE, -1300))) = FALSE THEN
        RAISE_APPLICATION_ERROR(-20999, 'invalid date');
    end if;
end;

ALTER TABLE PERSON ADD CONSTRAINT CHECK_DISTRICT_LENGTH CHECK ( LENGTH(DISTRICT) >= 2 );
ALTER TABLE PERSON ADD CONSTRAINT CHECK_DIVISION_LENGTH CHECK ( LENGTH(DISTRICT) >= 2 );

ALTER TABLE PGROUP ADD CONSTRAINT GROUP_NAME_MIN_LENGTH CHECK ( LENGTH(NAME) >= 3 );

ALTER TABLE UNIVERSITY ADD CONSTRAINT UNI_NAME_MIN_LENGTH CHECK ( LENGTH(NAME) >= 3 );

ALTER TABLE VOTE ADD CONSTRAINT CONSTRAINT_DOWN_VAL CHECK ( DOWN = 'Y' OR DOWN = 'N' );

SELECT ADD_MONTHS(SYSDATE, -1300) FROM DUAL;

