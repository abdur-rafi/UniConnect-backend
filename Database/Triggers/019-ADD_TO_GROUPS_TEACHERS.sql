create or replace trigger ADD_TO_GROUPS_TEACHERS
    after insert
    on TEACHER
    for each row
DECLARE
    UAGI NUMBER;
    UTGI NUMBER;
    DAGI NUMBER;
    DTGI NUMBER;
    roleId Number;
BEGIN
    roleId := :new.ROLE_ID;
    SELECT U.ALL_GROUP_ID, U.TEACHERS_GROUP_ID, D.ALL_GROUP_ID, D.TEACHERS_GROUP_ID
    INTO UAGI, UTGI, DAGI, DTGI
    FROM DEPARTMENT D JOIN UNIVERSITY U ON D.UNIVERSITY_ID = U.UNIVERSITY_ID WHERE D.DEPARTMENT_ID = :new.DEPARTMENT_ID;
    INSERT ALL
        INTO GROUP_MEMBER(GROUP_ID, ROLE_ID, MEMBER_ROLE) VALUES (UAGI,roleId, 'mem')
        INTO GROUP_MEMBER(GROUP_ID, ROLE_ID, MEMBER_ROLE) VALUES (UTGI,roleId, 'mem')
        INTO GROUP_MEMBER(GROUP_ID, ROLE_ID, MEMBER_ROLE) VALUES (DAGI,roleId, 'mem')
        INTO GROUP_MEMBER(GROUP_ID, ROLE_ID, MEMBER_ROLE) VALUES (DTGI,roleId, 'mem')
    SELECT 1 FROM DUAL;

end;
/

