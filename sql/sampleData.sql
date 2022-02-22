-- this functin for buet, kuet, ruet
-- BEGIN
--     GENERATE_SAMPLE_DATA('Bangladesh University of Engineering And Technology');
-- end;
--
--  after generating person
-- UPDATE PERSON SET DISTRICT = null WHERE LENGTH(DISTRICT) > 10;

-- the role ids should be different
-- DECLARE
--     d NUMBER;
-- BEGIN
--     d := CREATE_MANAGEMENT(25643, 25,'adm').MANAGEMENT_ID;
--     d := CREATE_MANAGEMENT(25644, 25,'adm').MANAGEMENT_ID;
--     d := CREATE_MANAGEMENT(25645, 25,'adm').MANAGEMENT_ID;
-- end;

UPDATE ACADEMIC_ROLE SET PERSON_ID = NULL WHERE PERSON_ID BETWEEN 25643 AND 25645;

UPDATE ACADEMIC_ROLE SET PERSON_ID = NULL;