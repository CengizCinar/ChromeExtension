"use strict";import{mutableData}from"../../../constants/mutableData.js";import{setUrl}from"../../urlsService/setUrl.js";import{showSASPanel}from"../../toggleSASPanel/showSASPanel.js";const manageEmbeddedPanel=async()=>{mutableData.gAmazonProductPage&&0<"#rightCol".length?(await setUrl(mutableData.gAsin),await managePanelVisibility()):(mutableData.gAmazonProductPage=!1,mutableData.display=!1)},managePanelVisibility=async()=>{((await chrome.storage.sync.get("options"))?.options)?.isAutoAnalyzer&&(mutableData.display=!0,showSASPanel())};export{manageEmbeddedPanel};