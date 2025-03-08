"use strict";import{COMMAND_COMMAND_EXISTS,COMMAND_EXTENSION_INSTALLED,COMMAND_SHOW_SAS_EXT,GET_TAB_HTML,GET_TAB_URL,GET_VERSION,IS_TAB_ASIN,SUPPORTED_COMMANDS}from"../../../constants/supportedCommands.js";import{sendServerRequest}from"./sendServerRequest/sendServerRequest.js";import{sentrySellerAmp}from"../../../../content/sentrySellerAmp/sentrySellerAmp.js";import{parseAmazonProductPageUrl}from"../../../../content/utility/parseAmz/amazonUrlParser.js";const messageExternalHandler=async(e,a,n)=>{sentrySellerAmp.wrap(function(){handleEvent(e,a,n)})},handleGetTabHtmlCommand=async(e,a,n)=>{e={success:!1,command:e.command,htmlString:void 0};try{var[s]=await chrome.scripting.executeScript({target:{tabId:a.tab?.id},func:()=>document.documentElement.outerHTML});s?.result&&(e.success=!0,e.htmlString=s?.result)}finally{n(e)}},handleGetVersionCommand=async(e,a)=>{var n=chrome.runtime.getManifest();a({success:!0,command:e.command,version:n.version})},handleGetTabUrlCommand=async(e,a,n)=>{e={success:!1,command:e.command,url:void 0},a=a.tab?.url;a&&(e.url=a,e.success=!0),n(e)},handleIsTabAsinCommand=async(e,a,n)=>{var s={success:!1,command:e.command,isTabAsin:!1},a=a.tab?.url;a&&(a=parseAmazonProductPageUrl(a))&&(a=a[5],s.isTabAsin=a===e.asin,s.success=!0),n(s)},handleEvent=async(a,n,s)=>{if(a.command==COMMAND_COMMAND_EXISTS)s({result:SUPPORTED_COMMANDS.includes(a.command_name),command_name:a.command_name});else if(a.command===GET_VERSION)await handleGetVersionCommand(a,s);else if(a.command===GET_TAB_HTML)await handleGetTabHtmlCommand(a,n,s);else if(a.command===GET_TAB_URL)await handleGetTabUrlCommand(a,n,s);else if(a.command===IS_TAB_ASIN)await handleIsTabAsinCommand(a,n,s);else if(a.command==COMMAND_SHOW_SAS_EXT)chrome.tabs.query({active:!0,currentWindow:!0},function(e){chrome.tabs.sendMessage(n.tab.id,a,function(e){s(e)})});else{var e;if(a.type!==COMMAND_EXTENSION_INSTALLED)return e=a.input.match(/https:\/\/www.amazon.+gp\/aw\/c.+ssas.+=.+sass.+sasRequestId=\d+/),a.input.match(/https:\/\/data.amazon.+\/api\/marketplaces\/.+\/cart\/carts\/retail\/items/)||e?setTimeout(()=>sendServerRequest(a,s),1e3):await sendServerRequest(a,s),!0;s({result:!0,command_name:a.command_name})}};export{messageExternalHandler};