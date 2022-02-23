create table CONTENT
(
    CONTENT_ID NUMBER       default "C##UNICONNECT_V2"."ISEQ$$_76877".nextval generated as identity
        primary key,
    TEXT       CLOB                         not null,
    POSTED_AT  TIMESTAMP(6) default sysdate not null,
    ROLE_ID    NUMBER                       not null
        references ACADEMIC_ROLE,
    GROUP_ID   NUMBER
        constraint GROUP_ID_FOREIGN_KEY
            references PGROUP,
    constraint FROM_MEMBER
        foreign key (GROUP_ID, ROLE_ID) references GROUP_MEMBER
)
/

