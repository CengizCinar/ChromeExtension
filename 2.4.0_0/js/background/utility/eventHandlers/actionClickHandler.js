"use strict";import{sentrySellerAmp}from"../../../content/sentrySellerAmp/sentrySellerAmp.js";import{contentScriptMessages}from"../../../content/constants/contentScriptMessages.js";import{handleScriptInjection}from"../injectContentIntoTabs.js";import{CONTENT_SCRIPT_STATUSES}from"../../constants/contentScriptStatus.js";const actionClickHandler=e=>{sentrySellerAmp.wrap(function(){handleEvent(e)})},handleEvent=async n=>{const s=async(e,t)=>{if(e?.message===contentScriptMessages.READY&&t.tab.id===n.id)try{await sendRequestToToggleSas(n.id)}finally{chrome.runtime.onMessage.removeListener(s)}else e?.message===contentScriptMessages.UNLOADED&&t.tab?.id===n.id&&chrome.runtime.onMessage.removeListener(s)};chrome.runtime.onMessage.addListener(s);try{var e=await handleScriptInjection(n);e.contentScriptStatus===CONTENT_SCRIPT_STATUSES.READY?(chrome.runtime.onMessage.removeListener(s),await sendRequestToToggleSas(n.id)):e.contentScriptStatus===CONTENT_SCRIPT_STATUSES.UNLOADED&&chrome.runtime.onMessage.removeListener(s)}catch(e){console.log(e)}},sendRequestToToggleSas=async e=>{await chrome.tabs.sendMessage(e,{command:"togglesas"})};export{actionClickHandler};