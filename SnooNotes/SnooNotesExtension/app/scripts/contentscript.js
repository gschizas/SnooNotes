console.log('\'Allo \'Allo! Content script');

import Vue from 'vue'
import UserNotes from './components/userNotes.vue';
import SNOptions from './components/options/snOptions.vue';
import axios from 'axios';
import {SNAxiosInterceptor} from './utilities/snAxiosInterceptor';
import {apiBaseUrl} from './config';
import Toasted from 'vue-toasted';
import {reduxStore} from './redux/contentScriptStore';
import {getNotesForUsers} from './redux/actions/notes';


export const snInterceptor = new SNAxiosInterceptor(reduxStore);
axios.defaults.baseURL = apiBaseUrl;
axios.interceptors.request.use((req)=>{return snInterceptor.interceptRequest(req);});

Vue.use(Toasted,{position:'bottom-right',duration:2500});

//dont start render until store is connected properly
const unsub = reduxStore.subscribe(()=>{
    unsub();
    let state = reduxStore.getState();

    
    const options = new Vue({render: h=>h(SNOptions)}).$mount();
    options.$on('refresh',()=>{
        let authorsReq = [];
        let things = document.querySelector('.thing');
        for (let i = 0; i < things.length; i++){
            let authElem = things[i].querySelector('a.author');
            if(authElem){
                let author = things[i].attributes['data-author'].value;
                if(!author){
                    author = authElem.textContent;
                }
                if(usersWithNotes.indexOf(author) != -1){
                    authorsReq.push(author);
                }
            }
        }
        if (authorsReq.length > 0){
            getNotesForUsers(reduxStore.dispatch,authorsReq);
        }
    })
    const userElem = document.querySelector('#header-bottom-right > .user');
    userElem.parentNode.insertBefore(options.$el,userElem.nextSibling);

    let usersWithNotes = state.snoonotes_info.users_with_notes;
    
    let authorsReq = [];
    var things = document.querySelectorAll('.thing');
    let commentRootURL;
    for (let i = 0; i < things.length; i++){
        let authElem = things[i].querySelector('a.author');
        if(authElem){
            let author = things[i].attributes['data-author'].value;
            if(!author){
                author = authElem.textContent;
            }
            if(usersWithNotes.indexOf(author) != -1){
                authorsReq.push(author);
            }
            let url = "";
            if (things[i].attributes['data-type'].value == 'link'){
                url = "https://reddit.com/r/" + things[i].attributes['data-subreddit'].value + '/' + things[i].attributes['data-fullname'].value.replace('t3_','');
            }
            else{
                if(!commentRootURL) commentRootURL = 'https://reddit.com/r/'+ things[i].attributes['data-subreddit'].value + '/comments/' + things[i].parentElement.id.replace('siteTable_t3_','') + '/.../';
                url = commentRootURL + things[i].attributes['data-fullname'].value.replace('t1_','');
            }
            let noteElem = document.createElement('user-notes');
            noteElem.setAttribute('username',author);
            noteElem.setAttribute('subreddit',things[i].attributes['data-subreddit'].value);
            noteElem.setAttribute('url',url);
            authElem.parentNode.insertBefore(noteElem,authElem.nextSibling);
            let notes = new Vue({components:{'user-notes':UserNotes}}).$mount(things[i]);
        }
    }
    if (authorsReq.length > 0){
        getNotesForUsers(reduxStore.dispatch,authorsReq);
    }
})

