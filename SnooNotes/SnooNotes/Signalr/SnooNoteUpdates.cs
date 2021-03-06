﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Threading;
using Microsoft.AspNetCore.SignalR.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Infrastructure;
using Microsoft.Extensions.Configuration;

namespace SnooNotes.Signalr
{
    public class SnooNoteUpdates : ISnooNoteUpdates
    {
        private IConnectionManager connManager;
        public SnooNoteUpdates(IConnectionManager connectionManager, IConfigurationRoot config ) {
            connManager = connectionManager;
        }


        public void SendNewNote(Models.Note anote) {
            connManager.GetHubContext<SnooNotesHub>().Clients.Group(anote.SubName.ToLower()).addNewNote(anote);
        }

        public void DeleteNote(Models.Note anote, bool outOfNotes)
        {
            connManager.GetHubContext<SnooNotesHub>().Clients.Group(anote.SubName.ToLower()).deleteNote(anote.AppliesToUsername,anote.NoteID, outOfNotes);
        }

        public void RefreshNoteTypes(IEnumerable<string> SubNames)
        {
            foreach (string SubName in SubNames)
            {
                connManager.GetHubContext<SnooNotesHub>().Clients.Group(SubName.ToLower()).refreshNoteTypes();
            }
        }
        public void SendModAction( Models.ModAction action ) {
            connManager.GetHubContext<SnooNotesHub>().Clients.Group( action.Subreddit.ToLower() ).modAction( action.ThingID, action.Mod, action.Action );
        }

    }
    
}