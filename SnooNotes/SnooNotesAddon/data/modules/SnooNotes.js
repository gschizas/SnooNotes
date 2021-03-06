﻿(function () {
    window.addEventListener("snUtilDone", function (e) {
        $('body').on('click', '.SNViewNotes', function (e) {
            $('.SNNew:visible,.SNViewContainer:visible,#SNCabalTypes:visible').hide();
            showNotes(e);
            return false;
        });
        $('#SNContainer').on('click', '.SNCloseNote', function (e) {
            closeNote(e);
        });
        $('#SNContainer').on('click', '.SNCloseNewNote', function (e) {
            var $newnote = $(e.target).closest('.SNNew');
            $newnote.hide();
        });
        $('#SNContainer').on('click', '.SNNewNoteSubmit', function (e) {
            var ot = e.target;
            var $newNoteContainer = $(ot).closest('.SNNewNoteContainer');
            var $message = $(ot).siblings('.SNNewMessage');
            var notetype = $newNoteContainer.find('input:radio[name=SNType]:checked').val();
            var sub = $newNoteContainer.find('select.SNNewNoteSub').val();
            var valid = true;
            var $err = $newNoteContainer.find('.SNNewError');
            var $ntContainer = $newNoteContainer.find('.SNNoteType');
            //clean up previous errors if there were any
            $message.removeClass("SNError");
            $ntContainer.removeClass("SNError");
            $err.empty();
            if (!$message.val()) {
                valid = false;
                $err.append($("<p>Looks like you forgot the note text there...</p>"));
                $message.addClass("SNError");
            }
            if (!notetype) {
                valid = false;
                $err.append($("<p>Shucks! You forgot the note type...</p>"));
                $ntContainer.addClass("SNError");
            }
            if (valid) {
                submitNote(ot.attributes["SNUser"].value, sub, ot.attributes["SNLink"].value, $message.val(), notetype, $newNoteContainer);
            }
        });
        $('#SNContainer').on('click', '.SNDeleteNote', function (e) {
            var ot = e.target;
            var id = $(ot).closest('tr').attr("id").replace("SN", "");
            $.ajax({
                url: snUtil.ApiBase + "note/Delete?id=" + id,
                method: "DELETE",
                //datatype: "application/json",
                //data:{"id":id}
            });
        });
        $('body').on('click', '.SNNoNotes', function (e) {
            var $ot = $(e.target);

            $('.SNNew:visible,.SNViewContainer:visible,#SNCabalTypes:visible').hide();

            var user = $ot.attr('SNUser');
            var hasNoLink = $ot.hasClass('SNNoLink');
            var openRight = $ot.hasClass('SNOpenRight');
            var $newNote = $('#SnooNote-' + user);
            var sub = getSubName(e);
            if ($newNote.length == 0) { //add a new note container if it doesn't exist
                $newNote = $('' +
                    '<div id="SnooNote-' + user + '" class="SNNew SNNoteArea" style="display:none;">' +
                        '<div class="SNHeader"><a class="SNCloseNewNote SNClose">Cancel [x]</a></div>' +
                        '<div class="SNNewNoteContainer">' +
                            '<div class="SNNewNote">' +
                                '<textarea placeholder="Add a new note for user..." class="SNNewMessage" />' +
                                '<button type="button" class="SNNewNoteSubmit" ' +
                                    'SNUser="' + user + '" ' +
                                    'SNLink="' + (hasNoLink ? 'https://reddit.com/' + window.location.pathname : $('ul li.first a', $ot.closest('div.entry')).attr('href') )+ '" ' +
                                '>Submit</button>  ' +
                            '</div>' +
                            '<div class="SNNoteType"></div>' +
                            '<div class="SNNewError"></div>' +
                        '</div>' +
                    '</div>');
                var $sub = $('#SNSubDropdown').clone().removeAttr('id');
                $('.SNNewNote', $newNote).prepend($sub);
                if (sub) {
                    $sub.val(sub);
                var subNoteTypes = snUtil.settings.subSettings[sub].NoteTypes;
                    var $SNNoteType = $('.SNNoteType', $newNote);
                    for (var i = 0; i < subNoteTypes.length; i++) {
                    var noteType = subNoteTypes[i];
                        $SNNoteType.append($('<label class="SNTypeRadio SN' + sub + noteType.NoteTypeID + '"><input type="radio" name="SNType" value="' + noteType.NoteTypeID + '">' + noteType.DisplayName + '</label>'));
                    }
                }
                else {
                    $sub.val("-1");
                    $('.SNNoteType', $newNote).append('<strong>Select a subreddit!</strong>');
                }
                $('#SNContainer').append($newNote);
            }
            if (openRight) {
                $newNote.css({ 'top': e.pageY, 'right': window.innerWidth - e.pageX,'left':'' }).fadeIn('slow');
            }
            else {
                $newNote.css({ 'top': e.pageY, 'left': e.pageX, 'right':'' }).fadeIn('slow');
            }
            $newNote.draggable({ handle: "div.SNHeader" });

            e.preventDefault();
            return false;
        });
        $('#SNContainer').on('change', '.SNNewNoteSub', function (e) {
            var sub = this.value;
            var $newNote = this.closest('div.SNNewNoteContainer');
            var $noteTypes = $('.SNNoteType', $newNote);
            $noteTypes.empty();
            if (sub == "-1") {
                $noteTypes.append('<strong>Select a subreddit!</strong>');
            }
            else {
                var subNoteTypes = snUtil.settings.subSettings[sub].NoteTypes;
                for (var i = 0; i < subNoteTypes.length; i++) {
                    var noteType = subNoteTypes[i];
                    $noteTypes.append($('<label class="SNTypeRadio SN' + sub + noteType.NoteTypeID + '"><input type="radio" name="SNType" value="' + noteType.NoteTypeID + '">' + noteType.DisplayName + '</label>'));
                }
            }
        });

        $('#SNContainer').on('click', '.SNCabalify', function (e) {
            var $cabalTypes = $('#SNCabalTypes');
            $cabalTypes.attr('sn-note-id', $(e.target).closest('tr').attr("id").replace("SN", ""));
            $cabalTypes.css({ 'top': e.pageY - 10, 'left': e.pageX + 10, 'right': '' }).fadeIn('fast');
        });

        $('#SNContainer').on('click', '#SNCabalTypes li', function (e) {
            var id = $('#SNCabalTypes').attr('sn-note-id');
            var type = $(e.target).attr('sn-cabal-type');
            $('.SNNoteArea:visible .SNCabalify').hide();
            $('#SNCabalTypes:visible').hide();
            $.ajax({
                url: snUtil.ApiBase + 'Note/Cabal?id='+id+'&typeid='+type,
                method: "POST",
                //data: {'id':id, 'typeid' : type}
            })
            .then(function () {

            })
            .fail(function (e) {
                $('body').block({
                    message: '<div class="growlUI growlUIError"><h1>Error!</h1><h2>Cabalifying the note failed. Maybe it needs more shekels?</h2></div>',
                    fadeIn: 500, fadeOut: 700, timeout: 2000, centerY: !0, centerX: !0, showOverlay: !1,
                    css: $.blockUI.defaults.growlCSS
                });
                $('.SNNoteArea:visible .SNCabalify').show();
            })
        })
        $(document).click(function (event) {
            var $tar = $(event.target);
            if ($tar.is('.SNViewNotes,.SNNoNotes,.SNCabalify')) {
                //let the view/add click events handle it.
                return;
            }
            if (!$tar.closest('#SNCabalTypes').length && !$tar.is('#SNCabalTypes') && $('#SNCabalTypes').is(":visible")) {
                $('#SNCabalTypes').hide();

                if (!$tar.closest('.SNNew,.SNViewContainer').length && !$tar.is('.SNNew,.SNViewContainer')) {
                    $('.SNNew:visible,.SNViewContainer:visible').hide();
                }
            }
            

        });

        if (snUtil.NewModmail) {
            var target = document.querySelector('body');
            var modmailObserver = new MutationObserver(function (mut) {
                setTimeout(function(){
                    processSnooNotes();
                },1000);
            });
            var modmailObsConf = {
                attributes: false,
                childList: true,
                characterDate: false,
                subtree: true
            }

            modmailObserver.observe(target, modmailObsConf);
        }

        e.target.removeEventListener(e.type, arguments.callee);
    });
})();

