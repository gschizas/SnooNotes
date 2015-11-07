﻿function processSnooNotes(){
    getEntriesToProcess();
}
var retrynum = 0; //this is bad and probably should get changed to a passed param.
function getEntriesToProcess() {

    var $SNEntries = {};
    $SNEntries = $('.sitetable .thing .entry:not(.SNDone), .commentarea .thing .entry:not(.SNDone)');
    

    var SNUsers = [];
    if (!snUtil.UsersWithNotes) {
        if (retrynum > 75) return;//fuck on outa here if something is wrong with user;
        else {
            retrynum += 1;
            console.log("Users was undefined " + retrynum + " times!");
            setTimeout(getEntriesToProcess, retrynum * 5 + 50 );
            return;
        }
    }
    retrynum = 0;
    if(snUtil.Subreddit || snUtil.Modmail ){
        if (snUtil.Modmail ||snUtil.ModQueue || new RegExp("," + snUtil.Subreddit + ",", "i").test(snUtil.ModdedSubs)) {
            console.log("Viewing sub that you mod or modmail");
            $('.author:not(".moderator")', $SNEntries).filter(function(){return $(this).parent('.recipient').length < 1}).each(function (index, ent) {
                var $container = $(ent).closest('div');
                //console.log("," + ent.innerHTML + "," + " ------ " + snUtil.UsersWithNotes);
                if (new RegExp("," + ent.innerHTML + ",","i").test(snUtil.UsersWithNotes)) {
                    if ($container.hasClass('SNFetching') && SNUsers.indexOf(ent.innerHTML) == -1) { //don't add doubles
                        SNUsers.push(ent.innerHTML);
                    }
                    else {
                        if ($('#SnooNote-' + ent.innerHTML.toLowerCase()).length == 0) {
                            if (SNUsers.indexOf(ent.innerHTML) == -1) {
                                SNUsers.push(ent.innerHTML);
                            }
                            $container.addClass('SNFetching');
                        }
                        else {
                            $container.addClass('SNDone');
                        }
                        $('<a SNUser="'+ent.innerHTML.toLowerCase()+'" class="SNViewNotes">[view note]</a>').insertAfter(ent);
                    }
                    
                }
                else {
                    //TODO add icon for new note
                    $('<a SNUser="' + ent.innerHTML.toLowerCase() + '" class="SNNoNotes">[add note]</a>').insertAfter(ent);
                    $container.addClass('SNDone');
                }
            });
        }
        else { //not browsing a /r/ you moderate
            console.log("Not a sub you mod");
        }
    }
    else { //not browsing a specific subreddit, also /user/ pages
        $SNEntries.each(function (index, $ent) {
            if (new RegExp("," + $('a.subreddit', $ent.closest('.thing'))[0].textContent.replace('/r/','') + ",", "i").test(snUtil.ModdedSubs)) {
                var auth = $('.author', $ent)[0].textContent.toLowerCase();
                if (new RegExp("," + auth + ",","i").test(snUtil.UsersWithNotes)) {
                    if ($('#SnooNote-' + auth).length == 0 && SNUsers.indexOf(auth) == -1) {
                        SNUsers.push(auth);
                    }
                    if ($ent.className.indexOf("SNFetching") == -1) {
                        $('.author', $ent).after($('<a SNUser="' + auth + '" class="SNViewNotes">[view&nbsp;note]</a>'));
                        $ent.className = $ent.className + " SNFetching";
                    }
                }
                else {
                    //TODO add icon for new note
                    $('.author', $ent).after($('<a SNUser="' + auth + '" class="SNNoNotes">[add&nbsp;note]</a>'));
                    $ent.className = $ent.className + " SNDone";
                }
            }
        });

    }
    if (snUtil.UserPage) {      
        var $user =  $('body.profile-page .side .titlebox h1')
        var uname = $user[0].textContent.toLowerCase();
        if (new RegExp("," + uname + ",", "i").test(snUtil.UsersWithNotes)) {
            if ($('#SnooNote-' + uname).length == 0 && SNUsers.indexOf(uname) == -1) {
                SNUsers.push(uname);
            }
            if ($user.children('a').length <= 0) {
                $user[0].textContent = $user[0].textContent + '  ';
                $user.append($('<a SNUser="' + uname + '" class="SNViewNotes SNNoLink SNOpenRight">[view&nbsp;note]</a>'));
            }
        }
        else {
            if ($user.children('a').length <= 0) {
                $user[0].textContent = $user[0].textContent + '  ';
                $user.append($('<a SNUser="' + uname + '" class="SNNoNotes SNNoLink SNOpenRight">[add&nbsp;note]</a>'));
            }
        }
    }
    if (SNUsers.length > 0) {
        snUtil.getNotesForUsers(SNUsers);
    }

}
function getUsersToProcess(){
    window.$SNUsers = {};
    $SNUsers = $('')

}
function processEntries(notes) {
   
    $('#SNContainer').append($(notes));
    if (notes) {
        $('.sitetable .thing .entry.SNFetching').removeClass("SNFetching").addClass("SNDone"); //TODO check this to make sure it won't lose notes / users randomly.s
    }
}

(function () {
    window.addEventListener("snUtilDone", function () {
        processSnooNotes();
    });
    window.addEventListener("snGotNewThings", function () {
        processSnooNotes();
    });
})();