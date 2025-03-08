"use strict";import{mutableData}from"../../constants/mutableData.js";import{positionConstants}from"../../constants/positionConstants.js";import{adjustBody}from"./adjustBody.js";const loadSASPanelPosition=async()=>{var{FLOATING:t,DOCKED_LEFT:a,DOCKED_RIGHT:e,AMAZON_EMBEDDED:o,AMAZON_EMBEDDED_WIDE:d}=positionConstants;if($("body").removeClass("docked-right docked-left"),$("#SASContainer").removeClass("docked docked-left docked-right floating embedded embedded_wide modal_popup"),mutableData.gDockedState!=t&&($("#SASContainer").removeAttr("style"),$("#SASContainer").draggable(),$("#SASContainer").draggable("disable"),$(".first-row").removeClass("drag-handle")),mutableData.gDockedState==t){$("#SASContainer").draggable(),$("#SASContainer").draggable("enable"),$(".first-row").addClass("drag-handle");var t=$(window).height(),i=$(window).width();mutableData.gFloatingLeft+mutableData.gFloatingWidth>i&&(mutableData.gFloatingLeft=Math.max(0,i-mutableData.gFloatingWidth)),mutableData.gFloatingTop+mutableData.gFloatingHeight>t&&(mutableData.gFloatingTop=Math.max(t-mutableData.gFloatingHeight,0)),$("#SASContainer").css({top:mutableData.gFloatingTop,left:mutableData.gFloatingLeft,height:mutableData.gFloatingHeight,width:mutableData.gFloatingWidth}),$("#SASContainer").addClass("floating")}else if(mutableData.gDockedState==a)$("#SASContainer").addClass("docked docked-left"),$("#SASContainer").css({width:mutableData.gDockedWidth});else if(mutableData.gDockedState==e)$("#SASContainer").addClass("docked docked-right"),$("#SASContainer").css({width:mutableData.gDockedWidth});else if(mutableData.gDockedState==o){i=!!document.querySelector("#rightCol #SASContainer");$("#SASContainer").addClass("embedded"),i||$("#SASContainer").detach().prependTo("#rightCol")}else if(mutableData.gDockedState==d){t=$("#centerCol").children().first();if(!t.length)return mutableData.gDockedState=o,void await loadSASPanelPosition();$("#SASContainer").addClass("embedded_wide"),!document.querySelector("#centerCol #SASContainer")&&t.after($("#SASContainer").detach())}adjustBody(),$("#position-buttons li").removeClass("selected-button "),$("#li-pos-"+mutableData.gDockedState).addClass("selected-button")};export{loadSASPanelPosition};