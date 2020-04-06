# COVID-19 Data Scraper

Scrapes county health department websites for COVID-19 (Coronavirus) data

## Packages

- Puppeteer for web scraping
- Express and EJS for web server

## Usage

Modify app.js such that:
```js
// Note: You can get JS path using "Inspect Element > Copy > Copy JS Path"
const gatheredData = await scraper.scrapeData({
    regionName: "Alameda County",                   // Name of region
    url: "http://www.acphd.org/2019-ncov.aspx",     // URL of health department website
    datePath: "",                                   // JS path of date of updated stats
    covidCasesPath: "",                             // JS path of number of positive COVID-19 cases
    covidDeathsPath: ""                             // JS Path of number of COVID-19 deaths
  });
```
