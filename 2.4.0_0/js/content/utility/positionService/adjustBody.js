"use strict";import{mutableData}from"../../constants/mutableData.js";import{positionConstants}from"../../constants/positionConstants.js";const adjustBody=async()=>{var{DOCKED_LEFT:t,DOCKED_RIGHT:a,AMAZON_EMBEDDED:e,AMAZON_EMBEDDED_WIDE:s}=positionConstants;try{$("#SASContainer")&&$("#SASContainer").hasClass("ui-resizable")&&(mutableData.gDockedState==e||mutableData.gDockedState==s?$("#SASContainer").resizable("disable"):$("#SASContainer").resizable("enable"))}catch(t){console.log(t)}mutableData.gDisplay?mutableData.gDockedState==t?$("body").css({"padding-left":mutableData.gDockedWidth,"padding-right":0}):mutableData.gDockedState==a?$("body").css({"padding-left":0,"padding-right":mutableData.gDockedWidth}):$("body").css({"padding-left":"","padding-right":""}):$("body").css({"padding-left":"","padding-right":""})};export{adjustBody};