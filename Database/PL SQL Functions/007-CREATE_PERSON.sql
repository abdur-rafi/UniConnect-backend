create or replace FUNCTION CREATE_PERSON(
    fName PERSON.first_name%type,
    lName PERSON.last_name%type,
    house_addr PERSON.HOUSE_ADDRESS%type,
    email_ PERSON.email%type,
    phoneNo PERSON.phone_no%type,
    dateOfBirth PERSON.date_of_birth%type,
    password_ PERSON.password%type,
    district_ PERSON.DISTRICT%TYPE,
    division_ PERSON.DIVISION%TYPE,
    postal_ PERSON.POSTAL_CODE%TYPE
)
return Person%rowtype
AS
    personRow Person%rowtype;
BEGIN
    INSERT INTO Person(first_name, last_name, HOUSE_ADDRESS, email, phone_no, date_of_birth, password, DISTRICT, DIVISION, POSTAL_CODE)
    VALUES
    (fName, lName, house_addr,email_,phoneNo, dateOfBirth,password_, district_, division_, postal_)
    returning
    person_id, first_name, last_name, HOUSE_ADDRESS, email, phone_no, date_of_birth, password, DISTRICT, DIVISION, POSTAL_CODE
    INTO
    personRow.person_id, personRow.first_name, personRow.last_name, personRow.HOUSE_ADDRESS, personRow.email, personRow.phone_no, personRow.date_of_birth,
        personRow.password, personRow.DISTRICT, personRow.DIVISION, personRow.POSTAL_CODE;
    return personRow;
end;
/

