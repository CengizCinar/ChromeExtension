"use strict";import{mutableData}from"../constants/mutableData.js";import{getURLCommon}from"./urlsService/getURLCommon.js";import{showSASPanel}from"./toggleSASPanel/showSASPanel.js";const showSasExtensionMessage=async s=>{$("#sasFrame").removeClass("sasdklgc-display"),$("#loadingMessage").addClass("sasdklgc-display"),mutableData.iFrameURL=await getURLCommon()+"&"+$.param(s),showSASPanel(!1)};export{showSasExtensionMessage};