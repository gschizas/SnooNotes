﻿using System;
using System.Threading.Tasks;
using Microsoft.Owin;
using Microsoft.Owin.Cors;
using Owin;

[assembly: OwinStartup(typeof(SnooNotesAPI.Startup))]

namespace SnooNotesAPI
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            app.UseCors(CorsOptions.AllowAll);
            ConfigureAuth(app);
            app.MapSignalR(new Microsoft.AspNet.SignalR.HubConfiguration { EnableJSONP = true, EnableDetailedErrors = true });

            new RedditSharp.Reddit();
            RedditSharp.WebAgent.UserAgent = "SnooNotes (by /u/meepster23)";
            RedditSharp.WebAgent.RateLimit = RedditSharp.WebAgent.RateLimitMode.Burst;

            Utilities.SNWebAgent.UserAgent = "SnooNotes (by /u/meepster23)";
            Utilities.SNWebAgent.RateLimit = Utilities.SNWebAgent.RateLimitMode.Burst;
        }
    }
}
