const TARGET_SELECTOR=".s-main-slot",SAS_LAUNCH_CLASSNAME="sas-launch-ext-link",SAS_LAUNCH_SELECTOR="."+SAS_LAUNCH_CLASSNAME,selectors=[{CARD_SELECTOR:'[data-asin]:not([data-asin=""]).s-result-item',TITLE_SELECTOR:"h2",PRICE_WHOLE_SELECTOR:".a-price-whole",PRICE_DECIMAL_SELECTOR:".a-price-decimal",PRICE_FRANCTION_SELECTOR:".a-price-fraction"},{CARD_SELECTOR:'[data-asin]:not([data-asin=""]).s-inner-result-item',TITLE_SELECTOR:"h2",PRICE_WHOLE_SELECTOR:".a-price-whole",PRICE_DECIMAL_SELECTOR:".a-price-decimal",PRICE_FRANCTION_SELECTOR:".a-price-fraction"}],CAROUSEL_SELECTOR=".a-carousel",carouselSelectors={CARD_SELECTOR:'.a-carousel-card [data-p13n-asin-metadata]:not([data-p13n-asin-metadata=""])',TITLE_SELECTOR:".sponsored-products-truncator-truncated,.p13n-sc-truncate-desktop-type2",PRICE_SELECTOR:".a-color-price,.p13n-sc-price"},zone=location.hostname.replace("www.amazon.",""),observerOptions={childList:!0},decimal={ca:".",cn:".","com.au":".","com.br":",",de:",",fr:",",in:".",it:",","co.jp":".","com.mx":".",nl:",",sg:".",es:",","com.tr":",",ae:".","co.uk":".",com:"."},parseConstants={TARGET_SELECTOR:TARGET_SELECTOR,SAS_LAUNCH_CLASSNAME:SAS_LAUNCH_CLASSNAME,SAS_LAUNCH_SELECTOR:SAS_LAUNCH_SELECTOR,selectors:selectors,CAROUSEL_SELECTOR:CAROUSEL_SELECTOR,carouselSelectors:carouselSelectors,zone:zone,observerOptions:observerOptions,decimal:decimal};export{parseConstants};