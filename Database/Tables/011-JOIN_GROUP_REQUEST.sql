create table JOIN_GROUP_REQUEST
(
    REQUEST_ID   NUMBER       default "C##UNICONNECT_V2"."ISEQ$$_81153".nextval generated as identity
        primary key,
    GROUP_ID     NUMBER
        references PGROUP,
    REQUEST_FROM NUMBER
        references ACADEMIC_ROLE,
    REQUEST_TO   NUMBER
        references ACADEMIC_ROLE,
    REQUESTED_AT TIMESTAMP(6) default SYSDATE,
    unique (GROUP_ID, REQUEST_FROM, REQUEST_TO),
    foreign key (GROUP_ID, REQUEST_FROM) references GROUP_MEMBER
)
/

