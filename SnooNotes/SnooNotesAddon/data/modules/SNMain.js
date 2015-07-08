﻿function initSnooNotes() {
    (function (snUtil) {
        

        //snUtil.ApiBase = "https://snoonotes.com/api/";
        //snUtil.LoginAddress = "https://snoonotes.com/Auth/Login";
        snUtil.LoginAddress = "https://localhost:44311/Auth/Login";
        snUtil.ApiBase = "https://localhost:44311/api/";
        
        if ($('#SNContainer').length == 0) {
            $('body').append($('<div id="SNContainer"></div>'));
        }
        if ($('#SNModalContainer').length < 1) {
            $('body').append($('<div id="SNModalContainer"></div>'));
        }
        snUtil.NoteStyles = document.createElement('style');
        $('#SNContainer').append(snUtil.NoteStyles);
        snUtil.reinitWorker = function () {
            var event = new CustomEvent("snUtilDone");
            window.dispatchEvent(event);
        }
        snUtil.setUsersWithNotes = function(users){
            if (!users) {
                return;
            }
            snUtil.UsersWithNotes = "," + users.join(",") + ","; //I hate stupid arrays and not being able to case-insensitive searches!

        };
       
        //received data from socket to add/remove a user
        snUtil.updateUsersWithNotes = function (req) {
            var user = req.user;
            if (req.remove) {
                console.log("removed user");
                snUtil.UsersWithNotes = snUtil.UsersWithNotes.replace("," + user + ",", ","); //E-i-E-i-ooooooo
            }
            else if (req.add) {
                console.log("Added user");
                snUtil.UsersWithNotes = snUtil.UsersWithNotes + "," + user + ",";
            }
        };
        
        snUtil.getNotesForUsers = function (users) {
            snBrowser.requstUserNotes(users);
        };
        //have to have the snUtil functions ready >.<
        browserInit(); //init browser first to attach listeners etc
        //do this lateish so we get all the listeners hooked up first
        if (!snUtil.LoggedIn) checkLoggedIn();
        var sub = /reddit\.com\/r\/[a-z0-9\+]*\/?/i.exec(window.location);
        snUtil.Subreddit = !sub ? "" : sub[0].substring(13).replace(/\//g, '');
        snUtil.Subreddit = snUtil.Subreddit.indexOf('+') != -1  ? "" : snUtil.Subreddit; //if it contains a plus sign, it's a multi reddit, not a mod
        
        

        $('#SNModalContainer').on('click', '.SNCloseModal,#SNModalBackground', function (e) {
            snUtil.CloseModal();
        });

        snUtil.ShowModal = function (modalHTML) {
            $('body.res .side .titlebox div[data-res-css]:first').style('z-index', 'auto', 'important').children().style('z-index', 'auto', 'important');
            $('#tb-bottombar').style('z-index', 'auto', 'important');
            $('body').style('overflow', 'hidden', 'important');
            var $modalContainer = $('#SNModalContainer');
            $modalContainer.empty();
            $modalContainer.append($('<div id="SNModalBackground" style="display:none"></div>').show("fast"));
            $modalContainer.append($('<div id="SNModal"><div class="SNHeader"><a class="SNCloseModal SNClose">[x]</a></div>' + modalHTML + '</div>').show("fast"));
        }
        snUtil.CloseModal = function () {
            $('body.res .side .titlebox div[data-res-css]:first').style('z-index', '2147483646', 'important').children().style('z-index', '2147483646', 'important');
            $('#tb-bottombar').attr('style', '');
            $('body').attr('style', '');
            $('#SNModalContainer').empty();
        }

        snUtil.Modmail = window.location.pathname.match(/\/message\/(?:moderator)\/?/i);
        snUtil.ModQueue = window.location.pathname.match(/\/r\/mod\/about\/modqueue/i);
        return;
    }(snUtil = window.snUtil || {}));
}

function setModdedSubs(){
    $.ajax({
        url: snUtil.ApiBase + "Account/GetModeratedSubreddits",
        method: "GET",
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        success: function (d, s, x) {
            snUtil.ModdedSubs = "," + d.join(",") + ",";
            var event = new CustomEvent("snUtilDone");
            window.dispatchEvent(event);
        },
        error: handleAjaxError
    });
    return;
}
function checkLoggedIn() {
    $.ajax({
        url: snUtil.ApiBase + "Account/IsLoggedIn",
        method: "GET",
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        success: function (d, s, x) {
            snUtil.LoggedIn = true;
            snBrowser.loggedIn();
            window.dispatchEvent(new CustomEvent("snLoggedIn"));
            if (!snUtil.ModdedSubs) setModdedSubs();
        },
        error: handleAjaxError
    });
}
function handleAjaxError(jqXHR, textStatus, errorThrown) {
    if(jqXHR.status === 401)
    {
        window.dispatchEvent(new CustomEvent("snLoggedOut"));
        //showLoginPopup();
    }
}

(function () {
   
    jQuery.expr[":"].Contains = jQuery.expr.createPseudo(function (arg) {
        return function (elem) {
            return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
        };
    });
    initSnooNotes();
    $('div.content').on('DOMNodeInserted', function (e) {
        //copied from mod toolbox in the hopes it will make it compatible with their stuff too.
        var $target = $(e.target), $parentNode = $(e.target.parentNode);
        if (!($target.hasClass("sitetable") && ($target.hasClass("listing") || $target.hasClass("linklisting") ||
            $target.hasClass("modactionlisting"))) && !$parentNode.hasClass('morecomments') && !$target.hasClass('flowwit')) return;

        console.log('snGotNewThings firing from: ' + $target.attr('class'));

        setTimeout(function () {
            var event = new CustomEvent("snGotNewThings");
            window.dispatchEvent(event);
        }, 1750);
    });
})();

(function ($) {
    if ($.fn.style) {
        return;
    }

    // Escape regex chars with \
    var escape = function (text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };

    // For those who need them (< IE 9), add support for CSS functions
    var isStyleFuncSupported = !!CSSStyleDeclaration.prototype.getPropertyValue;
    if (!isStyleFuncSupported) {
        CSSStyleDeclaration.prototype.getPropertyValue = function (a) {
            return this.getAttribute(a);
        };
        CSSStyleDeclaration.prototype.setProperty = function (styleName, value, priority) {
            this.setAttribute(styleName, value);
            var priority = typeof priority != 'undefined' ? priority : '';
            if (priority != '') {
                // Add priority manually
                var rule = new RegExp(escape(styleName) + '\\s*:\\s*' + escape(value) +
                    '(\\s*;)?', 'gmi');
                this.cssText =
                    this.cssText.replace(rule, styleName + ': ' + value + ' !' + priority + ';');
            }
        };
        CSSStyleDeclaration.prototype.removeProperty = function (a) {
            return this.removeAttribute(a);
        };
        CSSStyleDeclaration.prototype.getPropertyPriority = function (styleName) {
            var rule = new RegExp(escape(styleName) + '\\s*:\\s*[^\\s]*\\s*!important(\\s*;)?',
                'gmi');
            return rule.test(this.cssText) ? 'important' : '';
        }
    }

    // The style function
    $.fn.style = function (styleName, value, priority) {
        // DOM node
        var node = this.get(0);
        // Ensure we have a DOM node
        if (typeof node == 'undefined') {
            return this;
        }
        // CSSStyleDeclaration
        var style = this.get(0).style;
        // Getter/Setter
        if (typeof styleName != 'undefined') {
            if (typeof value != 'undefined') {
                // Set style property
                priority = typeof priority != 'undefined' ? priority : '';
                style.setProperty(styleName, value, priority);
                return this;
            } else {
                // Get style property
                return style.getPropertyValue(styleName);
            }
        } else {
            // Get CSSStyleDeclaration
            return style;
        }
    };
})(jQuery);