﻿using SnooNotes.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SnooNotes.Controllers {
    [Authorize]
    //[wikiedit] ///TODO

    [Route( "api/[controller]" )]
    public class ToolBoxNotesController : Controller {

        private UserManager<ApplicationUser> userManager;
        private DAL.INotesDAL notesDAL;
        private Utilities.IAuthUtils authUtils;
        private RedditSharp.RefreshTokenWebAgentPool agentPool;
        public ToolBoxNotesController(UserManager<ApplicationUser> userManager, DAL.INotesDAL notesDAL, Utilities.IAuthUtils authUtils, RedditSharp.RefreshTokenWebAgentPool agentPool ) {
            this.userManager = userManager;
            this.notesDAL = notesDAL;
            this.authUtils = authUtils;
            this.agentPool = agentPool;
        }
        [HttpGet]
        // GET: api/ToolBoxNotes
        public IEnumerable<string> Get()
        {
            return new string[2] { "a", "b" };
        }

        // GET: api/ToolBoxNotes/5
        [HttpGet("{id}")]
        public async Task<IEnumerable<RedditSharp.TBUserNote>> Get(string id)
        {
            if ( !User.HasClaim( "uri:snoonotes:admin", id.ToLower() ) ) {
                throw new UnauthorizedAccessException( "You are not an admin of this subreddit!" );
            }
            var agent = await agentPool.GetOrCreateWebAgentAsync(User.Identity.Name, async (uname, uagent, rlimit) =>
            {
                var ident = await userManager.FindByNameAsync(User.Identity.Name);
                return new RedditSharp.RefreshTokenPoolEntry(uname, ident.RefreshToken, rlimit, uagent);
            });

            var notes = await RedditSharp.ToolBoxUserNotes.GetUserNotesAsync(agent, id);
            return notes;
        }
        [HttpPost]
        // POST: api/ToolBoxNotes
        public async Task<int> Post([FromBody]Models.RequestObjects.TBImportMapping value)
        {
            if ( !User.HasClaim( "uri:snoonotes:admin", value.subName.ToLower() ) ) {
                throw new UnauthorizedAccessException( "You are not an admin of this subreddit!" );
            }


            var agent = await agentPool.GetOrCreateWebAgentAsync(User.Identity.Name, async (uname, uagent, rlimit) =>
            {
                var ident = await userManager.FindByNameAsync(User.Identity.Name);
                return new RedditSharp.RefreshTokenPoolEntry(uname, ident.RefreshToken, rlimit, uagent);
            });

            var notes = await RedditSharp.ToolBoxUserNotes.GetUserNotesAsync(agent, value.subName);
            List<Models.Note> convertedNotes = Utilities.TBNoteUtils.ConvertTBNotesToSnooNotes(value.subName, value.GetNoteTypeMapping(), notes.ToList());

            return await notesDAL.AddNewToolBoxNotesAsync(convertedNotes);
        }
    }
}
