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
    regionName: "Corona County",                 // Name of region
    url: "http://www.corona.virus/stats",        // URL of health department website
    datePath: "",                                // JS path of date of updated stats
    covidCasesPath: "",                          // JS path of number of positive COVID-19 cases
    covidDeathsPath: ""                          // JS Path of number of COVID-19 deaths
  });
```
Execute the application using Node.js, then navigate to [localhost:8080](http://localhost:8080/):
```
> node app.js
Listening on port 8080
```
