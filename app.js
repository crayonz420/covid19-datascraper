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
  const gatheredData = await scraper.getArchivedData("fetchLast");
  res.render("index", {
    dateEntries: await scraper.getArchivedData("entryDates").reverse(),
    date: gatheredData[0],
    posCases: gatheredData[1],
    deathCount: gatheredData[2],
    posCasesDiff: gatheredData[3],
    deathCountDiff: gatheredData[4],
    labels: await scraper.getArchivedData("entryDates"),
    data: await scraper.getArchivedData("fetchAllCasesPerDay")
  })
});

app.post("/", async (req, res) => {
  console.log("Got a POST request");
  const gatheredData = await scraper.scrapeData({
    regionName: "Alameda County",
    url: "https://ac-hcsa.maps.arcgis.com/apps/opsdashboard/index.html#/0e964821bf1844029c6b72303d7efa00",
    datePath: "body > div > div > div > div > div > div > margin-container > full-container > div:nth-child(2) > margin-container > full-container > div > div > p > em > span > strong",
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
