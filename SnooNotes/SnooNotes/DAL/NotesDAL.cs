﻿using System.Collections.Generic;
using System.Linq;
using Dapper;
using System.Data.SqlClient;
using System.Threading.Tasks;
using SnooNotes.Models;
using Microsoft.Extensions.Configuration;

namespace SnooNotes.DAL {
    public class NotesDAL : INotesDAL {
        private string connstring;
        private IConfigurationRoot Configuration;
        public NotesDAL( IConfigurationRoot config ) {
            Configuration = config;
            connstring = Configuration.GetConnectionString("SnooNotes");
        }
        public Task<IEnumerable<Note>> GetNotes( string subname, IEnumerable<string> usernames, bool ascending = true ) {
            return GetNotes(new string[] { subname }, usernames, ascending);
        }
        public async Task<IEnumerable<Note>> GetNotes( IEnumerable<string> subnames, IEnumerable<string> usernames, bool ascending = true ) {
            using (SqlConnection conn = new SqlConnection(connstring)) {
                string query = $@"
select n.NoteID, n.NoteTypeID, s.SubName, n.Submitter, n.Message, n.AppliesToUsername, n.Url, n.Timestamp, n.ParentSubreddit 
from Notes n inner join Subreddits s on s.SubredditID = n.SubredditID 
where n.AppliesToUsername in @usernames and s.SubName in @subnames
ORDER BY AppliesToUsername desc, Timestamp {(ascending ? "asc" : "desc")} 
";

                return await conn.QueryAsync<Note>(query, new { usernames, subnames });
            }
        }


        public async Task<IEnumerable<string>> GetUsersWithNotes( IEnumerable<string> subnames ) {
            using (SqlConnection conn = new SqlConnection(connstring)) {
                string query = "select distinct n.AppliesToUsername "
                       + " from Notes n inner join Subreddits s on s.SubredditID = n.SubredditID "
                       + " where s.SubName in @subnames";

                return await conn.QueryAsync<string>(query, new { subnames });
            }
        }
        public async Task<bool> UserHasNotes( IEnumerable<string> subnames, string username ) {
            using (SqlConnection conn = new SqlConnection(connstring)) {
                string query = "select count(*) "
                       + " from Notes n inner join Subreddits s on s.SubredditID = n.SubredditID "
                       + " where s.SubName in @subnames and n.AppliesToUsername = @username";
                int count = (await conn.QueryAsync<int>(query, new { subnames, username })).FirstOrDefault();
                return count > 0;
            }
        }
        public async Task<IEnumerable<Note>> ExportNotes( IEnumerable<string> subnames ) {
            using (SqlConnection conn = new SqlConnection(connstring)) {
                string query = @"
select n.NoteID, n.NoteTypeID, s.SubName, n.Submitter, n.Message, n.AppliesToUsername, n.Url, n.Timestamp, n.ParentSubreddit 
from Notes n inner join Subreddits s on s.SubredditID = n.SubredditID
where s.SubName in @subnames
order by AppliesToUsername desc, Timestamp asc
";

                return await conn.QueryAsync<Note>(query, new { subnames });
            }
        }
        public async Task<Note> GetNoteByID( int id ) {
            using (SqlConnection conn = new SqlConnection(connstring)) {
                string query = "select n.NoteID, n.NoteTypeID, s.SubName, n.Submitter, n.Message, n.AppliesToUsername, n.Url, n.Timestamp, n.ParentSubreddit "
                        + " from Notes n inner join Subreddits s on s.SubredditID = n.SubredditID "
                        + " where n.NoteID = @noteid";

                return (await conn.QueryAsync<Note>(query, new { noteid = id })).Single();
            }
        }
        public async Task<Note> AddNoteForUser( Note anote ) {
            //anote.AppliesToUsername = anote.AppliesToUsername.ToLower();
            using (SqlConnection conn = new SqlConnection(connstring)) {
                string query = "insert into Notes(NoteTypeID,SubredditID,Submitter,Message,AppliesToUsername, n.Url, n.Timestamp) "
                    + " values (@NoteTypeID,(select SubredditID from Subreddits where SubName = @SubName),@Submitter,@Message,@AppliesToUsername, @Url, @Timestamp);"
                    + " select n.NoteID, n.NoteTypeID, s.SubName, n.Submitter, n.Message, n.AppliesToUsername, n.Url, n.Timestamp "
                        + " from Notes n inner join Subreddits s on s.SubredditID = n.SubredditID "
                        + " where n.NoteID = cast(SCOPE_IDENTITY() as int) ";
                Note insertedNote = (await conn.QueryAsync<Note>(query, new { anote.NoteTypeID, anote.SubName, anote.Submitter, anote.Message, anote.AppliesToUsername, anote.Url, anote.Timestamp })).Single();

                return insertedNote;
            }
        }

