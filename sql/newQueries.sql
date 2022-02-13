SELECT REPLIES, UPVOTE, DOWNVOTE, C.CONTENT_ID, C.TEXT, C.POSTED_AT, C.ROLE_ID, P2.FIRST_NAME || ' ' || p2.LAST_NAME, G.GROUP_ID, G.NAME, Voted.DOWN FROM
(SELECT COM1.CONTENT_ID,
       COUNT(COM2.CONTENT_ID)             as REPLIES,
       COUNT(V.ROLE_ID)                   AS UPVOTE,
       COUNT(V2.ROLE_ID)                  as DOWNVOTE
FROM COMMENT_ COM1
         JOIN CONTENT CON1 ON COM1.CONTENT_ID = CON1.CONTENT_ID
         LEFT OUTER JOIN COMMENT_ COM2 ON COM2.COMMENT_OF = CON1.CONTENT_ID
         LEFT OUTER JOIN VOTE V ON V.CONTENT_ID = COM1.CONTENT_ID AND V.DOWN = 'N'
         LEFT OUTER JOIN VOTE V2 ON V2.CONTENT_ID = COM1.CONTENT_ID AND V2.DOWN != 'N'
WHERE COM1.COMMENT_OF = :cId
GROUP BY COM1.CONTENT_ID) CONTENT_IDS

JOIN CONTENT C ON C.CONTENT_ID = CONTENT_IDS.CONTENT_ID
JOIN COMMENT_ COMM ON COMM.CONTENT_ID = C.CONTENT_ID
JOIN PGROUP G ON G.GROUP_ID = C.GROUP_ID
JOIN ACADEMIC_ROLE AR on C.ROLE_ID = AR.ROLE_ID
JOIN PERSON P2 on AR.PERSON_ID = P2.PERSON_ID
LEFT OUTER JOIN VOTE VOTED ON VOTED.ROLE_ID = :rId AND VOTED.CONTENT_ID = C.CONTENT_ID;


 SELECT C.CONTENT_ID, C.TEXT,P.TITLE, C.POSTED_AT, G.GROUP_ID, G.NAME as GROUP_NAME,
            COMMENT_COUNT, UPVOTE_COUNT, DOWNVOTE_COUNT, P2.FIRST_NAME || ' ' || p2.LAST_NAME as POSTED_BY, VOTED.DOWN as DOWNVOTE
            FROM
            (
            SELECT C.CONTENT_ID, COUNT(UNIQUE CMT.CONTENT_ID) as COMMENT_COUNT,
                COUNT(UNIQUE VU.ROLE_ID) as UPVOTE_COUNT,
                COUNT(UNIQUE  VD.ROLE_ID) as DOWNVOTE_COUNT
            FROM GROUP_MEMBER GM
            JOIN PGROUP G on GM.GROUP_ID = G.GROUP_ID
            JOIN CONTENT C ON C.GROUP_ID = G.GROUP_ID
            JOIN POST P ON P.CONTENT_ID = C.CONTENT_ID
            LEFT OUTER JOIN COMMENT_ CMT ON CMT.COMMENT_OF = P.CONTENT_ID
            LEFT OUTER JOIN VOTE VU ON VU.CONTENT_ID = C.CONTENT_ID AND VU.DOWN = 'N'
            LEFT OUTER JOIN VOTE VD ON VD.CONTENT_ID = C.CONTENT_ID AND VD.DOWN = 'Y'

            WHERE GM.ROLE_ID = :rId
            GROUP BY C.CONTENT_ID, C.POSTED_AT
            ORDER BY C.POSTED_AT
            FETCH NEXT 25 ROW ONLY
            ) CONTENT_IDS
            JOIN CONTENT C ON C.CONTENT_ID = CONTENT_IDS.CONTENT_ID
            JOIN POST P ON P.CONTENT_ID = C.CONTENT_ID
            JOIN PGROUP G ON G.GROUP_ID = C.GROUP_ID
            JOIN ACADEMIC_ROLE AR on C.ROLE_ID = AR.ROLE_ID
            JOIN PERSON P2 on AR.PERSON_ID = P2.PERSON_ID
            LEFT OUTER JOIN VOTE VOTED ON VOTED.ROLE_ID = :rId AND VOTED.CONTENT_ID = C.CONTENT_ID;