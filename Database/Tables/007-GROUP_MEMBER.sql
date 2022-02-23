create table GROUP_MEMBER
(
    GROUP_ID    NUMBER                       not null
        references PGROUP,
    ROLE_ID     NUMBER                       not null
        references ACADEMIC_ROLE,
    JOINED_AT   TIMESTAMP(6) default sysdate not null,
    MEMBER_ROLE CHAR(3)
        references ROLE,
    primary key (GROUP_ID, ROLE_ID)
)
/

create index GROUP_MEMBER_ALL_GROUP_QUERY
    on GROUP_MEMBER (ROLE_ID)
/