function getSubName(e) {
    var subName = $(e.target).closest('.thing').attr('data-subreddit');
    if (subName) {
        return subName.toLowerCase();
    }
    else {
        //New modmail?
        subName = $(e.target).closest('div.ThreadViewer__thread, div.ThreadPreview').find('header .ThreadTitle__community, div.Thread__title .ThreadTitle__community').text();
    }
    if (subName) {
        return subName.toLowerCase();
    }


    var sub = snUtil.Subreddit;
    if (!sub || snUtil.ModQueue) {
        var $ot = $(e.target);
        
        //not a comment or browsing a sub you mod
        if (snUtil.Modmail) {
            var $sub = $ot.closest('.thing.message-parent').find('span.correspondent.reddit a');
            if ($sub.length > 1) {
                //multiple results here means RES / Mod toolbox is present which messes things up
                $sub = $sub.filter('.subreddit-name');
            }
            sub = $sub[0].textContent.substring(3).replace(/\//g, '');
        }
        else if (snUtil.ModQueue || snUtil.UserPage) {
            var $sub = $ot.closest('.thing').find('a.subreddit');
            if (!$sub.length) return null;
            var subinner = $sub[0].textContent;
            if (subinner.match(/\/r\//i)) {
                sub = subinner.substring(3).replace(/\//g, '');
            }
            else {
                sub = subinner;
            }
        }
        else {
            sub = $ot.siblings("a.subreddit:first")[0].innerHTML.substring(3).replace(/\//g, '');
        }
    }
    return sub ? sub.toLowerCase() : "";
}


function newNoteExistingUser(req) {
    var $user = $('#SnooNote-' + req.user + ' table');
    if ($user.length > 0) {
        var $note = $(req.note);
        if ($user.is(":visible")) {
            $user.append($note.hide());
            $note.fadeIn("slow");
        }
        else {
            $user.append($note);
        }
    }
}

function newNoteNewUser(req) {
    var $user = $('#SnooNote-' + req.user);
    var $entries = $("#siteTable .entry .author:Contains(" + req.user + "), .commentarea .entry .author:Contains(" + req.user + ")").closest("div.entry");
    if ($entries.length > 0) {
        $('.SNNoNotes', $entries).remove();
        $('.author', $entries).parent().not('.recipient').children('.author').after($('<a SNUser="' + req.user + '" class="SNViewNotes">[view note]</a>'));
    }
    if ($user.length == 0) {
        //new note for a user not added by this page
        if ($entries.length > 0) {
            $('#SNContainer').append($(req.note));
        }
    }
    else {
        //hey! I just added that one!
        var $notecont = $(req.note);
        $user.removeClass("SNNew").addClass("SNViewContainer");
        var $header = $('.SNHeader', $user);
        $header.after($notecont.children('table').hide().fadeIn("fast"));
        $header.children('a.SNClose').removeClass('SNCloseNewNotes').addClass('SNCloseNote')
    }

    snUtil.settings.usersWithNotes.push(req.user);
}
function deleteNoteAndUser(req) {
    var $user = $('#SnooNote-' + req.user);
    var $entries = $("#siteTable .entry .author:Contains(" + req.user + "), .commentarea .entry .author:Contains(" + req.user + ")").closest("div.entry");
    if ($entries.length > 0) {
        $('.SNViewNotes', $entries).remove();
        $('.author', $entries).parent().not('.recipient').children('.author').after($('<a SNUser="' + req.user + '" class="SNNoNotes">[add note]</a>'));
    }
    if ($user.length > 0) {
        if ($user.is(":visible")) {
            var link = $('.SNNewNoteSubmit', $user).attr('SNLink');
            //displaying add new note again doesn't work quite right so axing it for now.
            //link = /\/r\/.*/.exec(link)[0]; //trim out some of the prefix garbage that might cause issues if browsing with https etc.
            //var $entry = $('#siteTable .entry a[href$="' + link + '"], .commentarea .entry a[href$="' + link + '"]').closest('div.entry');

            $user.remove();
            //$('.SNNoNotes', $entry).trigger('click'); 
        }
        else {
            $user.remove();
        }
    }
    var i = snUtil.settings.usersWithNotes.indexOf(req.user);
    if (i > -1) {
        snUtil.settings.usersWithNotes.splice(i, 1);
    }
}
function deleteNote(req) {

    $note = $('#SN' + req.noteID);
    if ($note.is(":visible")) {
        $note.hide("slow", function () { $note.remove(); });
    }
    else {
        $note.remove();
    }
}


function showNotes(e) {
    var $sn = $('#SnooNote-' + e.target.attributes["SNUser"].value);
    
    var $submit = $('.SNNewNoteSubmit', $sn);
    var $ot = $(e.target);
    var hasNoLink = $ot.hasClass('SNNoLink');
    var openRight = $ot.hasClass('SNOpenRight');
    var sub = getSubName(e);
    if ($('.SNNewNoteSub', $sn).length == 0) {
        var $sub = $('#SNSubDropdown').clone().removeAttr('id');
        $('.SNNewNote', $sn).prepend($sub);
        if (sub) $sub.val(sub);
        else $sub.val("-1");
        $sub.trigger('change');
    }
    //var subNoteTypes = snUtil.NoteTypes[sub];
    //var $SNNoteType = $('.SNNoteType', $sn);
    //$SNNoteType.empty();
    //for (var i = 0; i < subNoteTypes.length; i++) {
    //    var noteType = subNoteTypes[i];
    //    $SNNoteType.append($('<label class="SNTypeRadio SN' + sub + noteType.NoteTypeID + '"><input type="radio" name="SNType" value="' + noteType.NoteTypeID + '">' + noteType.DisplayName + '</label>'));
    //}
    if (snUtil.NewModmail && !hasNoLink) {
        $submit.attr("SNLink", ($ot.closest('div.ThreadViewer__thread, div.ThreadPreview').find('a.Message__date, header a.ThreadPreview__time')[0].href));
    } else {
        $submit.attr("SNLink", (hasNoLink ? 'https://reddit.com/' + window.location.pathname : $('ul li.first a', $ot.closest('div.entry')).attr('href')));
    }
    if (openRight) {
        $sn.css({ 'top': e.pageY, 'right': window.innerWidth - e.pageX, 'left':'' }).fadeIn('slow');
    }
    else {
        $sn.css({ 'top': e.pageY, 'left': e.pageX, 'right':'' }).fadeIn('slow');
    }
    $sn.draggable({ handle: "div.SNHeader" });
}

function closeNote(e) {
    $(e.target).closest('.SNViewContainer').hide();
}

function submitNote(user, sub, link, message, type, $noteCont) {
    if ($noteCont) {
    $('.SNNewNoteSubmit, .SNNewMessage', $noteCont).attr('disabled', 'disabled');
    $noteCont.find('.SNNewError').empty();
    }
    $.ajax({
        url: snUtil.ApiBase + "note",
        method: "POST",
        datatype: "application/json",
        data: { "NoteTypeID": type, "SubName": sub, "Message": message, "AppliesToUsername": user, "Url": link },
        success: function (d, status, jqXHR) {
            $('#SnooNote-' + user.toLowerCase() + ' .SNNewMessage').val('');
            $('#SnooNote-' +user.toLowerCase() + ' .SNNewNoteSubmit, #SnooNote-' + user.toLowerCase() + ' .SNNewMessage').removeAttr('disabled');
        },
        error: function (j, t, e) {
            if (j.status === 401) handleAjaxError(j, t, e);
            $('#SnooNote-' +user.toLowerCase() + ' .SNNewNoteSubmit, #SnooNote-' +user.toLowerCase() + ' .SNNewMessage').removeAttr('disabled');
            $('#SnooNote-' +user.toLowerCase() + ' .SNNewError').append($("<p>Something goofed. You can try resubmitting the note, but I'm not promising anything...</p>"));
        }
    });
}