﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.Owin.Security;
using System.Security.Claims;
using System.Web.Http;
using Microsoft.Owin;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using System.Threading.Tasks;
using System.Threading;
namespace SnooNotesAPI.Controllers {
    [Authorize]
    public class AccountController : ApiController {
        private BLL.SubredditBLL subBLL;
        public AccountController() {
            subBLL = new BLL.SubredditBLL();
        }

        [HttpGet]
        public bool IsLoggedIn() {
            return true;
        }
        [HttpGet]
        public List<string> GetModeratedSubreddits() {
            return ( User.Identity as ClaimsIdentity ).Claims.Where( c => c.Type == ( User.Identity as ClaimsIdentity ).RoleClaimType ).Select( c => c.Value ).ToList<string>();
        }

        [HttpGet]
        public Models.UserIdentity GetCurrentUser() {
            ClaimsIdentity ident = ClaimsPrincipal.Current.Identity as ClaimsIdentity;
            return new Models.UserIdentity {
                HasRead = ident.HasClaim( c => c.Type == "urn:snoonotes:scope" && c.Value == "read" ),
                HasWikiRead = ident.HasClaim( c => c.Type == "urn:snoonotes:scope" && c.Value == "wikiread" ),
                UserName = ident.Name
            };
        }

        [HttpGet]
        public async Task<IEnumerable<string>> GetInactiveModeratedSubreddits() {
            var userManager = HttpContext.Current.GetOwinContext().GetUserManager<ApplicationUserManager>();
            var ident = userManager.FindByName( User.Identity.Name );
            if ( ident.TokenExpires < DateTime.UtcNow ) {
                Utilities.AuthUtils.GetNewToken( ident );
                userManager.Update( ident );
            }
            Utilities.SNWebAgent agent = new Utilities.SNWebAgent( ident.AccessToken );
            RedditSharp.Reddit rd = new RedditSharp.Reddit( agent, true );

            List<Models.Subreddit> activeSubs = await subBLL.GetActiveSubs();
            List<string> activeSubNames = activeSubs.Select( s => s.SubName.ToLower() ).ToList();

            var subs = rd.User.ModeratorSubreddits.Where( s => s.ModPermissions.HasFlag( RedditSharp.ModeratorPermission.All ) && !activeSubNames.Contains( s.Name.ToLower() ) ).Select( s => s.Name );
            return subs.OrderBy( s => s );
        }
        [HttpGet]
        public async Task<List<string>> UpdateModeratedSubreddits() {
            var userManager = HttpContext.Current.GetOwinContext().GetUserManager<ApplicationUserManager>();
            var user = userManager.FindByName( User.Identity.Name );

                await Utilities.AuthUtils.UpdateModeratedSubreddits( user, userManager );

                userManager.Update( user );


            var ident = await user.GenerateUserIdentityAsync( userManager );
            HttpContext.Current.GetOwinContext().Authentication.SignIn( new AuthenticationProperties { IsPersistent = true }, ident );
            return ident.Claims.Where( c => c.Type == ( User.Identity as ClaimsIdentity ).RoleClaimType ).ToList().Select( c => c.Value ).ToList<string>();

        }

    }
}