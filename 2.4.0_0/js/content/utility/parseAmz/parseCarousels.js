"use strict";import{parseConstants}from"../../constants/parseConstants.js";import{generateElement}from"./generateElement.js";const parseCarousels=async(e=document)=>{const{CAROUSEL_SELECTOR:t,carouselSelectors:s}=parseConstants;e.querySelectorAll(t).forEach(e=>{new MutationObserver(async e=>{for(const t of e){if(!t.oldValue)return;for(const r of t.target.querySelectorAll(s.CARD_SELECTOR))await processCarousel(r)}}).observe(e,{attributes:!0,attributeOldValue:!0,attributeFilter:["aria-busy"]})});for(const r of e.querySelectorAll(s.CARD_SELECTOR))await processCarousel(r)},processCarousel=async e=>{var t,{SAS_LAUNCH_SELECTOR:r,carouselSelectors:s}=parseConstants;e.querySelector(r)||(r=e.querySelector(s.TITLE_SELECTOR))&&(t=e.dataset.asin||JSON.parse(e.dataset.p13nAsinMetadata).asin)&&(e=e.querySelector(s.PRICE_SELECTOR)?e.querySelector(s.PRICE_SELECTOR).textContent.trim():"",s=await generateElement(t,e),r.style="display: inline;",s)&&r.parentElement.insertBefore(s,r)};export{parseCarousels};