        public async Task<TableResults<Note>> SearchNotes( IEnumerable<string> subredditNames, int limit, int page, string searchTerm, string orderBy, bool ascending ) {

            string orderByColumn = "";
            switch (orderBy.ToLower()) {
                case "username":
                    orderByColumn = "AppliesToUsername"; break;
                case "submitter":
                    orderByColumn = "submitter"; break;
                case "date":
                    orderByColumn = "timestamp"; break;
                case "notetype":
                    orderByColumn = "displayorder"; break;
                case "subreddit":
                    orderByColumn = "subname"; break;
                default:
                    orderByColumn = "timestamp"; break;
            }
            string query = $@"
SELECT Count(*)
FROM Notes n
INNER JOIN Subreddits sub on sub.SubredditID = be.SubredditID
INNER JOIN NoteTypes nt on nt.NoteTypeID = n.NoteTypeID
where sub.SubName in @subredditNames
{(string.IsNullOrWhiteSpace(searchTerm) ? "" : @"
AND (
    n.AppliesToUsername like '%' + @searchTerm + '%'
    OR n.Submitter like '%' + @searchTerm + '%'
    OR n.Url like '%' + @searchTerm + '%'
    OR n.Message like '%' + @searchTerm + '%'
    OR nt.DisplayName like '%' + @searchTerm + '%'
)
")}

select n.NoteID, n.NoteTypeID, s.SubName, n.Submitter, n.Message, n.AppliesToUsername, n.Url, n.Timestamp, n.ParentSubreddit 
FROM Notes n 
INNER JOIN Subreddits s on s.SubredditID = n.SubredditID
INNER JOIN NoteTypes nt on nt.NoteTypeID = n.NoteTypeID
where s.SubName in @subnames and
{(string.IsNullOrWhiteSpace(searchTerm) ? "" : @"
AND (
    n.AppliesToUsername like '%' + @searchTerm + '%'
    OR n.Submitter like '%' + @searchTerm + '%'
    OR n.Url like '%' + @searchTerm + '%'
    OR n.Message like '%' + @searchTerm + '%'
    OR nt.DisplayName like '%' + @searchTerm + '%'
)
")}
ORDER BY {orderByColumn} {(ascending ? "asc" : "desc")} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
";
            using (var snConn = new SqlConnection(connstring))
            using (var multi = await snConn.QueryMultipleAsync(query, new { searchTerm, offset = (limit * (page - 1)), subredditNames, limit })) {
                int totalCount = 0;
                totalCount = await multi.ReadFirstAsync<int>();
                var results = await multi.ReadAsync<Models.Note>();

                return new Models.TableResults<Models.Note> {
                    TotalResults = totalCount,
                    CurrentPage = page,
                    ResultsPerPage = limit,
                    DataTable = results
                };
            }
        }
    
        public async Task<Note> AddNoteToCabal(Note anote, string cabalSub ) {
            using ( SqlConnection conn = new SqlConnection( connstring ) ) {
                string query = @"
INSERT INTO Notes(NoteTypeID, SubredditID, Submitter, Message, AppliesToUsername, Url, Timestamp, ParentSubreddit )
OUTPUT INSERTED.NoteID, INSERTED.NoteTypeID, @CabalSub as 'SubName', INSERTED.Submitter, INSERTED.Message, INSERTED.AppliesToUsername, INSERTED.Url, INSERTED.Timestamp, INSERTED.ParentSubreddit
SELECT 
@NoteTypeID, 
(SELECT SubredditID from Subreddits where SubName = @CabalSub),
@Submitter,
n.Message,
n.AppliesToUsername,
n.Url,
@Timestamp,
@OriginalSubreddit
FROM Notes n
INNER JOIN Subreddits s on s.SubredditID = n.SubredditID
WHERE
n.NoteID = @NoteID
AND s.SubName like @OriginalSubreddit
";
                Note insertedNote = ( await conn.QueryAsync<Note>( query, new { anote.NoteID, anote.NoteTypeID, CabalSub = cabalSub, anote.Submitter, anote.Timestamp, OriginalSubreddit = anote.SubName } ) ).Single();
                return insertedNote;
            }
        }
        /// <summary>
        /// Returns True if user has no more notes in subreddit
        /// </summary>
        /// <param name="anote"></param>
        /// <param name="uname"></param>
        /// <returns></returns>
        public async Task<bool> DeleteNoteForUser( Note anote, string uname ) {
            using ( SqlConnection conn = new SqlConnection( connstring ) ) {
                string query = @"
delete n 
OUTPUT GETUTCDATE() as 'HistTimestamp','D' as 'HistAction',@uname as 'HistUser', DELETED.NoteID, DELETED.NoteTypeID, DELETED.SubRedditID,DELETED.Submitter,DELETED.Message,DELETED.AppliesToUsername,DELETED.URL,DELETED.TimeStamp,DELETED.ParentSubreddit into Notes_History 
from Notes n INNER JOIN Subreddits sr on n.SubredditID = sr.SubredditID 
where NoteID = @noteid and sr.SubName = @subname;

Select count(*)
from Notes n INNER JOIN Subreddits sr on n.SubredditID = sr.SubredditID 
WHERE
n.AppliesToUsername = @AppliesToUsername and sr.SubName = @subname;
";
                int count = (await conn.QueryAsync<int>( query, new { anote.NoteID, anote.SubName, uname, anote.AppliesToUsername } )).FirstOrDefault();
                return count == 0;
            }
        }

        public async Task<int> AddNewToolBoxNotesAsync( List<Note> tbNotes ) {
            using ( SqlConnection conn = new SqlConnection( connstring ) ) {
                string query = @"
insert into Notes(NoteTypeID,SubredditID,Submitter,Message,AppliesToUsername, Url, Timestamp) 
select @NoteTypeID,(select SubredditID from Subreddits where SubName = @SubName),@Submitter,@Message,@AppliesToUsername, @Url, @Timestamp 
where not exists (select * from Notes n inner join Subreddits s on s.SubredditID = n.SubredditID where s.SubName = @SubName and n.AppliesToUsername = @AppliesToUsername and n.Submitter = @Submitter and n.Url = @Url and CONVERT(VARCHAR,n.Timestamp,120) = CONVERT(VARCHAR,@TimeStamp,120))
";
                int rowsEffected = await conn.ExecuteAsync( query, tbNotes );
                return rowsEffected;

                //HASHBYTES('SHA2_256',Lower(s.SubName + n.Submitter + n.AppliesToUsername + CONVERT(VARCHAR,n.Timestamp,120) + n.Url))
            }
        }
    }
}