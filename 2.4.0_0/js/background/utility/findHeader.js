"use strict";const findHeader=(e,r)=>{const t=new RegExp(r+"=([^;]+);");return{header:e.find(e=>"set-cookie"===e.name.toLowerCase()&&e.value.match(t)),regex:t}};export{findHeader};