

-- ALTER TABLE VOTE ADD CONSTRAINT unique_vote PRIMARY KEY(ROLE_ID, CONTENT_ID);

-- CREATE OR REPLACE FUNCTION TOGGLE_VOTE(
--     rId number,
--     cId number,
--     down_ VOTE.DOWN%TYPE
-- )
-- RETURN NUMBER
-- AS
--     exist number;
--     down_in_db VOTE.DOWN%TYPE;
-- BEGIN
--     SELECT COUNT(*) INTO exist FROM GROUP_MEMBER WHERE ROLE_ID = rId AND GROUP_ID = (SELECT GROUP_ID FROM CONTENT WHERE CONTENT_ID = cId);
--     IF exist = 0 THEN
--         RAISE_APPLICATION_ERROR(-20111, 'Role not in group');
--         RETURN 1;
--     end if;
--     SELECT COUNT(*) INTO exist FROM VOTE WHERE ROLE_ID = rId AND CONTENT_ID = cId;
--     IF exist = 0 THEN
--         INSERT INTO VOTE(CONTENT_ID, ROLE_ID, DOWN) VALUES (cId, rId, down_);
--     ELSE
--         SELECT DOWN INTO down_in_db FROM VOTE WHERE ROLE_ID = rId AND CONTENT_ID = cId;
--         if(down_in_db = down_) THEN
--             DELETE FROM VOTE WHERE ROLE_ID = rId AND CONTENT_ID = cId;
--         ELSE
--             UPDATE VOTE SET DOWN = down_ WHERE ROLE_ID = rId AND CONTENT_ID = cId;
--         end if;
--      end if;
--     RETURN 0;
-- end;
-- /

CREATE TABLE JOIN_GROUP_REQUEST(
    REQUEST_ID       NUMBER generated as identity
        primary key,
    GROUP_ID NUMBER REFERENCES PGROUP,
    REQUEST_FROM NUMBER REFERENCES ACADEMIC_ROLE,
    REQUEST_TO NUMBER REFERENCES ACADEMIC_ROLE,
    REQUESTED_AT TIMESTAMP,
    UNIQUE (GROUP_ID, REQUEST_FROM),
    FOREIGN KEY (GROUP_ID, REQUEST_FROM) references GROUP_MEMBER
);
