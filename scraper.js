const fs = require('fs');
const colors = require('colors');
const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');

async function scrapeData({
  regionName: regionName,
  url: url,
  datePath: datePath,
  covidCasesPath: covidCasesPath,
  covidDeathsPath: covidDeathsPath
}) {
  puppeteerExtra.use(pluginStealth());
  const browser = await puppeteerExtra.launch({
    headless: true
  });
  const page = await browser.newPage();

  await page.goto(url);
  await page.waitFor(1000);
  await page.screenshot({
    path: "debug.png",
    fullPage: true,
  });

  console.log(`\n${colors.underline("COVID-19 in " + regionName)}`);

  date = await getDate(page, datePath);
  covidCases = await getData("cases", page, covidCasesPath, covidDeathsPath);
  covidDeaths = await getData("deaths", page, covidCasesPath, covidDeathsPath);
  casesDiff = await previousCounts("cases", date);
  deathDiff = await previousCounts("deaths", date);
  await writeData(date, covidCases, covidDeaths, casesDiff, deathDiff);

  console.log(`${colors.gray(date)} \n${colors.red(covidCases)} cases \n${colors.brightRed(covidDeaths)} deaths \n`);
  console.log(`${colors.red(casesDiff)} more cases than yesterday \n${colors.brightRed(deathDiff)} more deaths than yesterday \n`);

  await browser.close();
}

async function getData(type, page, covidCasesPath, covidDeathsPath) {
  let jsPath;
  const casesJSPath = covidCasesPath;
  const deathsJSPath = covidDeathsPath;
  type == "cases" ? jsPath = casesJSPath : jsPath = deathsJSPath;
  const countElement = await page.$(jsPath);
  const countTxt = await (await countElement.getProperty("textContent")).jsonValue();
  const countArray = countTxt.split("");
  if (countArray[countArray.length - 1] == "*") {
    countArray.pop();
  }

  return countArray.join("");
}

async function getDate(page, datePath) {
  const dateElement = await page.$(datePath);
  const dateTxt = await (await dateElement.getProperty("textContent")).jsonValue();
  const dateFormatted = dateTxt.substring(0, dateTxt.indexOf(","));
  return dateFormatted;
}

function previousCounts(type, date) {
  let data = fs.readFileSync("data.json", "utf-8");
  let jsonData = JSON.parse(data);
  if (type == "cases") {
    let todayCasesCount = jsonData[jsonData.length - 1][date]["positiveCases"];
    let yesterdayCasesCount = jsonData[jsonData.length - 2][Object.keys(jsonData[jsonData.length - 2])]["positiveCases"];
    return todayCasesCount - yesterdayCasesCount;
  } else if (type == "deaths") {
    let todayDeathCount = jsonData[jsonData.length - 1][date]["deathCount"];
    let yesterdayDeathCount = jsonData[jsonData.length - 2][Object.keys(jsonData[jsonData.length - 2])]["deathCount"];
    return todayDeathCount - yesterdayDeathCount;
  }
}

function writeData(date, positiveCases, deathCount, changeInCases, changeInDeaths) {
  fs.readFile("data.json", function(err, data) {
    let jsonData = JSON.parse(data);
    if (date in jsonData[jsonData.length - 1]) {
      console.log(`Data for ${date} already exists, not writing to data file.`);
      return null;
    }
    jsonData.push({
      [date]: {
        positiveCases: positiveCases,
        deathCount: deathCount,
        changeInCases: changeInCases,
        changeInDeaths: changeInDeaths
      }
    });
    fs.writeFile("data.json", JSON.stringify(jsonData, null, 2), "utf-8", function() {});
  });
}

scrapeData({
  /*
  regionName: Name of region
  url: URL of data
  datePath: JS query selector path of date
  covidCasesPath: JS query selector path of positive COVID-19 cases
  covidDeathsPath: JS query selector path of COVID-19 deaths
  */
  regionName: "Alameda County",
  url: "http://www.acphd.org/2019-ncov.aspx",
  datePath: "body > div.full_container.middle_full > div > div > div.hall.hidari > div > table > tbody > tr > td > div > p:nth-child(2)",
  covidCasesPath: "body > div.full_container.middle_full > div > div > div.hall.hidari > div > table > tbody > tr > td > div > p:nth-child(3) > em:nth-child(1)",
  covidDeathsPath: "body > div.full_container.middle_full > div > div > div.hall.hidari > div > table > tbody > tr > td > div > p:nth-child(3) > em:nth-child(3)"
});

/*
scrapeData(
  "Contra Costa County",
  "https://www.coronavirus.cchealth.org/",
  "#comp-k8hrbjp9 > p > span",
  "#comp-k8kvfzcf > h1 > span",
  "#comp-k8kvjz6p > h1 > span"
);
*/
