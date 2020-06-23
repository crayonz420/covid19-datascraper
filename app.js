/*

Next steps:
* Refactor scraper.js
  - Condensing algorithms
  - Compatibility with other regions
    - Need to add params in app.js
    - COMPLETE: getArchivedData, writeData
* Get preliminary data for data.json
* Template on line 22, i.e. const alameda = {...}

*/

const express = require('express');
const scraper = require('./scraper');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.static("public"));

app.set("views", "./views");
app.set("view engine", "ejs");
app.set("view options", {
  delimiter: "%"
});

app.get("/", async (req, res) => {
  console.log("Got a GET request");
  let region = req.query.region ? req.query.region : "";
  if (region.toLowerCase() === "alameda") {
    const gatheredData = await scraper.getArchivedData("fetchLast", "alameda");
    res.render("index", {
      dateEntries: await scraper.getArchivedData("entryDates", "alameda").reverse(),
      regionName: "Alameda County",
      date: gatheredData[0],
      posCases: gatheredData[1],
      deathCount: gatheredData[2],
      posCasesDiff: gatheredData[3],
      deathCountDiff: gatheredData[4],
      labels: await scraper.getArchivedData("entryDates", "alameda"),
      data: await scraper.getArchivedData("fetchAllCasesPerDay", "alameda")
    })
  } else if (region.toLowerCase() === "cc") {
    // const gatheredData = await scraper.getArchivedData("fetchLast", "cc");
    res.render("index", {
      dateEntries: await scraper.getArchivedData("entryDates", "cc").reverse(),
      regionName: "Contra Costa County",
      date: "Contra Costa County",
      posCases: "CC cases",
      deathCount: "CC deaths",
      posCasesDiff: "CC case diff",
      deathCountDiff: "CC death diff",
      labels: await scraper.getArchivedData("entryDates", "cc"),
      data: await scraper.getArchivedData("fetchAllCasesPerDay", "cc")
    })
  } else if (region.toLowerCase() === "sf") {
    // const gatheredData = await scraper.getArchivedData("fetchLast", "sf");
    res.render("index", {
      dateEntries: await scraper.getArchivedData("entryDates", "sf").reverse(),
      regionName: "San Francisco",
      date: "SF date",
      posCases: "SF cases",
      deathCount: "SF deaths",
      posCasesDiff: "SF case diff",
      deathCountDiff: "SF death diff",
      labels: await scraper.getArchivedData("entryDates", "sf"),
      data: await scraper.getArchivedData("fetchAllCasesPerDay", "sf")
    })
  } else {
    res.render("index", {
      dateEntries: await scraper.getArchivedData("entryDates", "alameda").reverse(),
      regionName: null,
      date: null,
      posCases: null,
      deathCount: null,
      posCasesDiff: null,
      deathCountDiff: null,
      labels: null,
      data: null
    })
  }
});

app.post("/", async (req, res) => {
  console.log("Got a POST request");
  const gatheredData = await scraper.scrapeData({
    regionId: "alameda",
    regionName: "Alameda County",
    url: "ttps://ac-hcsa.maps.arcgis.com/apps/opsdashboard/index.html#/1e0ac4385cbe4cc1bffe2cf7f8e7f0d9",
    datePath: "body > div > div > div > div > div > div > margin-container > full-container > div:nth-child(2) > margin-container > full-container > div > div > p > em > span",
    covidCasesPath: "body > div > div > div > div > div > div > margin-container > full-container > div:nth-child(4) > margin-container > full-container  > div > div > div > div > svg",
    covidDeathsPath: "body > div > div > div > div > div > div > margin-container > full-container > div:nth-child(5) > margin-container > full-container  > div > div > div > div > svg"
  });
  await res.render("index", {
    dateEntries: await scraper.getArchivedData("entryDates").reverse(),
    date: gatheredData[0],
    posCases: gatheredData[1],
    deathCount: gatheredData[2],
    posCasesDiff: gatheredData[3],
    deathCountDiff: gatheredData[4],
    labels: await scraper.getArchivedData("entryDates"),
    data: await scraper.getArchivedData("fetchAllCasesPerDay")
  });
});

app.listen(port, (error) => {
  error ? console.log(`Error ${error}`) : console.log(`Listening on port ${port}`);
});
