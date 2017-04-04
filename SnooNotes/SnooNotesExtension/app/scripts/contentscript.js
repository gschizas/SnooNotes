console.log('\'Allo \'Allo! Content script');

import Vue from 'vue'
import UserNotes from './components/userNotes.vue';
import SNOptions from './components/options/snOptions.vue';
import axios from 'axios';
import {snInterceptor} from './utilities/snAxiosInterceptor';
import {apiBaseUrl} from './config';
import Toasted from 'vue-toasted';
import {reduxStore} from './redux/contentScriptStore';

axios.defaults.baseURL = apiBaseUrl;
axios.interceptors.request.use((req)=>{return snInterceptor.interceptRequest(req);});

//dont start render until store is connected properly
const unsub = reduxStore.subscribe(()=>{
    unsub();
    Vue.use(Toasted,{position:'bottom-right',duration:2500});
    
    var things = document.querySelectorAll('.thing');
    for (var i = 0; i < things.length; i++){
        var authElem = things[i].querySelector('a.author');
        if(authElem){
            let author = things[i].attributes['data-author'].value;
            if(!author){
                author = authElem.textContent;
            }
            var noteElem = document.createElement('user-notes');
            noteElem.setAttribute('username',author);
            noteElem.setAttribute('subreddit',things[i].attributes['data-subreddit'].value);
            noteElem.setAttribute('type',things[i].attributes['data-type'].value);
            noteElem.setAttribute('thingid',things[i].attributes['data-fullname'].value);
            authElem.parentNode.insertBefore(noteElem,authElem.nextSibling);
            var notes = new Vue({components:{'user-notes':UserNotes}}).$mount(things[i]);
            
            
        }
    }

    var options = new Vue({render: h=>h(SNOptions)}).$mount();
    var userElem = document.querySelector('#header-bottom-right > .user');
    userElem.parentNode.insertBefore(options.$el,userElem.nextSibling);
})