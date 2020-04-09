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
  const dateEntries = await scraper.getArchivedData("entryDates").reverse();
  const gatheredData = await scraper.getArchivedData("fetchLast");
  res.render("index", {
    dateEntries: dateEntries,
    date: gatheredData[0],
    posCases: gatheredData[1],
    deathCount: gatheredData[2],
    posCasesDiff: gatheredData[3],
    deathCountDiff: gatheredData[4],
  })
});

app.post("/", async (req, res) => {
  console.log("Got a POST request");
  const dateEntries = await scraper.getArchivedData("entryDates").reverse();
  const gatheredData = await scraper.scrapeData({
    regionName: "Alameda County",
    url: "http://www.acphd.org/2019-ncov.aspx",
    datePath: "body > div.full_container.middle_full > div > div > div.hall.migi > div > div > div > div > div > p:nth-child(3)",
    covidCasesPath: "body > div.full_container.middle_full > div > div > div.hall.migi > div > div > div > div > div > p:nth-child(4) > em:nth-child(1)",
    covidDeathsPath: "body > div.full_container.middle_full > div > div > div.hall.migi > div > div > div > div > div > p:nth-child(4) > em:nth-child(3)"
  });
  await res.render("index", {
    dateEntries: dateEntries,
    date: gatheredData[0],
    posCases: gatheredData[1],
    deathCount: gatheredData[2],
    posCasesDiff: gatheredData[3],
    deathCountDiff: gatheredData[4],
    timeSinceRefresh: null
  });
});

app.listen(port, (error) => {
  error ? console.log(`Error ${error}`) : console.log(`Listening on port ${port}`);
});
