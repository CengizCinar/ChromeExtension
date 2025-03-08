"use strict";import{positionConstants}from"../../constants/positionConstants.js";import{urlConstants}from"../../constants/urlConstants.js";const getPositionsToolbar=async s=>{var{PANEL_POSITIONS:i,AMAZON_EMBEDDED:o,AMAZON_EMBEDDED_WIDE:a}=positionConstants,{baseURL:t,historyUrl:e,settingsUrl:l}=urlConstants,n=chrome.runtime.getURL,t=`
<li id="home-btn" >
  <a href="${t}" target="sasFrame" ><img src="${n("images/house-chimney.svg")}" title="Home" alt="home"/>
</li>`,e=`
<li id="history-btn" >
  <a href="${e}" target="sasFrame" ><img src="${n("images/clock-rotate-left.svg")}" title="History" alt="history"/>
</li>`,l=`
<li id="settings-btn" >
  <a href="${l}" target="sasFrame" ><img src="${n("images/gear.svg")}" title="Settings" alt="settings"/>
</li>`,r=`
<li  id="contact-btn">
  <a href="mailto:support@selleramp.com" target="_blank" >
    <img src="${n("images/envelope.svg")}" title="Contact" alt="contact"/>
  </a>
</li>`;let g='<nav class="sasdklgc-menu"><ul id="position-buttons" class="sasdklgc-toolbar-buttons">';for(let t=0;t<i.length;t++)(s||i[t].id!=o&&i[t].id!=a)&&(g=g+'<li id="li-pos-'+i[t].id+'" data-position="'+i[t].id+'"><img src="'+n("images/"+i[t].img)+'" title="'+i[t].desc+'" /></li>');return g=(g+='</ul><ul id="url-buttons" class="sasdklgc-toolbar-buttons">')+(t+e+l+r)+"</ul></nav>"};export{getPositionsToolbar};