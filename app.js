const express = require('express');
const scraper = require('./scraper');
const app = express();
const port = 8080;

app.use(express.static("public"));

app.set("views", "./views");
app.set("view engine", "ejs");
app.set("view options", {delimiter: "%"});

app.get("/", async (req, res) => {
  const gatheredData = await scraper.scrapeData({
    regionName: "Alameda County",
    url: "http://www.acphd.org/2019-ncov.aspx",
    datePath: "body > div.full_container.middle_full > div > div > div.hall.hidari > div > table > tbody > tr > td > div > p:nth-child(2)",
    covidCasesPath: "body > div.full_container.middle_full > div > div > div.hall.hidari > div > table > tbody > tr > td > div > p:nth-child(3) > em:nth-child(1)",
    covidDeathsPath: "body > div.full_container.middle_full > div > div > div.hall.hidari > div > table > tbody > tr > td > div > p:nth-child(3) > em:nth-child(3)"
  });
  await res.render("index", {date: gatheredData[0], posCases: gatheredData[1], deathCount: gatheredData[2]});
});

app.post("/", (req, res) => {
  console.log("Got a POST request");
  res.redirect("/");
});

app.listen(port, (error) => {
  error ? console.log(`Error ${error}`) : console.log(`Listening on port ${port}`);
});