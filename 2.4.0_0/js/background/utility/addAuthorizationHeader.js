import{ruleNameIDs}from"../constants/ruleNameIDs.js";import{httpHeaderNames}from"../constants/httpHeaderNames.js";import{headerOperation}from"../constants/declarativeNetRequestConstants.js";import{netRequestAPI}from"./netRequestAPI.js";import{INSTANCE_PATH}from"../constants/instanceConstants.js";const EMPTY_TOKEN_LENGTH=6,addAuthorizationHeader=()=>{var e,t,a="Basic ";a.length!==EMPTY_TOKEN_LENGTH&&(e=ruleNameIDs.setAuthorizationHeader,t=httpHeaderNames["authorization"],t=[{operation:headerOperation.SET,header:t,value:a}],netRequestAPI.updateRequestHeaders({id:e,requestHeaders:t,urlFilter:`https://${INSTANCE_PATH}.selleramp.com/*`,isSessionRule:!1}))};export{addAuthorizationHeader};