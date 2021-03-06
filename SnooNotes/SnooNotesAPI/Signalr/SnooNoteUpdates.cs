﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Threading;
using Microsoft.AspNet.SignalR.Hubs;
using Microsoft.AspNet.SignalR;

namespace SnooNotesAPI.Signalr
{
    public class SnooNoteUpdates
    {
        private readonly static Lazy<SnooNoteUpdates> _instance = new Lazy<SnooNoteUpdates>(
            () => new SnooNoteUpdates(GlobalHost.ConnectionManager.GetHubContext<SnooNotesHub>().Clients));
    
        public static SnooNoteUpdates Instance{
            get{
                return _instance.Value;
            }
        }

         private IHubConnectionContext<dynamic> Clients
        {
            get;
            set;
        }

         private SnooNoteUpdates(IHubConnectionContext<dynamic> clients)
         {
             Clients = clients;
         }

        public void SendNewNote(Models.Note anote){
            Clients.Group(anote.SubName.ToLower()).addNewNote(anote);
        }

        public void DeleteNote(Models.Note anote, bool outOfNotes)
        {
            Clients.Group(anote.SubName.ToLower()).deleteNote(anote.AppliesToUsername,anote.NoteID, outOfNotes);
        }

        public void RefreshNoteTypes(IEnumerable<string> SubNames)
        {
            foreach (string SubName in SubNames)
            {
                Clients.Group(SubName.ToLower()).refreshNoteTypes();
            }
        }

        public void SendModAction(Models.ModAction action ) {
            Clients.Group( action.Subreddit.ToLower() ).modAction( action.ThingID, action.Mod, action.Action );
        }
    
    }
    
}